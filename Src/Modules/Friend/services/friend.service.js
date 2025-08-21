import mongoose from "mongoose";
import { FriendModel } from "../../../DB/Models/Friend.model.js";
import { UserModel } from "../../../DB/Models/User.model.js";

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

export const addFriend = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user._id;

  if (!isObjectId(friendId)) {
    return res
      .status(400)
      .json({ status: "failure", message: "Invalid friendId" });
  }

  if (String(userId) === String(friendId)) {
    return res
      .status(400)
      .json({ status: "failure", message: "You cannot add yourself" });
  }

  const [user, friend] = await Promise.all([
    UserModel.findById(userId).select("_id"),
    UserModel.findById(friendId).select("_id"),
  ]);
  if (!user)
    return res
      .status(404)
      .json({ status: "failure", message: "User not found" });
  if (!friend)
    return res
      .status(404)
      .json({ status: "failure", message: "Friend not found" });

  const alreadyFriends = await UserModel.exists({
    _id: userId,
    friends: friendId,
  });
  if (alreadyFriends) {
    return res
      .status(400)
      .json({ status: "failure", message: "Already friends" });
  }

  const pending = await FriendModel.findOne({
    $or: [
      { createdBy: userId, friendId },
      { createdBy: friendId, friendId: userId },
    ],
  });
  if (pending) {
    return res
      .status(400)
      .json({ status: "failure", message: "Friend request already pending" });
  }

  await FriendModel.create({ createdBy: userId, friendId });
  return res
    .status(201)
    .json({ status: "success", message: "Friend request sent" });
};

export const acceptFriend = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { friendId } = req.params;
  const userId = req.user._id;

  if (!isObjectId(friendId)) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(400)
      .json({ status: "failure", message: "Invalid friendId" });
  }

  const pending = await FriendModel.findOne({
    createdBy: friendId,
    friendId: userId,
  }).session(session);

  if (!pending) {
    await session.abortTransaction();
    session.endSession();
    return res.status(404).json({
      status: "failure",
      message: "already friends or no pending request from this user",
    });
  }

  await Promise.all([
    UserModel.updateOne(
      { _id: userId },
      { $addToSet: { friends: friendId } }
    ).session(session),
    UserModel.updateOne(
      { _id: friendId },
      { $addToSet: { friends: userId } }
    ).session(session),
    FriendModel.deleteOne({ _id: pending._id }).session(session),
  ]);

  await session.commitTransaction();
  session.endSession();
  return res
    .status(200)
    .json({ status: "success", message: "Friend request accepted" });
};

export const rejectFriend = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user._id;

  if (!isObjectId(friendId)) {
    return res
      .status(400)
      .json({ status: "failure", message: "Invalid friendId" });
  }

  const removed = await FriendModel.findOneAndDelete({
    createdBy: friendId,
    friendId: userId,
  });

  if (!removed) {
    return res.status(404).json({
      status: "failure",
      message: "No pending request from this user",
    });
  }

  return res
    .status(200)
    .json({ status: "success", message: "Friend request rejected" });
};

export const unfriend = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { friendId } = req.params;
    const userId = req.user._id;

    if (!isObjectId(friendId)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ status: "failure", message: "Invalid friendId" });
    }

    if (String(userId) === String(friendId)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ status: "failure", message: "You cannot unfriend yourself" });
    }

    // Ensure they are friends
    const areFriends = await UserModel.exists({
      _id: userId,
      friends: friendId,
    }).session(session);
    if (!areFriends) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ status: "failure", message: "You are not friends" });
    }

    // Remove both sides
    await Promise.all([
      UserModel.updateOne(
        { _id: userId },
        { $pull: { friends: friendId } }
      ).session(session),
      UserModel.updateOne(
        { _id: friendId },
        { $pull: { friends: userId } }
      ).session(session),
    ]);

    await session.commitTransaction();
    session.endSession();
    return res
      .status(200)
      .json({ status: "success", message: "Unfriended successfully" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ status: "failure", message: err.message });
  }
};

export const getFriends = async (req, res) => {
  const userId = req.user._id;
  const friends = await UserModel.findById(userId)
    .select("friends")
    .populate({ path: "friends", select: "username profileImage email" });
  return res.status(200).json({ status: "success", friends: friends.friends });
};

export const getSuggestedFriends = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit ?? "10", 10))
  );
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: { _id: userId } },
    { $project: { friends: 1 } },

    {
      $lookup: {
        from: "users",
        localField: "friends",
        foreignField: "_id",
        as: "friendDocs",
        pipeline: [{ $project: { friends: 1 } }],
      },
    },
    { $unwind: "$friendDocs" },
    { $unwind: "$friendDocs.friends" },

    {
      $group: {
        _id: "$friendDocs.friends",
        mutualCount: { $sum: 1 },
        myFriends: { $first: "$friends" },
      },
    },

    {
      $match: {
        $expr: {
          $and: [
            { $ne: ["$_id", userId] },
            { $not: { $in: ["$_id", "$myFriends"] } },
          ],
        },
      },
    },

    {
      $lookup: {
        from: "friends",
        let: { candidateId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ["$createdBy", userId] },
                      { $eq: ["$friendId", "$$candidateId"] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ["$createdBy", "$$candidateId"] },
                      { $eq: ["$friendId", userId] },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "pending",
      },
    },
    { $match: { "pending.0": { $exists: false } } },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { username: 1, profileImage: 1, email: 1 } }],
      },
    },
    { $unwind: "$user" },

    {
      $project: {
        _id: "$user._id",
        username: "$user.username",
        profileImage: "$user.profileImage",
        email: "$user.email",
        mutualCount: 1,
      },
    },

    { $sort: { mutualCount: -1, _id: 1 } },

    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
    { $unwind: { path: "$totalCount", preserveNullAndEmptyArrays: true } },
    { $project: { data: 1, total: { $ifNull: ["$totalCount.count", 0] } } },
  ];

  const result = await UserModel.aggregate(pipeline);
  const payload = result[0] ?? { data: [], total: 0 };
  const pages = Math.ceil(payload.total / limit) || 1;

  return res.status(200).json({
    status: "success",
    page,
    limit,
    total: payload.total,
    pages,
    suggestions: payload.data,
  });
};
