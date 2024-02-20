const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAssignments,
  getAssignment,
  getClassSectionsForAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/teacherAssignmentController')

// Protected Routes
router.get('/', authMiddleware(), getAssignments)
router.get(
  '/classes/:id/sections',
  authMiddleware(),
  getClassSectionsForAssignment
)
router.get('/:id', authMiddleware(), getAssignment)
router.post('/', authMiddleware(), createAssignment)
router.put('/:id', authMiddleware(), updateAssignment)
router.delete('/:id', authMiddleware(), deleteAssignment)

module.exports = router
