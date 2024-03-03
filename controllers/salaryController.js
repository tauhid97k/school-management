const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  paginateWithSorting,
  salaryFields,
} = require('../utils/metaData')
const { salaryValidator } = require('../validators/salaryValidator')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /salaries/user-info
  @access   private
  @desc     Get Teacher/Admin info for salary
*/
const getUserTypeWithInfo = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, salaryFields)

  const { user_type, user_id } = selectedQueries

  if (!user_type) {
    return res.status(400).json({
      message: 'User type is required',
    })
  }

  let response = {
    user_type: '',
    users: [],
    user_info: {},
  }

  // Get Users based on user type (Admin/Teacher)
  if (user_type === 'teacher') {
    response.user_type = 'Teacher'
    response.users = await prisma.teachers.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else if (user_type === 'admin') {
    response.user_type = 'Admin'
    response.users = await prisma.admins.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  // User information based on user_id
  if (user_id && user_type === 'teacher') {
    const getTeacher = await prisma.teachers.findUnique({
      where: {
        id: Number(user_id),
      },
      select: {
        id: true,
        name: true,
        profile_img: true,
        designation: {
          select: {
            title: true,
          },
        },
        salary: true,
        joining_date: true,
      },
    })

    // Format Teacher
    const formatTeacher = {
      id: getTeacher.id,
      name: getTeacher.name,
      profile_img: getTeacher.profile_img
        ? generateFileLink(`teachers/profiles/${getTeacher.profile_img}`)
        : null,
      designation: getTeacher.designation.title,
      salary: getTeacher.salary,
      joining_date: getTeacher.joining_date,
    }

    response.user_info = formatTeacher
  } else if (user_id && user_type === 'admin') {
    const getAdmin = await prisma.admins.findUnique({
      where: {
        id: Number(user_id),
      },
      select: {
        id: true,
        name: true,
        profile_img: true,
        joining_date: true,
      },
    })

    // Format admin
    const formatAdmin = {
      id: getAdmin.id,
      name: getAdmin.name,
      profile_img: getAdmin.profile_img ? getAdmin.profile_img : null,
      joining_date: getAdmin.joining_date,
    }

    response.user_info = formatAdmin
  }

  res.json(response)
})

/*
  @route    POST: /salaries
  @access   private
  @desc     Create salary for admin/teacher
*/
const createSalary = asyncHandler(async (req, res, next) => {})

module.exports = { getUserTypeWithInfo }
