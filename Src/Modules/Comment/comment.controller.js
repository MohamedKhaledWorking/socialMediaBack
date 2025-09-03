// Modules/Comment/comment.controller.js
import {
  createComment,
  deleteComment,
  listComments,
} from "./services/comment.service.js";

export async function httpCreateComment(req, res) {
  try {
    const { postId, content, media, parentId } = req.body;
    const userId = req.user._id;
    const { comment, commentsCount } = await createComment({
      postId,
      userId,
      content,
      media,
      parentId,
    });
    res.json({ status: "success", comment, commentsCount });
  } catch (e) {
    res
      .status(400)
      .json({ status: "fail", message: e.message || "Failed to add comment" });
  }
}

export async function httpDeleteComment(req, res) {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    const result = await deleteComment({ commentId, userId });
    if (!result.ok)
      return res
        .status(404)
        .json({ status: "fail", message: "Comment not found" });
    res.json({
      status: "success",
      postId: result.postId,
      commentsCount: result.commentsCount,
    });
  } catch (e) {
    res
      .status(400)
      .json({
        status: "fail",
        message: e.message || "Failed to delete comment",
      });
  }
}

export async function httpListComments(req, res) {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const data = await listComments({ postId, page, limit });
    res.json({ status: "success", ...data });
  } catch (e) {
    res
      .status(400)
      .json({
        status: "fail",
        message: e.message || "Failed to fetch comments",
      });
  }
}
