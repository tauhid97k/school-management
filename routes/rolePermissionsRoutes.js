const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const {
  rolePermissions,
  createRolePermissions,
  updateRolePermissions,
} = require('../controllers/rolePermissionsController')

// Protected Routes
router.use(verifyAuth)
router.get('/', rolePermissions)
router.post('/', createRolePermissions)
router.put('/', updateRolePermissions)

module.exports = router
