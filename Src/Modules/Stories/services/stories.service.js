import fs from "node:fs/promises";
import mongoose from "mongoose";
import { StoryModel } from "../../../DB/Models/Story.model.js";
import { cloudinary as getCloudinary } from "../../../Utils/cloudinary.utils.js";
import { UserModel } from "../../../DB/Models/User.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const uploadOne = async (cld, file) => {
  const result = await cld.uploader.upload(file.path, {
    folder: "stories",
    resource_type: "auto",
  });
  try {
    await fs.unlink(file.path);
  } catch {}
  return {
    url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
  };
};

export const createStory = async (req, res) => {
  const userId = req.user._id;
  const cld = getCloudinary();

  const images = req.files?.image ?? [];
  const videos = req.files?.video ?? [];
  const allFiles = [...images, ...videos];

  if (allFiles.length === 0) {
    return res.status(400).json({
      status: "failure",
      message: "Please upload at least one image or video",
    });
  }

  const uploads = await Promise.all(allFiles.map((f) => uploadOne(cld, f)));
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const firstImage = uploads.find((u) => u.resource_type === "image");
  let thumbnail;
  if (firstImage) {
    thumbnail = firstImage.url;
  } else {
    const firstVideo = uploads.find((u) => u.resource_type === "video");
    thumbnail = cld.url(firstVideo.public_id, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        {
          start_offset: 1,
          width: 600,
          height: 600,
          crop: "fill",
          gravity: "auto",
        },
      ],
    });
  }

  const story = await StoryModel.create({
    user: userId,
    thumbnail,
    media: uploads.map((u) => ({ url: u.url, public_id: u.public_id })), // match your schema
    caption: req.body.caption,
    link: req.body.link,
    expiresAt,
  });

  return res.status(201).json({ status: "success", story });
};

export const deleteStory = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ status: "failure", message: "Invalid story id" });
  }

  const story = await StoryModel.findOne({ _id: id, user: userId }).select(
    "media"
  );
  if (!story) {
    return res.status(404).json({
      status: "failure",
      message: "Story not found or not owned by you",
    });
  }

  const cld = getCloudinary();
  const publicIds = story.media.map((m) => m.public_id);

  if (publicIds.length) {
    await cld.api.delete_resources(publicIds, { resource_type: "image" });
    await cld.api.delete_resources(publicIds, { resource_type: "video" });
  }

  await StoryModel.deleteOne({ _id: id, user: userId });

  return res
    .status(200)
    .json({ status: "success", message: "Story and media deleted" });
};

export const getStoriesFeed = async (req, res) => {
  const me = await UserModel.findById(req.user._id).select("friends").lean();

  if (!me) {
    return res
      .status(404)
      .json({ status: "failure", message: "User not found" });
  }
  const userIds = Array.from(
    new Set([String(req.user._id), ...(me.friends ?? []).map(String)])
  );

  if (userIds.length === 0) {
    return res.status(200).json({ status: "success", stories: [] });
  }
  const now = new Date();
  const filter = {
    user: { $in: userIds },
    expiresAt: { $gt: now },
  };

  const raw = await StoryModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .select("_id user caption link createdAt media thumbnail")
    .lean();

  const isMine = (uid) => String(uid) === String(req.user._id);
  raw.sort((a, b) => {
    const aMine = isMine(a.user);
    const bMine = isMine(b.user);
    if (aMine !== bMine) return aMine ? -1 : 1; // mine always before friends
    const t = b.createdAt - a.createdAt; // newest first
    if (t) return t;
    return String(b._id).localeCompare(String(a._id));
  });

  const stories = raw.map((s) => ({
    _id: s._id,
    user: s.user,
    createdAt: s.createdAt,
    caption: s.caption ?? null,
    link: s.link ?? null,
    thumbnail: s.thumbnail ?? null,
    media: (s.media ?? []).map((m) => m?.url).filter(Boolean),
  }));

  return res.status(200).json({
    status: "success",
    stories,
  });
};

export const getStoryMedia = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ status: "failure", message: "Invalid story id" });
  }

  const story = await StoryModel.findById(id).select("media expiresAt");
  if (!story) {
    return res
      .status(404)
      .json({ status: "failure", message: "Story not found" });
  }

  if (story.expiresAt <= new Date()) {
    return res
      .status(410)
      .json({ status: "failure", message: "Story expired" });
  }

  const media = (story.media ?? []).map((m) => m.url);

  return res.status(200).json({ status: "success", media });
};

export const viewStory = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res
      .status(400)
      .json({ status: "failure", message: "Invalid story id" });
  }

  const updated = await StoryModel.findOneAndUpdate(
    { _id: id, expiresAt: { $gt: new Date() } },
    { $inc: { viewsCount: 1 } },
    { new: true, projection: { viewsCount: 1 } }
  );

  if (!updated) {
    return res
      .status(404)
      .json({ status: "failure", message: "Story not found or expired" });
  }

  return res
    .status(200)
    .json({ status: "success", viewsCount: updated.viewsCount });
};

export const test = async (req, res) => {};
