const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  rolePermissions,
  createRolePermissions,
  updateRolePermissions,
} = require('../controllers/rolePermissionsController')

// Protected Routes
router.get('/', authMiddleware(), rolePermissions)
router.post('/', authMiddleware(), createRolePermissions)
router.put('/', authMiddleware(), updateRolePermissions)

module.exports = router
