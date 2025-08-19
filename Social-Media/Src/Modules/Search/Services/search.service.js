import { UserModel } from "../../../DB/Models/User.model.js";
import { PostModel } from "../../../DB/Models/Post.model.js";

// Search users by username or email
export const searchUsers = async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      status: "failure",
      error: "Search query must be at least 2 characters long",
    });
  }

  const searchRegex = new RegExp(query.trim(), "i");
  
  const users = await UserModel.find({
    $or: [
      { username: searchRegex },
      { email: searchRegex },
    ],
    isActive: true,
    isDeleted: false,
  })
    .select("username email profileImage bio isVerified")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ username: 1 });

  const total = await UserModel.countDocuments({
    $or: [
      { username: searchRegex },
      { email: searchRegex },
    ],
    isActive: true,
    isDeleted: false,
  });

  return res.status(200).json({
    status: "success",
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasNext: skip + users.length < total,
      hasPrev: page > 1,
    },
  });
};

// Search posts by content or hashtags
export const searchPosts = async (req, res) => {
  const { query, page = 1, limit = 10, privacy = "public" } = req.query;
  const skip = (page - 1) * limit;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      status: "failure",
      error: "Search query must be at least 2 characters long",
    });
  }

  const searchRegex = new RegExp(query.trim(), "i");
  
  const posts = await PostModel.find({
    $or: [
      { content: searchRegex },
      { tags: { $in: [searchRegex] } },
    ],
    privacy,
    isDeleted: false,
  })
    .populate("user", "username profileImage")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await PostModel.countDocuments({
    $or: [
      { content: searchRegex },
      { tags: { $in: [searchRegex] } },
    ],
    privacy,
    isDeleted: false,
  });

  return res.status(200).json({
    status: "success",
    posts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasNext: skip + posts.length < total,
      hasPrev: page > 1,
    },
  });
}; 