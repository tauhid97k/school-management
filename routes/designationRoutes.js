const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const designationController = require('../controllers/designationController')

// Protected Routes
router.get('/', authMiddleware(), designationController.getAllDesignation)
router.post('/', authMiddleware(), designationController.createDesignation)
router.put('/:id', authMiddleware(), designationController.updateDesignation)
router.delete('/:id', authMiddleware(), designationController.deleteDesignation)

module.exports = router
