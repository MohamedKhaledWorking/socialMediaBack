// before validateSchema(updateUserSchema)
export default function normalizeUpdateBody(req, res, next) {
  if (typeof req.body?.socialLinks === "string") {
    try {
      req.body.socialLinks = JSON.parse(req.body.socialLinks);
    } catch {
      return res
        .status(400)
        .json({ message: "socialLinks must be valid JSON" });
    }
  }

  if (req.body.socialLinks && typeof req.body.socialLinks === "object") {
    for (const k of ["facebook", "instagram", "twitter", "github", "tiktok"]) {
      if (
        typeof req.body.socialLinks[k] === "string" &&
        req.body.socialLinks[k].trim() === ""
      ) {
        delete req.body.socialLinks[k];
      }
    }
    if (Object.keys(req.body.socialLinks).length === 0) {
      delete req.body.socialLinks; // allow "send nothing"
    }
  }

  // Optional: keep spaces in username (don’t collapse)
  if (typeof req.body.username === "string") {
    req.body.username = req.body.username.replace(/\s+/g, " ").trim();
  }

  next();
}
