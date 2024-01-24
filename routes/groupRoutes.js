const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const groupController = require('../controllers/groupController')

// Protected Routes
router.get('/', authMiddleware(), groupController.getAllGroups)
router.post('/', authMiddleware(), groupController.createGroup)
router.put('/:id', authMiddleware(), groupController.updateGroup)
router.delete('/:id', authMiddleware(), groupController.deleteGroup)

module.exports = router
