const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  paginateWithSorting,
  salaryFields,
} = require('../utils/metaData')
const {
  teacherSalaryValidator,
  staffSalaryValidator,
} = require('../validators/salaryValidator')
const dayjs = require('dayjs')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /salaries/teachers
  @access   private
  @desc     Get teachers for salary
*/
const getTeachersForSalary = asyncHandler(async (req, res, next) => {
  const teachers = await prisma.teachers.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  res.json(teachers)
})

/*
  @route    GET: /salaries/teachers/:id
  @access   private
  @desc     Get teacher details for salary
*/
const getTeacherDetailsForSalary = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        designation: {
          select: {
            title: true,
          },
        },
        profile_img: true,
        salary: true,
        joining_date: true,
        salaries: {
          select: {
            due: true,
            advance: true,
            issued_at: true,
          },
          orderBy: {
            issued_at: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!findTeacher) {
      return res.status(404).json({ message: 'No teacher found' })
    }

    let payable_salary
    let lastAdvance

    if (findTeacher.salaries[0].advance) {
      lastAdvance = findTeacher.salaries[0].advance
    }

    const finalSalary = lastAdvance
      ? findTeacher.salary - lastAdvance
      : findTeacher.salary

    if (findTeacher.salaries[0].due) {
      payable_salary = finalSalary + findTeacher.salaries[0].due
    }

    const formatTeacher = {
      id: findTeacher.id,
      name: findTeacher.name,
      designation: findTeacher.designation.title,
      salary: findTeacher.salary,
      profile_img: findTeacher.profile_img
        ? generateFileLink(`teachers/profiles/${findTeacher.profile_img}`)
        : null,
      due: findTeacher.salaries[0].due ?? 0,
      payable_salary,
      advance: lastAdvance,
      joining_date: findTeacher.joining_date,
    }

    res.json(formatTeacher)
  })
})

/*
  @route    GET: /salaries/generate-teachers-invoice
  @access   private
  @desc     Generate teacher salary invoice
*/
const generateTeacherSalaryInvoice = asyncHandler(async (req, res, next) => {
  const bangladeshDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
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
        { invoice_type: 'AUTOMATIC' },
      ],
    },
  })

  if (generatedInvoiceExist) {
    // Get the generated invoice month & year
    const monthAndYear = dayjs(generatedInvoiceExist.issued_at).format(
      'MMM-YYYY'
    )

    return res.status(400).json({
      message: `Already generated for ${monthAndYear}`,
    })
  }

  const teachers = await prisma.teachers.findMany({
    where: {
      status: 'ACTIVE',
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
          issued_at: 'desc',
        },
        take: 1,
      },
    },
  })

  if (!teachers.length) {
    return res.status(400).json({
      message: 'No active teacher available',
    })
  }

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
      invoice_type: 'AUTOMATIC',
    }
  })

  // Create Invoice
  await prisma.teacher_salaries.createMany({
    data: teachersInfo,
  })

  res.json({
    message: 'Teacher salary invoice generated',
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

/*
  @route    POST: /salaries/teachers-invoice
  @access   private
  @desc     Create custom invoice for a teacher
*/
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
            issued_at: 'desc',
          },
          take: 1,
        },
      },
    })

    let salary = teacherSalaryAndInvoice.salary
    let due
    let advance
    const previousInvoice = teacherSalaryAndInvoice.salaries[0]

    // Check if salary amount is greater
    if (data.amount > salary) {
      return res.status(400).json({
        message: 'Amount cannot exceed base salary',
      })
    }

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
      teacher_id: teacherSalaryAndInvoice.id,
      amount: salary,
      advance: advance || null,
      due: due || null,
      invoice_type: 'MANUAL',
    }

    // Create Invoice
    await prisma.teacher_salaries.createMany({
      data: invoiceInput,
    })

    res.json({
      message: 'Teacher salary invoice created',
    })
  })
})

// ============ Staffs Salaries ==============
/*
  @route    GET: /salaries/staffs
  @access   private
  @desc     Get staffs for salary
*/
const getStaffsForSalary = asyncHandler(async (req, res, next) => {
  const staffs = await prisma.staffs.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  res.json(staffs)
})

/*
  @route    GET: /salaries/staffs/:id
  @access   private
  @desc     Get staff details for salary
*/
const getStaffDetailsForSalary = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findStaff = await tx.staffs.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        designation: {
          select: {
            title: true,
          },
        },
        profile_img: true,
        salary: true,
        joining_date: true,
      },
    })

    if (!findStaff) {
      return res.status(404).json({ message: 'No staff found' })
    }

    const formatStaff = {
      id: findStaff.id,
      name: findStaff.name,
      designation: findStaff.designation.title,
      salary: findStaff.salary,
      profile_img: findStaff.profile_img
        ? generateFileLink(`staffs/profiles/${findStaff.profile_img}`)
        : null,
      joining_date: findStaff.joining_date,
    }

    res.json(formatStaff)
  })
})

