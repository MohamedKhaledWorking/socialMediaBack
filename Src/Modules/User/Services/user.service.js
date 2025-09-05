import { UserModel } from "../../../DB/Models/User.model.js";
import { decrypt, encrypt } from "../../../Utils/encryption.utils.js";
import bcrypt from "bcryptjs";
import { SharedAccountModel } from "../../../DB/Models/SharedAccount.model.js";
import { cloudinary } from "../../../Utils/cloudinary.utils.js";

export const getProfile = (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }
  user.phone = decrypt(user.phone, process.env.PHONE_ENCRYPTION_KEY);
  user.address = decrypt(user.address, process.env.ADDRESS_ENCRYPTION_KEY);
  
  return res.status(200).json({ status: "success", user });
};

export const getAllUsers = async (req, res) => {
  const PHONE_KEY = process.env.PHONE_ENCRYPTION_KEY;
  const ADDR_KEY  = process.env.ADDRESS_ENCRYPTION_KEY;

  // If you use .lean(), you must decrypt manually (no model transforms).
  const users = await UserModel.find({ isBanned: false })
    .select('-password -__v') // never return sensitive data
    .lean();

  const decryptSafe = (val, key) => {
    if (!val) return val;
    try { return decrypt(val, key); } catch { return val; }
  };

  const output = users.map(u => ({
    ...u,
    phone:   decryptSafe(u.phone,   PHONE_KEY),
    address: decryptSafe(u.address, ADDR_KEY),
  }));

  return res.status(200).json({ status: 'success', users: output });
};

export const getAllBannedUsers = async (req, res) => {
  const users = await UserModel.find({ isBanned: true });
  return res.status(200).json({ status: "success", users });
};

export const getUserById = async (req, res) => {
  const user = await UserModel.findById(req.params.userId);''
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }
  user.phone = decrypt(user.phone, process.env.PHONE_ENCRYPTION_KEY);
  user.address = decrypt(user.address, process.env.ADDRESS_ENCRYPTION_KEY);
  return res.status(200).json({ status: "success", user });
};

export const createAdmin = async (req, res) => {
  const isUserExist = await UserModel.findOne({ email: req.body.email });
  if (isUserExist) {
    return res
      .status(409)
      .json({ status: "failure", message: "Email already in use" });
  }
  const hashedPassword = bcrypt.hashSync(
    req.body.password,
    Number(process.env.SALT)
  );
  req.body.password = hashedPassword;
  req.body.phone = encrypt(req.body.phone, process.env.PHONE_ENCRYPTION_KEY);
  req.body.address = encrypt(
    req.body.address,
    process.env.ADDRESS_ENCRYPTION_KEY
  );

  let profileImageResult;
  let coverImageResult;

  req.files?.profileImage
    ? (profileImageResult = await cloudinary().uploader.upload(
        req.files?.profileImage[0]?.path,
        {
          folder: "social/users/profile",
        }
      ))
    : (profileImageResult = null);

  req.files?.coverImage
    ? (coverImageResult = await cloudinary().uploader.upload(
        req.files?.coverImage[0]?.path,
        {
          folder: "social/users/cover",
        }
      ))
    : (coverImageResult = null);

  const user = await UserModel.create({
    ...req.body,
    profileImage: {
      url: profileImageResult?.secure_url,
      public_id: profileImageResult?.public_id,
    },
    coverImage: {
      url: coverImageResult?.secure_url,
      public_id: coverImageResult?.public_id,
    },
  });

  return res.status(201).json({
    status: "success",
    message:
      user.role == "admin"
        ? "Admin created successfully"
        : "User created successfully",
    user,
  });
};

export const updateProfile = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }

  const encryptedPhone = req.body.phone
    ? encrypt(req.body.phone, process.env.PHONE_ENCRYPTION_KEY)
    : user.phone;

  const encryptedAddress = req.body.address
    ? encrypt(req.body.address, process.env.ADDRESS_ENCRYPTION_KEY)
    : user.address;

  let profileImageResult = user.profileImage;
  let coverImageResult = user.coverImage;

  // 🔹 Update profile image only if a new one is sent
  if (req.files?.profileImage?.[0]) {
    if (user.profileImage?.public_id) {
      await cloudinary().uploader.destroy(user.profileImage.public_id);
    }
    profileImageResult = await cloudinary().uploader.upload(
      req.files.profileImage[0].path,
      { folder: "social/users/profile" }
    );
  }

  // 🔹 Update cover image only if a new one is sent
  if (req.files?.coverImage?.[0]) {
    if (user.coverImage?.public_id) {
      await cloudinary().uploader.destroy(user.coverImage.public_id);
    }
    coverImageResult = await cloudinary().uploader.upload(
      req.files.coverImage[0].path,
      { folder: "social/users/cover" }
    );
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    user._id,
    {
      ...req.body,
      phone: encryptedPhone,
      address: encryptedAddress,
      profileImage: {
        url: profileImageResult?.secure_url,
        public_id: profileImageResult?.public_id,
      },
      coverImage: {
        url: coverImageResult?.secure_url,
        public_id: coverImageResult?.public_id,
      },
    },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    user: updatedUser,
  });
};

