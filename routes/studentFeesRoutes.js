const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getStudentInfo,
  studentFeeList,
  studentFeeDetails,
  getStudentFeesHistory,
  createStudentFee,
  updateStudentFee,
  deleteStudentFee,
} = require('../controllers/studentFeesController')

router.get('/student-info', authMiddleware(), getStudentInfo)
router.get('/student/:id', authMiddleware(), getStudentFeesHistory)
router.get('/', authMiddleware(), studentFeeList)
router.get('/:id', authMiddleware(), studentFeeDetails)
router.post('/', authMiddleware(), createStudentFee)
router.put('/:id', authMiddleware(), updateStudentFee)
router.delete('/:id', authMiddleware(), deleteStudentFee)

module.exports = router
