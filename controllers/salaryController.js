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
    response.user_type = 'teacher'
    response.users = await prisma.teachers.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else if (user_type === 'admin') {
    response.user_type = 'admin'
    response.users = await prisma.admins.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else if (user_type !== 'admin' || user_type !== 'teacher') {
    response.user_type = user_type
    response.users = await prisma.staffs.findMany({
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
  } else if (user_id && (user_type !== 'admin' || user_type !== 'teacher')) {
    const getStaff = await prisma.staffs.findUnique({
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

    // Format staff
    const formatStaff = {
      id: getStaff.id,
      name: getStaff.name,
      profile_img: getStaff.profile_img ? getStaff.profile_img : null,
      joining_date: getStaff.joining_date,
    }

    response.user_info = formatStaff
  }

  res.json(response)
})

/*
  @route    GET: /salaries
  @access   private
  @desc     Get All Salaries
*/
const getSalaries = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, salaryFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [salaries, total] = await prisma.$transaction([
    prisma.salaries.findMany({
      take,
      skip,
      orderBy,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            designation: true,
            profile_img: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            designation: true,
            profile_img: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            designation: true,
            profile_img: true,
          },
        },
      },
    }),
    prisma.salaries.count(),
  ])

  const formatSalaries = salaries.map((salary) => {
    const { admin, teacher, staff, admin_id, teacher_id, staff_id, ...rest } =
      salary
    let user_details = teacher || admin || staff
    user_details = {
      name: user_details.name,
      designation: user_details.designation.title,
      profile_img:
        (teacher
          ? generateFileLink(`teachers/profiles/${teacher.profile_img}`)
          : null) ||
        (admin
          ? generateFileLink(`admins/profiles/${admin.profile_img}`)
          : null) ||
        (staff
          ? generateFileLink(`staffs/profiles/${staff.profile_img}`)
          : null),
    }

    return {
      ...rest,
      ...user_details,
    }
  })

  res.json({
    data: formatSalaries,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /salaries/:id
  @access   private
  @desc     Get salary details
*/
const getSalaryDetails = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findSalary = await tx.salaries.findUnique({
      where: {
        id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            designation: true,
            profile_img: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            designation: true,
            profile_img: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            designation: true,
            profile_img: true,
          },
        },
      },
    })

    if (!findSalary) {
      return res.status(400).json({
        message: 'Salary details not found',
      })
    }

    // Format salary details
    const { admin, teacher, staff, admin_id, teacher_id, staff_id, ...rest } =
      findSalary

    let user_details = teacher || admin || staff

    user_details = {
      name: user_details.name,
      designation: user_details.designation.title,
      profile_img:
        (teacher
          ? generateFileLink(`teachers/profiles/${teacher.profile_img}`)
          : null) ||
        (admin
          ? generateFileLink(`admins/profiles/${admin.profile_img}`)
          : null) ||
        (staff
          ? generateFileLink(`staffs/profiles/${staff.profile_img}`)
          : null),
    }

    const formatSalary = {
      ...rest,
      ...user_details,
    }

    res.json(formatSalary)
  })
})

/*
  @route    POST: /salaries
  @access   private
  @desc     Create salary for admin/teacher/staff
*/
const createSalary = asyncHandler(async (req, res, next) => {
  const data = await salaryValidator().validate(req.body, { abortEarly: false })

  if (data.user_type === 'admin') {
    await prisma.salaries.create({
      data: {
        user_type: data.user_type,
        salary_amount: data.salary_amount,
        salary_date: data.salary_date,
        bonus: data.bonus,
        advance: data.advance,
        due: data.due,
        payment_status: data.payment_status,
        admin_id: data.user_id,
      },
    })

    return res.json({
      message: 'Salary created',
    })
  } else if (data.user_type === 'teacher') {
    await prisma.salaries.create({
      data: {
        user_type: data.user_type,
        salary_amount: data.salary_amount,
        salary_date: data.salary_date,
        bonus: data.bonus,
        advance: data.advance,
        due: data.due,
        payment_status: data.payment_status,
        teacher_id: data.user_id,
      },
    })

    return res.json({
      message: 'Salary created',
    })
  } else if (data.user_type !== 'teacher' || data.user_type !== 'admin') {
    await prisma.salaries.create({
      data: {
        user_type: data.user_type,
        salary_amount: data.salary_amount,
        salary_date: data.salary_date,
        bonus: data.bonus,
        advance: data.advance,
        due: data.due,
        payment_status: data.payment_status,
        staff_id: data.user_id,
      },
    })

    return res.json({
      message: 'Salary created',
    })
  }

  res.status(400).json({
    message: 'User type did not match',
  })
})

module.exports = {
  getUserTypeWithInfo,
  getSalaries,
  getSalaryDetails,
  createSalary,
}
