const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const { users } = require('../controllers/userController')

router.use(verifyAuth)
router.get('/', users)

module.exports = router
