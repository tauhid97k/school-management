const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
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

// Protected Routes
router.use(verifyAuth)
router.get('/resend-email', resendEmail)
router.post('/verify-email', verifyEmail)
router.get('/user', authUser)
router.post('/logout', logout)
router.post('/logout-all', logoutAll)

module.exports = router
