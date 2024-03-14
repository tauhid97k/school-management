const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { studentFeesValidator } = require('../validators/studentFeesValidator')
const {
  selectQueries,
  studentFeesFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { formatDate } = require('../utils/transformData')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /student-fees/classes/:id/students
  @access   private
  @desc     Get All students for fee
*/
const getStudentInfo = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, studentFeesFields)

  const { class_id, section_id, student_id } = selectedQueries

  let response = {
    students: [],
    student_info: {},
  }

  // Get students of a class/section
  if (class_id && !section_id) {
    response.students = await prisma.students.findMany({
      where: {
        class_id: Number(class_id),
      },
      select: {
        id: true,
        name: true,
        roll: true,
        class_id: true,
        section_id: true,
      },
    })
  } else if (class_id && section_id) {
    response.students = await prisma.students.findMany({
      where: {
        section_id: Number(section_id),
      },
      select: {
        id: true,
        name: true,
        roll: true,
        class_id: true,
        section_id: true,
      },
    })
  }

  // Get Student Info
  if ((class_id || section_id) && student_id) {
    const findStudent = await prisma.students.findUnique({
      where: {
        id: Number(student_id),
      },
      select: {
        id: true,
        name: true,
        roll: true,
        profile_img: true,
        class: {
          select: {
            class_name: true,
          },
        },
        section: {
          select: {
            section_name: true,
          },
        },
      },
    })

    if (!findStudent) {
      return res.status(400).json({
        message: 'Student not found',
      })
    }

    // Format Student
    const {
      id,
      name,
      roll,
      profile_img,
      class: studentClass,
      section,
    } = findStudent
    const formatStudent = {
      id,
      name,
      roll,
      profile_img: profile_img
        ? generateFileLink(`students/profiles/${profile_img}`)
        : null,
      class_name: studentClass.class_name,
      section_name: section.section_name,
    }

    response.student_info = formatStudent
  }

  res.json(response)
})

/*
  @route    GET: /student-fees
  @access   private
  @desc     Get All fee list
*/
const studentFeeList = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, studentFeesFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [studentFees, total] = await prisma.$transaction([
    prisma.student_fees.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            profile_img: true,
            class: {
              select: {
                class_name: true,
              },
            },
            section: {
              select: {
                section_name: true,
              },
            },
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.student_fees.count(),
  ])

  // Format Student Fees
  const formatStudentFees = studentFees.map((fee) => {
    const { student, ...rest } = fee
    return {
      ...rest,
      name: student.name,
      roll: student.roll,
      profile_img: student.profile_img
        ? generateFileLink(`students/profiles/${student.profile_img}`)
        : null,
      class_name: student.class.class_name,
      section_name: student.section.section_name,
    }
  })

  res.json({
    data: formatStudentFees,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /student-fees/:id
  @access   private
  @desc     Get fee details
*/
const studentFeeDetails = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findFeeDetails = await tx.student_fees.findUnique({
      where: {
        id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            profile_img: true,
            class: {
              select: {
                id: true,
                class_name: true,
              },
            },
            section: {
              select: {
                id: true,
                section_name: true,
              },
            },
          },
        },
      },
    })

    if (!findFeeDetails) {
      return res.status(404).json({
        message: 'Fee details not found',
      })
    }

    // Format student fee details
    const { student, payment_date, ...rest } = findFeeDetails
    const formatStudentFeeDetails = {
      ...rest,
      payment_date: formatDate(payment_date),
      name: student.name,
      roll: student.roll,
      profile_img: student.profile_img
        ? generateFileLink(`students/profiles/${student.profile_img}`)
        : null,
      class_id: student.class.id,
      class_name: student.class.class_name,
      section_id: student.section.id,
      section_name: student.section.section_name,
    }

    res.json(formatStudentFeeDetails)
  })
})

/*
  @route    POST: /student-fees/student/:id
  @access   private
  @desc     Get a student fee history
*/
const getStudentFeesHistory = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const selectedQueries = selectQueries(req.query, studentFeesFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const findStudent = await prisma.students.findUnique({
    where: {
      id,
    },
  })

  if (!findStudent) {
    return res.status(404).json({
      message: 'Student not found',
    })
  }

  const [studentFeeHistory, total] = await prisma.$transaction([
    prisma.student_fees.findMany({
      where: {
        student_id: id,
      },
      take,
      skip,
      orderBy,
    }),
    prisma.student_fees.count({
      where: {
        student_id: id,
      },
    }),
  ])

  res.json({
    data: studentFeeHistory,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /student-fees
  @access   private
  @desc     Create student fee
*/
const createStudentFee = asyncHandler(async (req, res, next) => {
  const data = await studentFeesValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.student_fees.create({
    data: {
      student_id: data.student_id,
      fee_type: data.fee_type,
      fee_amount: data.fee_amount,
      fine_type: data.fine_type,
      fine_amount: data.fine_amount,
      due_type: data.due_type,
      due_amount: data.due_amount,
      payment_status: data.payment_status,
      payment_date: data.payment_date,
    },
  })

  res.json({
    message: 'Student fee added',
  })
})

/*
  @route    PUT: /student-fees/:id
  @access   private
  @desc     Update student fee
*/
const updateStudentFee = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await studentFeesValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findStudentFee = await tx.student_fees.findUnique({
      where: {
        id,
      },
    })

    if (!findStudentFee) {
      return res.status(404).json({
        message: 'Fee information not found',
      })
    }

    await tx.student_fees.update({
      where: {
        id: findStudentFee.id,
      },
      data: {
        student_id: data.student_id,
        fee_type: data.fee_type,
        fee_amount: data.fee_amount,
        fine_type: data.fine_type,
        fine_amount: data.fine_amount,
        due_type: data.due_type,
        due_amount: data.due_amount,
        payment_status: data.payment_status,
        payment_date: data.payment_date,
      },
    })

    res.json({
      message: 'Student fee updated',
    })
  })
})

module.exports = {
  getStudentInfo,
  studentFeeList,
  studentFeeDetails,
  getStudentFeesHistory,
  createStudentFee,
  updateStudentFee,
}