export const updateUserPassword = async (req, res) => {
  const data = req.body;
  const user = req.user;
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }
  const isMatch = bcrypt.compareSync(data.oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      status: "failure",
      error: "Old password is incorrect",
    });
  }

  const hashedPassword = bcrypt.hashSync(
    data.password,
    Number(process.env.SALT)
  );
  user.password = hashedPassword;
  await user.save();
  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
};

export const freezeProfile = async (req, res) => {
  const user = req.user;

  if (user.isDeleted) {
    return res.status(400).json({
      status: "failure",
      error: "Profile is already frozen",
    });
  }

  user.isDeleted = true;
  await user.save();

  return res.status(200).json({
    status: "success",
    message: "Profile has been frozen successfully",
  });
};

export const activateAccount = async (req, res) => {
  const data = req.body;

  const user = await UserModel.findOne({ email: data.email });
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }
  const isMatch = bcrypt.compareSync(data.password, user.password);
  if (!isMatch) {
    return res.status(400).json({
      status: "failure",
      error: "User not found",
    });
  }
  if (!user.isDeleted) {
    return res.status(400).json({
      status: "failure",
      error: "Profile is already activated",
    });
  }
  user.isDeleted = false;
  await user.save();

  return res.status(200).json({
    status: "success",
    message: "Profile has been activated successfully",
  });
};

export const banUser = async (req, res) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }
  if (user.isBanned === true) {
    return res
      .status(400)
      .json({ status: "failure", error: "User is already banned" });
  }
  user.isBanned = true;
  await user.save();
  return res.status(200).json({ status: "success", message: "User banned" });
};

export const unBanUser = async (req, res) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }
  if (user.isBanned === false) {
    return res
      .status(400)
      .json({ status: "failure", error: "User is not banned" });
  }
  user.isBanned = false;
  await user.save();
  return res
    .status(200)
    .json({ status: "success", message: "User account Unbanned" });
};

export const deleteProfile = async (req, res) => {
  const { profileId } = req.params;
  const user = await UserModel.findByIdAndDelete(profileId);
  if (!user) {
    return res.status(404).json({ status: "failure", error: "User not found" });
  }
  return res.status(200).json({ status: "success", message: "User deleted" });
};

export const deleteAllUsers = async (req, res) => {
  const users = await UserModel.deleteMany({ email: { $ne: req.user.email } });
  if (!users) {
    return res
      .status(404)
      .json({ status: "failure", error: "Users not found" });
  }
  return res
    .status(200)
    .json({ status: "success", message: "Users deleted successfully" });
};

export const shareAccount = async (req, res) => {
  const { userId, email, permissions } = req.body;
  let sharedWithUser = null;
  if (userId) {
    sharedWithUser = await UserModel.findById(userId);
  } else if (email) {
    sharedWithUser = await UserModel.findOne({ email });
  }
  if (!sharedWithUser) {
    return res
      .status(404)
      .json({ status: "failure", error: "User to share with not found" });
  }
  const sharedAccount = await SharedAccountModel.create({
    ownerId: req.user._id,
    sharedWithId: sharedWithUser._id,
    permissions: permissions || ["read"],
  });
  res.status(201).json({ status: "success", sharedAccount });
};

export const getSharedAccounts = async (req, res) => {
  const sharedAccounts = await SharedAccountModel.find({
    sharedWithId: req.user._id,
  });
  res.status(200).json({ status: "success", sharedAccounts });
};

export const getMySharedAccounts = async (req, res) => {
  const mySharedAccounts = await SharedAccountModel.find({
    ownerId: req.user._id,
  });
  res.status(200).json({ status: "success", mySharedAccounts });
};

export const removeSharedAccess = async (req, res) => {
  const { shareId } = req.params;
  await SharedAccountModel.findByIdAndDelete(shareId);
  res.status(200).json({ status: "success", message: "Shared access removed" });
};
