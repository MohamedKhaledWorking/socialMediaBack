import { applyReaction, clearReaction } from "./reaction.core.js";

export const upsertReaction = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;
  const { type } = req.body;

  const { reaction, post } = await applyReaction({ userId, postId, type });
  return res.status(200).json({
    status: "success",
    message: "Reaction updated successfully",
    reaction,
    post,
  });
};

export const removeReaction = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const { post } = await clearReaction({ userId, postId });
  return res.status(200).json({
    status: "success",
    message: "Reaction removed",
    post,
  });
};
