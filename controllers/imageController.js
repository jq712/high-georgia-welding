import { Image } from "../models/Image.js";
import fs from "fs/promises";
import path from "path";
import { catchAsync, AppError } from "../middleware/errorHandlingMiddleware.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const renderGallery = catchAsync(async (req, res, next) => {
  // Get all images, newest first
  const images = await Image.find()
    .select("_id filename description category path uploadedAt")
    .sort({ uploadedAt: -1 })
    .lean();

  // Format dates and prepare images for display
  const formattedImages = images.map((image) => ({
    ...image,
    uploadedAt: new Date(image.uploadedAt).toLocaleDateString(),
  }));

  // Check if we're in admin view
  const isAdmin = req.path.includes("management");
  const viewName = isAdmin ? "gallery-management" : "gallery";

  res.render(viewName, {
    images: formattedImages,
    currentPage: viewName,
    user: isAdmin ? req.session.user : null,
    messages: req.session.messages,
  });
});

const deleteImage = catchAsync(async (req, res, next) => {
  // Find the image in the database
  const image = await Image.findById(req.params.id);
  if (!image) {
    throw new AppError("Image not found", 404);
  }

  // Compute the path to the physical file
  const filePath = path.join(__dirname, "..", "public", image.path);

  // Delete the file from the filesystem
  await fs.unlink(filePath).catch(() => {
    // You can decide if you want to handle "file not found" differently
    throw new AppError("Failed to delete image file", 500);
  });

  // Remove the image record from the database
  await Image.findByIdAndDelete(req.params.id);

  // Respond with success
  res.status(200).json({
    status: "success",
    message: "Image deleted successfully",
  });
});

const updateImage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { category, description } = req.body;

  const image = await Image.findByIdAndUpdate(
    id,
    { category, description },
    { new: true }
  );

  if (!image) {
    throw new AppError("Image not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: { image },
  });
});

const createImage = catchAsync(async (req, res, next) => {
  // Check for required data
  if (!req.file) {
    throw new AppError("No image uploaded", 400);
  }
  if (!req.body.description || !req.body.category) {
    throw new AppError("Missing description or category", 400);
  }

  // Save image details to database
  const image = await Image.create({
    filename: req.file.filename,
    description: req.body.description,
    category: req.body.category,
    path: `/uploads/${req.file.filename}`,
    uploadedAt: new Date(),
  });

  return res.redirect("/gallery-management");
});

export { renderGallery, deleteImage, updateImage, createImage };
