import { createComment, deleteComment, listComments } from "./services/comment.service.js";

export const httpCreateComment = async (req, res) => {
  const { postId } = req.params;
  const { content, media } = req.body;
  const userId = req.user._id;

  if (!content || !content.trim()) {
    return res.status(400).json({ status: "error", message: "Content is required" });
  }

  const { comment, commentsCount } = await createComment({ postId, userId, content: content.trim(), media });
  return res.json({ status: "success", comment, commentsCount });
};

export const httpDeleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const result = await deleteComment({ commentId, userId });
  if (!result.ok) {
    return res.status(404).json({ status: "error", message: "Comment not found" });
  }
  return res.json({ status: "success", postId: result.postId, commentsCount: result.commentsCount });
};

export const httpListComments = async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const data = await listComments({ postId, page, limit });
  return res.json({ status: "success", ...data });
};
