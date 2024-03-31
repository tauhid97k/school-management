const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getChairmanSection,
  createChairmanSection,
  updateChairmanSection,
  deleteChairmanSection,
} = require('../controllers/chairmanController')

// Protected Routes
router.get('/', authMiddleware(), getChairmanSection)
router.post('/', authMiddleware(), createChairmanSection)
router.put('/:id', authMiddleware(), updateChairmanSection)
router.delete('/:id', authMiddleware(), deleteChairmanSection)

module.exports = router
