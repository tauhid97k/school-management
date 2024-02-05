const express = require('express')
const router = express.Router()

// Test Routes
router.use('/test', require('./testRoutes'))

// Routes
router.use('/role-permissions', require('./rolePermissionsRoutes'))
router.use('/auth', require('./authRoutes'))
router.use('/user', require('./userRoutes'))
router.use('/admins', require('./adminRoutes'))
router.use('/rooms', require('./roomRoutes'))
router.use('/groups', require('./groupRoutes'))
router.use('/teachers', require('./teacherRoutes'))
router.use('/students', require('./studentRoutes'))
router.use('/classes', require('./classRoutes'))
router.use('/subjects', require('./subjectRoutes'))
router.use('/sections', require('./sectionRoutes'))
router.use('/notices', require('./noticeRoutes'))
router.use('/attendance', require('./attendanceRoutes'))
router.use('/exam-categories', require('./examCategoryRoutes'))
router.use('/exams', require('./examRoutes'))
router.use('/grades', require('./gradingRoutes'))

module.exports = router
