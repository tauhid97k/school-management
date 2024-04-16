const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} = require('../controllers/shiftController')

// Protected Routes
router.get('/', authMiddleware(), getShifts)
router.post('/', authMiddleware(), createShift)
router.put('/:id', authMiddleware(), updateShift)
router.delete('/:id', authMiddleware(), deleteShift)

module.exports = router
