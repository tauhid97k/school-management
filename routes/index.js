const express = require('express')
const router = express.Router()

// Test Routes
router.use('/test', require('./testRoutes'))

// Routes
router.use('/role-permissions', require('./rolePermissionsRoutes'))
router.use('/auth', require('./authRoutes'))
router.use('/admins', require('./adminRoutes'))
router.use('/teachers', require('./teacherRoutes'))
router.use('/classes', require('./classRoutes'))
router.use('/subjects', require('./subjectRoutes'))
router.use('/notices', require('./noticeRoutes'))

module.exports = router
