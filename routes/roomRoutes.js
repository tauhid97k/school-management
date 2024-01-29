const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const roomController = require('../controllers/roomController')

// Protected Routes
router.get('/', authMiddleware(), roomController.getAllRooms)
router.get('/:id', authMiddleware(), roomController.getRoom)
router.post('/', authMiddleware(), roomController.createRoom)
router.put('/:id', authMiddleware(), roomController.updateRoom)
router.delete('/:id', authMiddleware(), roomController.deleteRoom)

module.exports = router
