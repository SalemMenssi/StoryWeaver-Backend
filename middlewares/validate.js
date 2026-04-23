const { validationResult } = require("express-validator");
const { errorResponse } = require("../Utils/apiResponse");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    console.log("❌ Validation errors:", JSON.stringify(formatted, null, 2));
    return errorResponse(res, "Validation failed", 422, formatted);
  }
  next();
};

module.exports = validate;