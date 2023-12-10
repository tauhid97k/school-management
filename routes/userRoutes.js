const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const { getAdmins } = require('../controllers/userController')

router.use(verifyAuth)
router.get('/admins', getAdmins)

module.exports = router
