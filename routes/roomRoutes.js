const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const roomController = require('../controllers/roomController')

// Protected Routes
router.get('/', authMiddleware(), roomController.getAllRooms)
router.post('/', authMiddleware(), roomController.createRoom)

module.exports = router
