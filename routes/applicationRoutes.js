const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getTeachersApplicationsForAdmin,
  getStudentsApplicationsForAdmin,
  responseToTeacherApplication,
  responseToStudentApplication,
  getTeacherApplications,
  getTeacherApplicationDetails,
  createTeacherApplication,
  updateTeacherApplication,
  deleteTeacherApplication,
  getStudentApplications,
  getStudentApplicationDetails,
  createStudentApplication,
  updateStudentApplication,
  deleteStudentApplication,
} = require('../controllers/applicationController')

// Protected Routes
// Admin Application Control
router.get('/teachers', authMiddleware(), getTeachersApplicationsForAdmin)
router.put(
  '/teachers/application/:id/response',
  authMiddleware(),
  responseToTeacherApplication
)
router.get('/students', authMiddleware(), getStudentsApplicationsForAdmin)
router.put(
  '/students/application/:id/response',
  authMiddleware(),
  responseToStudentApplication
)

// Teacher Applications
router.get('/teachers/:id', authMiddleware(), getTeacherApplications)
router.get(
  '/teachers/application/:id',
  authMiddleware(),
  getTeacherApplicationDetails
)
router.post('/teachers', authMiddleware(), createTeacherApplication)
router.put(
  '/teachers/application/:id',
  authMiddleware(),
  updateTeacherApplication
)
router.delete(
  '/teachers/application/:id',
  authMiddleware(),
  deleteTeacherApplication
)

// Student Applications
router.get('/students/:id', authMiddleware(), getStudentApplications)
router.get(
  '/students/application/:id',
  authMiddleware(),
  getStudentApplicationDetails
)
router.post('/students', authMiddleware(), createStudentApplication)
router.put(
  '/students/application/:id',
  authMiddleware(),
  updateStudentApplication
)
router.delete(
  '/students/application/:id',
  authMiddleware(),
  deleteStudentApplication
)

module.exports = router
