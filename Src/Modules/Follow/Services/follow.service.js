import { FollowerModel } from "../../../DB/Models/Follower.model.js";
import { UserModel } from "../../../DB/Models/User.model.js";
// import { createNotification } from "../../Notification/Services/notification.service.js";

// Socket.IO instance (will be set from app.controller.js)
// let io = null;

// Function to set Socket.IO instance
// export const setSocketIO = (socketIO) => {
//   io = socketIO;
// };

export const followUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (currentUserId.toString() === userId) {
    return res.status(400).json({
      status: "failure",
      error: "You cannot follow yourself",
    });
  }

  const targetUser = await UserModel.findById(userId);
  if (!targetUser) {
    return res.status(404).json({
      status: "failure",
      error: "User not found",
    });
  }

  const existingFollow = await FollowerModel.findOne({
    follower: currentUserId,
    following: userId,
  });

  if (existingFollow) {
    return res.status(400).json({
      status: "failure",
      error: "You are already following this user",
    });
  }

  const follow = await FollowerModel.create({
    follower: currentUserId,
    following: userId,
  });

  await UserModel.findByIdAndUpdate(userId, {
    $push: { followers: currentUserId },
  });
  await UserModel.findByIdAndUpdate(currentUserId, {
    $push: { following: userId },
  });

  // await createNotification({
  //   userId: userId,
  //   type: "new_follow",
  //   fromUser: currentUserId,
  //   message: `${req.user.username} started following you`,
  //   metadata: { followerId: currentUserId },
  // });

  // if (io) {
  //   io.to(`user_${userId}`).emit("new_notification", {
  //     type: "new_follow",
  //     fromUser: {
  //       _id: currentUserId,
  //       username: req.user.username,
  //       profileImage: req.user.profileImage,
  //     },
  //     message: `${req.user.username} started following you`,
  //   });
  // }

  return res.status(201).json({
    status: "success",
    message: "User followed successfully",
  });
};

export const unfollowUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  const follow = await FollowerModel.findOneAndDelete({
    follower: currentUserId,
    following: userId,
  });

  if (!follow) {
    return res.status(404).json({
      status: "failure",
      error: "Follow relationship not found",
    });
  }

  await UserModel.findByIdAndUpdate(userId, {
    $pull: { followers: currentUserId },
  });
  await UserModel.findByIdAndUpdate(currentUserId, {
    $pull: { following: userId },
  });

  return res.status(200).json({
    status: "success",
    message: "User unfollowed successfully",
  });
};

export const getFollowers = async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const followers = await FollowerModel.find({ following: currentUserId })
    .populate("follower", "username profileImage email")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await FollowerModel.countDocuments({
    following: currentUserId,
  });

  return res.status(200).json({
    status: "success",
    followers,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalFollowers: total,
      hasNext: skip + followers.length < total,
      hasPrev: page > 1,
    },
  });
};

export const getFollowing = async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const following = await FollowerModel.find({ follower: currentUserId })
    .populate("following", "username profileImage email")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await FollowerModel.countDocuments({ follower: currentUserId });

  return res.status(200).json({
    status: "success",
    following,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalFollowing: total,
      hasNext: skip + following.length < total,
      hasPrev: page > 1,
    },
  });
};


