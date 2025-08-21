import { v2 as cloudinaryV2 } from "cloudinary";

export const cloudinary = () => {
  cloudinaryV2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
  });

  return cloudinaryV2;
};
