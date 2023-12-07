const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const checkPermission = require('../middlewares/permissionMiddleware')
const {
  getAllSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController')

// Protected Routes
router.use(verifyAuth)
router.get('/', getAllSubjects)
router.get('/:id', getSubject)
router.post('/', createSubject)
router.put('/:id', updateSubject)
router.delete('/:id', deleteSubject)

module.exports = router
