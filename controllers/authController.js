import { User } from "../models/User.js";
import { AllowedEmail } from "../models/AllowedEmail.js";
import bcrypt from "bcryptjs";
import { AppError } from "../middleware/errorHandlingMiddleware.js";

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // make email lowercase
    req.body.email = email.toLowerCase();

    const isAllowed = await AllowedEmail.findOne({ email });
    if (!isAllowed) {
      return res.status(403).json({
        status: "error",
        errors: { email: "Email not allowed" },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: isAllowed.role,
      isAdmin: isAllowed.role === "admin",
    });

    // Set session
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
    };

    res.status(201).json({
      status: "success",
      redirect: "/dashboard",
      message: "Registration successful",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: "error",
        errors: { email: "Email already in use" },
      });
    }
    res.status(500).json({
      status: "error",
      errors: { general: "Registration failed" },
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "error",
        errors: {
          general: "Invalid email or password",
        },
      });
    }

    // Set session
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
    };

    res.status(200).json({
      status: "success",
      redirect: "/dashboard",
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      errors: {
        general: "An error occurred during login",
      },
    });
  }
};

const logout = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err)
          reject(new AppError("Could not log out, please try again", 500));
        else resolve();
      });
    });

    res.clearCookie("connect.sid");
    return res.redirect("/login");
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user.id).select("+password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (
      !(await user.correctPassword(req.body.currentPassword, user.password))
    ) {
      throw new AppError("Current password is incorrect", 401);
    }

    user.password = req.body.newPassword;
    await user.save();

    req.session.messages = {
      success: "Password updated successfully",
    };
    res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      throw new AppError("Not authenticated", 401);
    }

    res.status(200).json({
      status: "success",
      data: { user: req.session.user },
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, logout, updatePassword, getCurrentUser };
