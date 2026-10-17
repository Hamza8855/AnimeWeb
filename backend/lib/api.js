export const successResponse = (
  data = {},
  message = "Request successful",
  status = 200,
) => {
  return {
    success: true,
    message,
    ...data,
    status,
  };
};

export const errorResponse = (
  message = "Something went wrong",
  status = 500,
  errors = null,
) => {
  return {
    success: false,
    message,
    ...(errors && { errors }),
    status,
  };
};
