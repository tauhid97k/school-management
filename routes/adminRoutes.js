const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { getAdmins } = require('../controllers/adminController')

router.get('/', authMiddleware(), getAdmins)

module.exports = router
