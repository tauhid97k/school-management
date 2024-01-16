const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  register,
  resendEmail,
  verifyEmail,
  login,
  refreshAuthToken,
  authUser,
  logout,
  logoutAll,
  resetPassword,
  verifyResetCode,
  updatePassword,
} = require('../controllers/authController')

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/reset-password', resetPassword)
router.post('/verify-reset-code', verifyResetCode)
router.post('/update-password', updatePassword)
router.get('/refresh-token', refreshAuthToken)
router.post('/logout', logout)
router.post('/logout-all', logoutAll)

// Protected Routes
router.get('/resend-email', authMiddleware(), resendEmail)
router.post('/verify-email', authMiddleware(), verifyEmail)
router.get('/user', authMiddleware(), authUser)

module.exports = router
