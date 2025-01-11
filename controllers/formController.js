import { Form } from "../models/Form.js";
import { catchAsync, AppError } from "../middleware/errorHandlingMiddleware.js";

const submitForm = catchAsync(async (req, res, next) => {
  const { name, email, phone, message } = req.body;
  const form = await Form.create({ name, email, phone, message });

  res.status(201).json({
    status: "success",
    message: "Form submitted successfully!",
    data: { form: { name, email, phone, message, submittedAt: form.submittedAt } },
  });
});

const getForms = catchAsync(async (req, res, next) => {
  const forms = await Form.find().sort({ submittedAt: -1 });
  res.status(200).json({
    status: "success",
    data: { forms },
  });
});

const deleteForm = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError("Form ID is required", 400);
  }

  const deletedForm = await Form.findByIdAndDelete(id);
  if (!deletedForm) {
    throw new AppError("Form not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: "Form deleted successfully"
  });
});

const deleteAllForms = catchAsync(async (req, res, next) => {
  await Form.deleteMany({});
  res.status(200).json({
    status: "success",
    message: "All forms deleted successfully",
  });
});

export { submitForm, getForms, deleteForm, deleteAllForms };
