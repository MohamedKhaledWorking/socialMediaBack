import fs from "node:fs/promises";
import mongoose from "mongoose";
import { StoryModel } from "../../../DB/Models/Story.model.js";
import { cloudinary as getCloudinary } from "../../../Utils/cloudinary.utils.js";

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

export const getFriendsStoryHeads = async (req, res) => {
  const me = await UserModel.findById(req.user._id).select("friends").lean();
  if (!me)
    return res
      .status(404)
      .json({ status: "failure", message: "User not found" });

  if (!me.friends?.length) {
    return res.status(200).json({ status: "success", heads: [] });
  }

  const pipeline = [
    { $match: { user: { $in: me.friends }, expiresAt: { $gt: new Date() } } },
    { $sort: { createdAt: -1 } }, // latest first
    {
      $group: {
        _id: "$user",
        latestStoryId: { $first: "$_id" },
        thumbnail: { $first: "$thumbnail" },
        lastUpdated: { $first: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { username: 1, profileImage: 1 } }],
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        user: 1,
        latestStoryId: 1,
        thumbnail: 1,
        lastUpdated: 1,
        count: 1,
      },
    },
    { $sort: { lastUpdated: -1 } },
  ];

  const heads = await StoryModel.aggregate(pipeline);
  return res.status(200).json({ status: "success", heads });
};

export const getUserActiveStories = async (req, res) => {
  const { userId } = req.params;
  if (!isValidId(userId)) {
    return res
      .status(400)
      .json({ status: "failure", message: "Invalid userId" });
  }

  const stories = await StoryModel.find({
    user: userId,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select("_id caption link createdAt media thumbnail")
    .lean();

  const data = stories.map((s) => ({
    _id: s._id,
    createdAt: s.createdAt,
    caption: s.caption,
    link: s.link,
    thumbnail: s.thumbnail,
    media: (s.media ?? []).map((m) => m.url),
  }));

  return res.status(200).json({ status: "success", stories: data });
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
