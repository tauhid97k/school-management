const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAssignments,
  getAssignment,
  getSubmittedAssignments,
  approveSubmittedAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/teacherAssignmentController')

// Protected Routes
router.get('/', authMiddleware(), getAssignments)
router.get('/:id', authMiddleware(), getAssignment)
router.get('/teacher/:id/submitted', authMiddleware(), getSubmittedAssignments)
router.get(
  '/teacher/:teacherId/submitted/:homeworkId',
  authMiddleware(),
  getSubmittedAssignments
)
router.put(
  '/submitted/:id/approval',
  authMiddleware(),
  approveSubmittedAssignments
)
router.post('/', authMiddleware(), createAssignment)
router.put('/:id', authMiddleware(), updateAssignment)
router.delete('/:id', authMiddleware(), deleteAssignment)

module.exports = router
