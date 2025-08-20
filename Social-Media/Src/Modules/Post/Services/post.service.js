import { PostModel } from "../../../DB/Models/Post.model.js";
import { UserModel } from "../../../DB/Models/User.model.js";
import { ReactionModel } from "../../../DB/Models/Reaction.model.js";
import { cloudinary } from "../../../Utils/cloudinary.utils.js";

export const createPost = async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  const imagePromises = (req.files?.image ?? []).map((img, idx) => ({
    type: "image",
    position: idx,
    promise: cloudinary().uploader.upload(img.path, {
      folder: "social/post/images",
      resource_type: "image",
    }),
  }));

  const videoPromises = (req.files?.video ?? []).map((vid, idx) => ({
    type: "video",
    position: idx, 
    promise: cloudinary().uploader.upload(vid.path, {
      folder: "social/post/videos",
      resource_type: "video", 
    }),
  }));

  const tasks = [...imagePromises, ...videoPromises];

  const settled = await Promise.allSettled(tasks.map(t => t.promise));

  const media = settled
    .map((result, i) => ({ result, meta: tasks[i] }))
    .filter(({ result }) => result.status === "fulfilled")
    .map(({ result, meta }) => {
      const { secure_url, public_id, resource_type, format, bytes, width, height } = result.value;
      return {
        type: meta.type,           
        url: secure_url,
        public_id,
        resource_type,
        format,
        size: bytes,
        width,
        height,
      };
    });

  const failed = settled.filter(s => s.status === "rejected");
  if (failed.length && media.length === 0) {
    return res.status(500).json({
      status: "failure",
      error: "Failed to upload media",
      details: failed.map(f => f.reason?.message ?? "unknown error"),
    });
  }

  const post = await PostModel.create({
    user: userId,
    media,           
    ...data,
  });

  await post.populate("user", "username profileImage");

  return res.status(201).json({
    status: "success",
    message:
      failed.length === 0
        ? "Post created successfully"
        : `Post created (some media failed to upload: ${failed.length})`,
    post,
  });
};

export const updatePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;
  const data = req.body;

  const post = await PostModel.findById(postId);
  if (!post) {
    return res.status(404).json({
      status: "failure",
      error: "Post not found",
    });
  }

  await PostModel.findOneAndUpdate(
    { _id: postId, user: userId },
    { ...data },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Image updated successfully",
  });
};

export const getAllPosts = async (req, res) => {
  const {
    page = 1,
    limit = 5,
    privacy = "public",
    postType,
    mood,
  } = req.query;
  const skip = (page - 1) * limit;

  const filter = { privacy };

  if (postType) filter.postType = postType;
  if (mood) filter.mood = mood;

  const posts = await PostModel.find(filter)
    .populate("user", "username profileImage email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PostModel.countDocuments(filter);

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

export const getPostById = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await PostModel.findById(postId)
    .populate("user", "username profileImage")
    .populate("sharedPostId", "content user");

  if (!post) {
    return res.status(404).json({
      status: "failure",
      error: "Post not found",
    });
  }

  // Check if user can view this post based on privacy settings
  if (
    post.privacy === "private" &&
    post.user._id.toString() !== userId.toString()
  ) {
    return res.status(403).json({
      status: "failure",
      error: "Access denied",
    });
  }

  // Increment view count
  post.views += 1;
  await post.save();

  return res.status(200).json({
    status: "success",
    post,
  });
};

export const getMyPosts = async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const posts = await PostModel.find({ user: userId })
    .populate("user", "username profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PostModel.countDocuments({ user: userId });

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

export const getPostsByUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({
      status: "failure",
      error: "User not found",
    });
  }

  let filter = { user: userId };

  if (userId !== currentUserId.toString()) {
    filter.privacy = { $in: ["public", "friends"] };
  } 

  const posts = await PostModel.find(filter)
    .populate("user", "username profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PostModel.countDocuments(filter);

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

export const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await PostModel.findById(postId);

  if (!post) {
    return res.status(404).json({
      status: "failure",
      error: "Post not found",
    });
  }

  if (post.user.toString() !== userId.toString()) {
    return res.status(403).json({
      status: "failure",
      error: "You can only delete your own posts",
    });
  }

  if (post.media.length > 0) {
    for (const image of post.media) {
      await cloudinary().uploader.destroy(image.public_id);
    }
  }

  await PostModel.findByIdAndDelete(postId);

  return res.status(200).json({
    status: "success",
    message: "Post deleted successfully",
  });
};

export const adminDeletePost = async (req, res) => {
  const { postId } = req.params;
  const post = await PostModel.findById(postId);

  if (!post) {
    return res.status(404).json({
      status: "failure",
      error: "Post not found",
    });
  }

  if (post?.images?.length > 0) {
    for (const image of post.media) {
      await cloudinary.uploader.destroy(image?.public_id);
    }
  }

  await PostModel.findByIdAndDelete(postId);
  return res.status(200).json({
    status: "success",
    message: "Post deleted successfully",
  });
};

export const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await PostModel.findById(postId);
  if (!post) {
    return res.status(404).json({
      status: "failure",
      error: "Post not found",
    });
  }

  const existingReaction = await ReactionModel.findOne({
    user: userId,
    post: postId,
    type: "like",
  });

  if (existingReaction) {
    return res.status(400).json({
      status: "failure",
      error: "You have already liked this post",
    });
  }

  // Create reaction
  await ReactionModel.create({
    user: userId,
    post: postId,
    type: "like",
  });

  // Update post like count
  post.likesCount += 1;
  await post.save();

  return res.status(200).json({
    status: "success",
    message: "Post liked successfully",
  });
};

// Unlike a post
export const unlikePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await PostModel.findById(postId);
  if (!post) {
    return res.status(404).json({
      status: "failure",
      error: "Post not found",
    });
  }

  // Remove reaction
  const deletedReaction = await ReactionModel.findOneAndDelete({
    user: userId,
    post: postId,
    type: "like",
  });

  if (!deletedReaction) {
    return res.status(400).json({
      status: "failure",
      error: "You have not liked this post",
    });
  }

  // Update post like count
  post.likesCount = Math.max(0, post.likesCount - 1);
  await post.save();

  return res.status(200).json({
    status: "success",
    message: "Post unliked successfully",
  });
};

// Share a post
export const sharePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;
  const { content, privacy = "public" } = req.body;

  const originalPost = await PostModel.findById(postId).populate(
    "user",
    "username profileImage"
  );

  if (!originalPost) {
    return res.status(404).json({
      status: "failure",
      error: "Original post not found",
    });
  }

  // Create a new post that references the original
  const sharedPost = await PostModel.create({
    user: userId,
    content: content || `Shared: ${originalPost.content}`,
    sharedPostId: postId,
    privacy,
    postType: "text",
  });

  await sharedPost.populate("user", "username profileImage");
  await sharedPost.populate("sharedPostId", "content user");

  return res.status(201).json({
    status: "success",
    message: "Post shared successfully",
    post: sharedPost,
  });
};

