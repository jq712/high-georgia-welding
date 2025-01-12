import { User } from "../models/User.js";
import { AllowedEmail } from "../models/AllowedEmail.js";
import bcrypt from "bcryptjs";
import { AppError, catchAsync } from "../middleware/errorHandlingMiddleware.js";

const register = catchAsync(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }

  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await User.create({ email, password: hashedPassword });

  res.redirect("/dashboard");
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  req.session.user = {
    id: user._id,
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin,
  };

  res.redirect("/dashboard");
});

const logout = catchAsync(async (req, res, next) => {
  await new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(new AppError("Could not log out, please try again", 500));
      else resolve();
    });
  });

  res.clearCookie("connect.sid");
  res.redirect("/login");
});

const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.session.user.id).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    throw new AppError("Current password is incorrect", 401);
  }

  user.password = req.body.newPassword;
  await user.save();

  req.session.messages = {
    success: "Password updated successfully",
  };
  res.redirect("/dashboard");
});

const getCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.session || !req.session.user) {
    throw new AppError("Not authenticated", 401);
  }

  res.status(200).json({
    status: "success",
    data: { user: req.session.user },
  });
});

export { register, login, logout, updatePassword, getCurrentUser };
