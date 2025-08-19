import mongoose, { Schema } from "mongoose";

const TrendingSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    minlength: [3, "Title must be at least 3 characters long"],
    maxlength: [100, "Title must be at most 100 characters long"],
    trim: true,
  },
  hashtag: {
    type: String,
    required: [true, "Hashtag is required"],
    unique: [true, "Hashtag must be unique"],
    minlength: [2, "Hashtag must be at least 2 characters long"],
    maxlength: [50, "Hashtag must be at most 50 characters long"],
    trim: true,
    validate: {
      validator: (val) => /^#[a-zA-Z0-9_]+$/.test(val),
      message: "Hashtag must start with # and contain only letters, numbers, and underscores",
    },
  },
  description: {
    type: String,
    maxlength: [500, "Description must be at most 500 characters long"],
    trim: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Text index for search functionality
TrendingSchema.index({ title: "text", hashtag: "text", description: "text" });

export const TrendingModel = mongoose.models.Trending || mongoose.model("Trending", TrendingSchema); 