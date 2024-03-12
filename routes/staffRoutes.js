const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getStaffSalaries,
  getStaffs,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController')

router.get('/', getStaffs)
router.get('/:id', authMiddleware(), getStaff)
router.get('/:id/salaries', getStaffSalaries)
router.post('/', createStaff)
router.put('/:id', authMiddleware(), updateStaff)
router.delete('/:id', authMiddleware(), deleteStaff)

module.exports = router
