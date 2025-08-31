export default function normalizeUpdateBody(req, res, next) {
  // socialLinks: if multipart sent it as a string, parse it
  if (typeof req.body?.socialLinks === "string") {
    try {
      req.body.socialLinks = JSON.parse(req.body.socialLinks);
    } catch {
      return res
        .status(400)
        .json({ message: "socialLinks must be valid JSON" });
    }
  }

  // Remove empty social link fields so Joi doesn't validate "" as a URL
  if (req.body.socialLinks && typeof req.body.socialLinks === "object") {
    for (const key of [
      "facebook",
      "instagram",
      "twitter",
      "github",
      "tiktok",
    ]) {
      if (
        typeof req.body.socialLinks[key] === "string" &&
        req.body.socialLinks[key].trim() === ""
      ) {
        delete req.body.socialLinks[key];
      }
    }
    if (Object.keys(req.body.socialLinks).length === 0) {
      delete req.body.socialLinks; // allow "send nothing"
    }
  }

  // Optional: keep spaces but normalize username a bit
  if (typeof req.body.username === "string") {
    req.body.username = req.body.username.replace(/\s+/g, " ").trim();
  }

  // Optional: normalize birthday "YYYY-MM-DD" into a Date so Joi date() is happy
  if (
    typeof req.body.birthday === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(req.body.birthday)
  ) {
    req.body.birthday = new Date(req.body.birthday);
  }

  next();
}
