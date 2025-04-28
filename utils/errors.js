class AppError extends Error {
  constructor(message, code) {
    super(message, { code });
    this.code = code;
  }
}

exports.AppError = AppError;
