const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getRoles,
  getRolesWithoutStudent,
  getRolesWithoutAdminTeacherAndStudent,
  getPermissions,
  getRolePermissions,
  createRolePermissions,
  updateRolePermissions,
} = require('../controllers/rolePermissionsController')

// Protected Routes
router.get('/roles', authMiddleware(), getRoles)
router.get('/roles/ns', authMiddleware(), getRolesWithoutStudent)
router.get(
  '/roles/nats',
  authMiddleware(),
  getRolesWithoutAdminTeacherAndStudent
)
router.get('/permissions', authMiddleware(), getPermissions)
router.get('/', authMiddleware(), getRolePermissions)
router.post('/', authMiddleware(), createRolePermissions)
router.put('/', authMiddleware(), updateRolePermissions)

module.exports = router
