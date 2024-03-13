const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getStudentInfo,
  studentFeeList,
  studentFeeDetails,
  getStudentFeesHistory,
  createStudentFee,
} = require('../controllers/studentFeesController')

router.get('/student-info', authMiddleware(), getStudentInfo)
router.get('/student/:id', authMiddleware(), getStudentFeesHistory)
router.get('/', authMiddleware(), studentFeeList)
router.get('/:id', authMiddleware(), studentFeeDetails)
router.post('/', authMiddleware(), createStudentFee)
router.put('/:id', authMiddleware(), createStudentFee)

module.exports = router
