const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const { getAdmins } = require('../controllers/adminController')

router.use(verifyAuth)
router.get('/', getAdmins)

module.exports = router
