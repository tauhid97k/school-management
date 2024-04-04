const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const dayjs = require('dayjs')

/*
  @route    GET: /admins
  @access   private
  @desc     Get all admins
*/
const getAdmins = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [admins, total] = await prisma.$transaction([
    prisma.admins.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.admins.count(),
  ])

  res.json({
    data: admins,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /admins/stats/users
  @access   private
  @desc     Get users count (Admin, Teacher, Staff, Student) for Admin
*/
const getUsersCount = asyncHandler(async (req, res, next) => {
  const teacherCount = await prisma.teachers.count()
  const staffCount = await prisma.staffs.count()
  const studentCount = await prisma.students.count()

  res.json({
    teachers: teacherCount,
    staffs: staffCount,
    students: studentCount,
  })
})

/*
  @route    GET: /admins/stats/attendance/student
  @access   private
  @desc     Get student attendance statistics
*/
const getStudentAttendanceStats = asyncHandler(async (req, res, next) => {
  // Get Bangladesh Standard Time
  const bangladeshDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
  })

  // Current Date (BD)
  const currentDate = new Date(bangladeshDate)
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const months = []
  const targetYear = currentYear - 1 // Focus on the previous year

  for (let i = 0; i < 12; i++) {
    // Wrap around for months beyond December
    const month = (currentMonth - i + 12) % 12
    // Adjust year for December
    const year = month === 11 ? targetYear : currentYear
    const monthStart = new Date(year, month, 1)

    const monthEnd = new Date(year, month + 1, 0)
    months.push({
      month: dayjs(monthStart).format('MMM'),
      startDate: monthStart,
      endDate: monthEnd,
    })
  }

  const allMonthsStats = []
  for (const monthData of months) {
    const studentAttendanceData = await prisma.class_attendance.findMany({
      where: {
        date: {
          gte: monthData.startDate,
          lte: monthData.endDate,
        },
      },
    })

    const totalAttendance = studentAttendanceData.length
    const presentCount = studentAttendanceData.filter(
      (attendance) => attendance.status === 'PRESENT'
    ).length

    const presentPercentage =
      totalAttendance === 0 ? 0 : (presentCount / totalAttendance) * 100

    allMonthsStats.push({
      month: monthData.month,
      present: parseFloat(presentPercentage.toFixed(2)),
    })
  }

  res.json(allMonthsStats.reverse())
})

/*
  @route    GET: /admins/stats/admissions/gender
  @access   private
  @desc     Get student admissions statistics based on gender (Boy, Girl)
*/
const getStudentAdmissionGenderStats = asyncHandler(async (req, res, next) => {
  // Get Bangladesh Standard Time
  const bangladeshDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
  })

  // Current Date (BD)
  const currentDate = new Date(bangladeshDate)
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const months = []
  const targetYear = currentYear - 1 // Focus on the previous year

  for (let i = 0; i < 12; i++) {
    // Wrap around for months beyond December
    const month = (currentMonth - i + 12) % 12
    // Adjust year for December
    const year = month === 11 ? targetYear : currentYear
    const monthStart = new Date(year, month, 1)

    const monthEnd = new Date(year, month + 1, 0) // Get previous day of next month
    months.push({
      month: dayjs(monthStart).format('MMM'),
      startDate: monthStart,
      endDate: monthEnd,
    })
  }

  const allMonthsStats = []
  for (const monthData of months) {
    // Adjust where clause to consider current year and target year
    const boyCount = await prisma.students.count({
      where: {
        AND: [
          {
            admission_date: {
              gte:
                monthData.startDate >= new Date(currentYear, 0, 1)
                  ? monthData.startDate
                  : new Date(targetYear, 0, 1), // Consider current year and target year
            },
          },
          {
            admission_date: {
              lt: monthData.endDate, // Include previous day of next month
            },
          },
          {
            gender: 'MALE',
          },
        ],
      },
    })

    const girlCount = await prisma.students.count({
      where: {
        AND: [
          {
            admission_date: {
              gte:
                monthData.startDate >= new Date(currentYear, 0, 1)
                  ? monthData.startDate
                  : new Date(targetYear, 0, 1), // Consider current year and target year
            },
          },
          {
            admission_date: {
              lt: monthData.endDate, // Include previous day of next month
            },
          },
          {
            gender: 'FEMALE',
          },
        ],
      },
    })

    allMonthsStats.push({
      month: monthData.month,
      boy: boyCount,
      girl: girlCount,
    })
  }

  res.json(allMonthsStats.reverse())
})

module.exports = {
  getAdmins,
  getUsersCount,
  getStudentAttendanceStats,
  getStudentAdmissionGenderStats,
}
