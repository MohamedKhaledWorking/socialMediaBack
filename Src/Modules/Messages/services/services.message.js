import { MessageModel } from "../../../DB/Models/Message.model.js";

export const allMessages = async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  const messages = await MessageModel.find()
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender receiver", "username profileImage");

  const totalMessages = await MessageModel.countDocuments();

  return res.status(200).json({
    status: "success",
    messages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
      hasNext: skip + messages.length < totalMessages,
      hasPrev: page > 1,
    },
  });
}
export const getFriendMessages = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const friendId = req.params.friendId;
  const userId = req.user._id;

  if (!friendId) {
    return res
      .status(404)
      .json({ status: "failure", message: "Friend is not exist" });
  }
  if (friendId === userId.toString()) {
    return res.status(400).json({
      status: "failure",
      message: "You cannot get messages with yourself",
    });
  }

  // Assuming MessageModel is imported and available
  const messages = await MessageModel.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId },
    ],
  })
    .sort({ sentAt: -1 })
    .limit(limit)
    .populate("sender receiver", "username profileImage");

  const totalMessages = await MessageModel.countDocuments({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId },
    ],
  });

  if (!messages) {
    return res
      .status(404)
      .json({ status: "failure", message: "No messages found" });
  }
  res.status(200).json({
    status: "success",
    messages,
    pagination: {
      totalMessages: totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: parseInt(page),
      hasPrevPage: page > 1,
      hasNextPage: skip + limit < totalMessages,
    },
  });
};

export const adminDeleteMessage = async(req ,res) => {
    const messageId = req.params.messageId;
    if (!messageId) {
        return res.status(400).json({ status: "failure", message: "Message ID is required" });
    }
    const deletedMessage = await MessageModel.findByIdAndDelete(messageId);
    if (!deletedMessage) {
        return res.status(404).json({ status: "failure", message: "Message not found" });
    }
    return res.status(200).json({ status: "success", message: "Message deleted successfully" });
}