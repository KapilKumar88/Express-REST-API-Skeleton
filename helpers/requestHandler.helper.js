const sendResponse = (
  res,
  status = false,
  statusCode = 200,
  message = "Ok",
  data = null
) => {
  const resSchema = {
    status,
    statusCode,
    message,
  };

  if (data != null) {
    resSchema.data = data;
  }

  return res.status(statusCode).json(resSchema);
};

module.exports = {
  sendResponse,
};
