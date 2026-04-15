const successResponse = (res, message = "Success", data = {}, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

const errorResponse = (res, message = "Something went wrong", statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { successResponse, errorResponse };