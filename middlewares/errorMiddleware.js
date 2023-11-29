const createError = require('../utils/errorHandler')

// Not Found URL Error
const urlNotFoundError = (req, res, next) => {
  next(new createError(404, `${req.originalUrl} not found`))
}

// Validation Error
const validationErrorHandler = (res, error) => {
  const validationError = error.inner.map((error) => {
    const name = error.path
    const type = error.type
    const message = error.errors.at(0)
    return { name, feedback: { type, message } }
  })

  res.status(400).json({
    message: 'Validation error',
    validationError,
  })
}

// Global Error
const globalError = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500
  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      message: error.message,
      type: error.name,
      stackTrace: error.stack,
      error,
    })
  } else if (process.env.NODE_ENV === 'production') {
    if (error.isOperational) {
      res.status(error.statusCode).json({
        message: error.message,
      })
    } else if (error.name === 'ValidationError') {
      validationErrorHandler(res, error)
    } else if (error?.code === 'P2028') {
      res.status(408).json({
        message: 'Request Timeout; please try again',
      })
    } else {
      res.status(500).json({
        message: 'Something went wrong',
      })
    }
  }
}

module.exports = { urlNotFoundError, globalError }
