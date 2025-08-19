import multer from "multer";

export const Multer = (allowedFiles = []) => {
  const storage = multer.diskStorage({});

  const filterFile = (req, file, cb) => {
    if (allowedFiles.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  };

  const upload = multer({ storage, fileFilter: filterFile });
  return upload;
};