/*
  @route    GET: /salaries/generate-staffs-invoice
  @access   private
  @desc     Generate staffs salary invoice
*/
const generateStaffSalaryInvoice = asyncHandler(async (req, res, next) => {
  const bangladeshDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
  })

  // Current Date (BD)
  const currentDate = new Date(bangladeshDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of the month and 25th day of the month
  const firstDay = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Check if invoice is auto generated for this month
  const generatedInvoiceExist = await prisma.staff_salaries.findFirst({
    where: {
      AND: [
        { issued_at: { gte: firstDay, lte: lastDayOfMonth } },
        { invoice_type: 'AUTOMATIC' },
      ],
    },
  })

  if (generatedInvoiceExist) {
    // Get the generated invoice month & year
    const monthAndYear = dayjs(generatedInvoiceExist.issued_at).format(
      'MMM-YYYY'
    )

    return res.status(400).json({
      message: `Already generated for ${monthAndYear}`,
    })
  }

  const staffs = await prisma.staffs.findMany({
    where: {
      status: 'ACTIVE',
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
          issued_at: 'desc',
        },
        take: 1,
      },
    },
  })

  if (!staffs.length) {
    return res.status(400).json({
      message: 'No active staff available',
    })
  }

  // Calculate Staff's salary, due, advanced, bonus
  const staffsInfo = staffs.map((staff) => {
    let newAmount = staff.salary
    const previousInvoice = staff.salaries[0]

    if (previousInvoice) {
      if (previousInvoice.due) {
        newAmount += previousInvoice.due
      }

      if (previousInvoice.advance) {
        newAmount -= previousInvoice.advance
      }
    }

    return {
      staff_id: staff.id,
      amount: newAmount,
      advance: previousInvoice?.advance || null,
      due: previousInvoice?.due || null,
      invoice_type: 'AUTOMATIC',
    }
  })

  // Create Invoice
  await prisma.staff_salaries.createMany({
    data: staffsInfo,
  })

  res.json({
    message: 'Staff salary invoice generated',
  })
})

/*
  @route    GET: /salaries/staffs-invoice
  @access   private
  @desc     GET current month's salary invoices
*/
const staffsSalaryInvoice = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, salaryFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [salaries, total] = await prisma.$transaction([
    prisma.staff_salaries.findMany({
      include: {
        staff: {
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
    prisma.staff_salaries.count(),
  ])

  const formatSalaries = salaries.map(
    ({
      staff,
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
      name: staff.name,
      designation: staff.designation.title,
      profile_img: staff.profile_img
        ? generateFileLink(`staffs/profiles/${staff.profile_img}`)
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

/*
  @route    POST: /salaries/staff-invoice
  @access   private
  @desc     Create custom invoice for a staff
*/
const createStaffSalaryInvoice = asyncHandler(async (req, res, next) => {
  const data = await staffSalaryValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check teacher and last invoice
  await prisma.$transaction(async () => {
    const staffSalaryAndInvoice = await prisma.staffs.findFirst({
      where: {
        id: Number(data.staff_id),
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
            issued_at: 'desc',
          },
          take: 1,
        },
      },
    })

    let salary = staffSalaryAndInvoice.salary
    let due
    let advance
    const previousInvoice = staffSalaryAndInvoice.salaries[0]

    // Check if salary amount is greater
    if (data.amount > salary) {
      return res.status(400).json({
        message: 'Amount cannot exceed base salary',
      })
    }

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
      staff_id: staffSalaryAndInvoice.id,
      amount: salary,
      advance: advance || null,
      due: due || null,
      invoice_type: 'MANUAL',
    }

    // Create Invoice
    await prisma.staff_salaries.createMany({
      data: invoiceInput,
    })

    res.json({
      message: 'Staff salary invoice created',
    })
  })
})

module.exports = {
  getTeachersForSalary,
  getTeacherDetailsForSalary,
  generateTeacherSalaryInvoice,
  teachersSalaryInvoice,
  createTeacherSalaryInvoice,
  getStaffsForSalary,
  getStaffDetailsForSalary,
  generateStaffSalaryInvoice,
  staffsSalaryInvoice,
  createStaffSalaryInvoice,
}
