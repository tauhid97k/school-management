const asyncHandler = require("express-async-handler")
const prisma = require("../utils/prisma")
const {
  selectQueries,
  paginateWithSorting,
  salaryFields,
} = require("../utils/metaData")
const { teacherSalaryValidator } = require("../validators/salaryValidator")
const dayjs = require("dayjs")
const generateFileLink = require("../utils/generateFileLink")

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
      message: "User type is required",
    })
  }

  let response = {
    user_type: "",
    users: [],
    user_info: {},
  }

  // Get Users based on user type (Admin/Teacher)
  if (user_type === "teacher") {
    response.user_type = "teacher"
    response.users = await prisma.teachers.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else if (user_type === "admin") {
    response.user_type = "admin"
    response.users = await prisma.admins.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else if (user_type !== "admin" || user_type !== "teacher") {
    response.user_type = user_type
    response.users = await prisma.staffs.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  // User information based on user_id
  if (user_id && user_type === "teacher") {
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
  } else if (user_id && user_type === "admin") {
    const getAdmin = await prisma.admins.findUnique({
      where: {
        id: Number(user_id),
      },
      select: {
        id: true,
        name: true,
        profile_img: true,
        created_at: true,
      },
    })

    // Format admin
    const formatAdmin = {
      id: getAdmin.id,
      name: getAdmin.name,
      profile_img: getAdmin.profile_img ? getAdmin.profile_img : null,
      joining_date: getAdmin.created_at,
    }

    response.user_info = formatAdmin
  } else if (user_id && (user_type !== "admin" || user_type !== "teacher")) {
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
      profile_img: getStaff.profile_img
        ? generateFileLink(`staffs/profiles/${getStaff.profile_img}`)
        : null,
      joining_date: getStaff.joining_date,
    }

    response.user_info = formatStaff
  }

  res.json(response)
})

/*
  @route    GET: /salaries/generate-teachers-invoice
  @access   private
  @desc     Generate teacher salary invoice
*/
const generateTeacherSalaryInvoice = asyncHandler(async (req, res, next) => {
  const bangladeshDate = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
  })

  // Current Date (BD)
  const currentDate = new Date(bangladeshDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of the month and 25th day of the month
  const firstDay = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Check if invoice is auto generated for this month
  const generatedInvoiceExist = await prisma.teacher_salaries.findFirst({
    where: {
      AND: [
        { issued_at: { gte: firstDay, lte: lastDayOfMonth } },
        { invoice_type: "AUTOMATIC" },
      ],
    },
  })

  if (generatedInvoiceExist) {
    // Get the generated invoice month & year
    const monthAndYear = dayjs(generatedInvoiceExist.issued_at).format(
      "MMM-YYYY"
    )

    return res.status(400).json({
      message: `Invoice already generated for ${monthAndYear}`,
    })
  }

  const teachers = await prisma.teachers.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      salary: true,
      salaries: {
        select: {
          due: true,
          advance: true,
        },
        orderBy: {
          issued_at: "desc",
        },
        take: 1,
      },
    },
  })

  // Calculate Teacher's salary, due, advanced, bonus
  const teachersInfo = teachers.map((teacher) => {
    let newAmount = teacher.salary
    const previousInvoice = teacher.salaries[0]

    if (previousInvoice) {
      if (previousInvoice.due) {
        newAmount += previousInvoice.due
      }

      if (previousInvoice.advance) {
        newAmount -= previousInvoice.advance
      }
    }

    return {
      teacher_id: teacher.id,
      amount: newAmount,
      advance: previousInvoice?.advance || null,
      due: previousInvoice?.due || null,
      invoice_type: "AUTOMATIC",
    }
  })

  // Create Invoice
  await prisma.teacher_salaries.createMany({
    data: teachersInfo,
  })

  res.json({
    message: "Teacher salary invoices generated",
  })
})

/*
  @route    GET: /salaries/teachers-invoice
  @access   private
  @desc     GET current month's salary invoices
*/
const teachersSalaryInvoice = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, salaryFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [salaries, total] = await prisma.$transaction([
    prisma.teacher_salaries.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            designation: {
              select: {
                title: true,
              },
            },
            profile_img: true,
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.teacher_salaries.count(),
  ])

  const formatSalaries = salaries.map(
    ({
      teacher,
      id,
      amount,
      advance,
      due,
      bonus,
      status,
      invoice_type,
      issued_at,
    }) => ({
      id,
      name: teacher.name,
      designation: teacher.designation.title,
      profile_img: teacher.profile_img
        ? generateFileLink(`teachers/profiles/${teacher.profile_img}`)
        : null,
      amount,
      advance,
      due,
      bonus,
      status,
      invoice_type,
      issued_at,
    })
  )

  res.json({
    data: formatSalaries,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

const createTeacherSalaryInvoice = asyncHandler(async (req, res, next) => {
  const data = await teacherSalaryValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check teacher and last invoice
  await prisma.$transaction(async () => {
    const teacherSalaryAndInvoice = await prisma.teachers.findFirst({
      where: {
        id: Number(data.teacher_id),
      },
      select: {
        id: true,
        salary: true,
        salaries: {
          select: {
            due: true,
            advance: true,
          },
          orderBy: {
            issued_at: "desc",
          },
          take: 1,
        },
      },
    })

    let salary = teacherSalaryAndInvoice.salary
    let due
    let advance
    const previousInvoice = teacherSalaryAndInvoice.salaries[0]

    // Check due
    if (data.amount < salary) {
      due = salary - data.amount
    }

    if (previousInvoice) {
      if (previousInvoice.due) {
        due += previousInvoice.due
      }
    }

    // Check Advance
    if (data.advance) {
      advance = data.advance
    }

    if (data.bonus) {
      salary += data.bonus
    }

    const invoiceInput = {
      teacher_id: teacher.id,
      amount: salary,
      advance: advance || null,
      due: due || null,
      invoice_type: "MANUAL",
    }

    // Create Invoice
    await prisma.teacher_salaries.createMany({
      data: invoiceInput,
    })

    res.json({
      message: "Teacher salary invoice created",
    })
  })
})

module.exports = {
  getUserTypeWithInfo,
  generateTeacherSalaryInvoice,
  teachersSalaryInvoice,
  createTeacherSalaryInvoice,
}
