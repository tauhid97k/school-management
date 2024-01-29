const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { getUser } = require('../controllers/userController')

router.get('/', authMiddleware(), getUser)

module.exports = router
