const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getInformation,
  createInformation,
  updateInformation,
  deleteInformation,
} = require('../controllers/informationController')

// Protected Routes
router.get('/', getInformation)
router.post('/', authMiddleware(), createInformation)
router.put('/:id', authMiddleware(), updateInformation)
router.delete('/:id', authMiddleware(), deleteInformation)

module.exports = router
