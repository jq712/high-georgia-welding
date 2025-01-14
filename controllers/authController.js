import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import {
  AppError,
  catchAsync,
  isApiRequest,
} from "../middleware/errorHandlingMiddleware.js";
import logger from "../utils/logger.js";
import { AllowedEmail } from "../models/AllowedEmail.js";

const register = async (req, res, next) => {
  try {
    const formattedEmail = req.body.email.trim().toLowerCase();
    const { password, confirmPassword } = req.body;

    if (!formattedEmail || !password || !confirmPassword) {
      throw new AppError("All fields are required", 400);
    }

    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match", 400);
    }

    const allowedEmail = await AllowedEmail.findOne({ email: formattedEmail });
    if (!allowedEmail) {
      throw new AppError("Email is not allowed to register", 400);
    }

    // Create the new user with the same role as the first allowed email
    const newUser = await User.create({
      email: formattedEmail,
      password,
      role: allowedEmail.role,
    });

    // Create a session for the user
    req.session.user = {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };

    // Respond with success
    res.status(201).json({
      status: "success",
      message: "Registered successfully",
      redirect: "/dashboard",
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      const duplicatedValue = error.keyValue[duplicatedField];
      const message = `${duplicatedField} "${duplicatedValue}" already exists.`;
      return next(new AppError(message, 400));
    }

    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }
    // Format email and log it
    const formattedEmail = email.trim().toLowerCase();

    // Retrieve the user and log the result
    const user = await User.findOne({ email: formattedEmail }).select(
      "+password"
    );

    if (!user) {
      logger.warn(`Login failed: User not found for email: ${formattedEmail}`);
      throw new AppError("Invalid email or password", 401);
    }

    // Compare passwords and log the result
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      logger.warn(
        `Login failed: Incorrect password for email: ${formattedEmail}`
      );
      throw new AppError("Invalid email or password", 401);
    }

    // Create a session for the user and log it
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    // Respond with success
    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      redirect: "/dashboard",
    });
  } catch (error) {
    console.error("Error during login:", error);
    return next(error);
  }
};

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
