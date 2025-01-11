import { Image } from "../models/Image.js";
import { catchAsync } from "../middleware/errorHandlingMiddleware.js";

const getGalleryManagement = catchAsync(async (req, res, next) => {
  const images = await Image.find()
    .select("_id filename description category path uploadedAt")
    .sort({ uploadedAt: -1 })
    .lean();

  const transformedImages = images.map((image) => ({
    _id: image._id,
    path: image.path,
    category: image.category,
    description: image.description,
    uploadedAt: new Date(image.uploadedAt).toLocaleDateString(),
  }));

  res.render("gallery-management", {
    user: req.session.user,
    images: transformedImages,
    currentPage: "gallery-management",
  });
});

export { getGalleryManagement };
