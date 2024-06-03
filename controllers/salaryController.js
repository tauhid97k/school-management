const asyncHandler = require("express-async-handler")
const prisma = require("../utils/prisma")
const {
  selectQueries,
  paginateWithSorting,
  salaryFields,
} = require("../utils/metaData")
const { salaryValidator } = require("../validators/salaryValidator")
const dayjs = require("dayjs")
const generateFileLink = require("../utils/generateFileLink")

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
      bonus: null,
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

module.exports = { generateTeacherSalaryInvoice, teachersSalaryInvoice }
