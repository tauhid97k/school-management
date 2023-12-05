const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const checkPermission = require('../middlewares/permissionMiddleware')
const {
  getAllClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController')

// Protected Routes
router.use(verifyAuth)
router.get('/', getAllClasses)
router.get('/:id', getClass)
router.post('/', createClass)
router.put('/:id', updateClass)
router.delete('/:id', deleteClass)

module.exports = router
