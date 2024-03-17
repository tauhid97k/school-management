const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  examValidator,
  examStatusUpdateValidator,
} = require('../validators/examValidator')

/*
  @route    GET: /exams/student/:id
  @access   private
  @desc     Get exam for student
*/
const getExamForStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const findStudent = await prisma.students.findUnique({
    where: {
      id,
    },
  })

  if (!findStudent) {
    return res.status(404).json({ message: 'Student not found' })
  }

  let whereCondition = {}

  if (findStudent.class_id && !findStudent.section_id) {
    whereCondition = {
      exam_sections: {
        some: {
          class_id: findStudent.class_id,
        },
      },
    }
  } else if (findStudent.section_id) {
    whereCondition = {
      exam_sections: {
        some: {
          section_id: findStudent.section_id,
        },
      },
    }
  }

  // Get Exam
  const [exams, total] = await prisma.$transaction([
    prisma.exams.findMany({
      where: whereCondition,
      include: {
        exam_category: true,
        exam_routines: {
          include: {
            subject: true,
          },
          orderBy: {
            start_time: 'asc',
          },
        },
        exam_sections: true,
      },
      take,
      skip,
      orderBy,
    }),
    prisma.exams.count({
      where: whereCondition,
    }),
  ])

  // Format Exams
  const formatExams = exams.map((exam) => {
    return {
      id: exam.id,
      exam_name: exam.exam_category.exam_name,
      exam_date: exam.exam_routines?.at(0)?.start_time,
      status: exam.status,
      created_at: exam.created_at,
      updated_at: exam.updated_at,
    }
  })

  res.json({
    data: formatExams,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /exams/student/:id/details/:examId
  @access   private
  @desc     Get exam details for student
*/
const getExamDetailsForStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const examId = Number(req.params.examId)

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent) {
      return res.status(404).json({ message: 'Student not found' })
    }

    let whereCondition = {}

    if (findStudent.class_id && !findStudent.section_id) {
      whereCondition = {
        exam_sections: {
          some: {
            class_id: findStudent.class_id,
          },
        },
      }
    } else if (findStudent.section_id) {
      whereCondition = {
        exam_sections: {
          some: {
            section_id: findStudent.section_id,
          },
        },
      }
    }

    // Get Exam Details
    const findExam = await tx.exams.findUnique({
      where: {
        id: examId,
      },
      include: {
        exam_category: true,
        exam_routines: {
          include: {
            subject: true,
          },
          orderBy: {
            start_time: 'asc',
          },
        },
      },
    })

    if (!findExam) {
      return res.status(404).json({ message: 'Exam not found' })
    }

    // Format Data
    const formatData = {
      id: findExam.id,
      status: findExam.status,
      exam_date: findExam.exam_routines?.at(0)?.start_time,
      exam_name: findExam.exam_category.exam_name,
      exam_routine: findExam.exam_routines.map(
        ({
          id,
          full_mark,
          start_time,
          end_time,
          subject: { id: subjectId, name, code },
        }) => ({
          id,
          full_mark,
          start_time,
          end_time,
          subject_name: name,
          subject_code: code,
        })
      ),
      created_at: findExam.created_at,
      updated_at: findExam.updated_at,
    }

    res.json(formatData)
  })
})

/*
  @route    GET: /exams/class-sections
  @access   private
  @desc     All classes and their sections list
*/
const getAllClassesAndSections = asyncHandler(async (req, res, next) => {
  const classesAndSections = await prisma.classes.findMany({
    include: {
      sections: true,
    },
  })

  res.json({
    classesAndSections,
  })
})

/*
  @route    GET: /exams
  @access   private
  @desc     All exams
*/
const getAllExams = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [exams, total] = await prisma.$transaction([
    prisma.exams.findMany({
      take,
      skip,
      orderBy,
      include: {
        exam_category: true,
        exam_routines: {
          orderBy: {
            start_time: 'asc',
          },
        },
      },
    }),
    prisma.exams.count(),
  ])

  // Format Exams
  const formatExams = exams.map((exam) => {
    return {
      id: exam.id,
      exam_name: exam.exam_category.exam_name,
      exam_date: exam.exam_routines?.at(0)?.start_time,
      status: exam.status,
      created_at: exam.created_at,
      updated_at: exam.updated_at,
    }
  })

  res.json({
    data: formatExams,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /exams/:id
  @access   private
  @desc     Get an exam details
*/
const getExam = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const findExam = await tx.exams.findUnique({
      where: {
        id,
      },
      include: {
        exam_category: true,
        exam_classes: {
          include: {
            class: true,
          },
        },
        exam_sections: {
          include: {
            section: true,
          },
        },
        exam_routines: {
          include: {
            subject: true,
          },
          orderBy: {
            start_time: 'asc',
          },
        },
      },
    })

    if (!findExam)
      return res.status(404).json({
        message: 'No exam found',
      })

    // Format Data
    const formatData = {
      id: findExam.id,
      status: findExam.status,
      exam_date: findExam.exam_routines?.at(0)?.start_time,
      exam_category: findExam.exam_category,
      classes: findExam.exam_classes.map(({ class: { id, class_name } }) => ({
        id,
        class_name,
      })),
      sections: findExam.exam_sections.map(
        ({ section: { id, class_id, section_name } }) => ({
          id,
          class_id,
          section_name,
        })
      ),
      exam_routine: findExam.exam_routines.map(
        ({
          id,
          full_mark,
          start_time,
          end_time,
          subject: { id: subjectId, name, code },
        }) => ({
          id,
          full_mark,
          start_time,
          end_time,
          subject: {
            id: subjectId,
            name,
            code,
          },
        })
      ),
      created_at: findExam.created_at,
      updated_at: findExam.updated_at,
    }

    res.json(formatData)
  })
})

/*
  @route    POST: /exams
  @access   private
  @desc     Create a new exam
*/
const createExam = asyncHandler(async (req, res, next) => {
  const data = await examValidator().validate(req.body, {
    abortEarly: false,
  })

  // Format Data For Database
  const formatClasses = data.classes.map((class_id) => ({ class_id }))
  const formatSections = data.sections.map((section_id) => ({ section_id }))

  await prisma.$transaction(async (tx) => {
    const exam = await tx.exams.create({
      data: {
        exam_category_id: data.exam_category_id,
        exam_classes: {
          createMany: {
            data: formatClasses,
          },
        },
        ...(formatSections.length > 0 && {
          exam_sections: {
            createMany: {
              data: formatSections,
            },
          },
        }),
        exam_routines: {
          createMany: {
            data: data.exam_routine,
          },
        },
      },
    })

    await tx.exam_results_publishing.create({
      data: {
        exam_id: exam.id,
      },
    })
  })

  res.status(201).json({ message: 'Exam created successfully' })
})

/*
  @route    PUT: /exams/:id
  @access   private
  @desc     Update an exam
*/
const updateExam = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const { exam_category_id, classes, sections, exam_routine } =
    await examValidator().validate(req.body, {
      abortEarly: false,
    })

  await prisma.$transaction(async (tx) => {
    const findExam = await tx.exams.findUnique({
      where: {
        id,
      },
    })

    if (!findExam)
      return res.status(404).json({
        message: 'No exam found',
      })

    // Delete existing entries in exam classes
    await tx.exam_classes.deleteMany({
      where: {
        exam_id: findExam.id,
      },
    })

    // Delete existing entries in exam sections
    await tx.exam_sections.deleteMany({
      where: {
        exam_id: findExam.id,
      },
    })

    // Delete existing entries in exam routine
    await tx.exam_routines.deleteMany({
      where: {
        exam_id: findExam.id,
      },
    })

    // Format Data For Database
    const formatClasses = classes.map((class_id) => ({ class_id }))
    const formatSections = sections.map((section_id) => ({ section_id }))

    await tx.exams.update({
      where: {
        id: findExam.id,
      },
      data: {
        exam_category_id,
        exam_classes: {
          createMany: {
            data: formatClasses,
          },
        },
        ...(formatSections.length > 0 && {
          exam_sections: {
            createMany: {
              data: formatSections,
            },
          },
        }),
        exam_routines: {
          createMany: {
            data: exam_routine,
          },
        },
      },
    })

    res.json({ message: 'Exam updated successfully' })
  })
})

/*
  @route    PATCH: /exams/:id/status
  @access   private
  @desc     Update exam status
*/
const updateExamStatus = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const { status } = await examStatusUpdateValidator.validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findExam = await tx.exams.findUnique({
      where: {
        id,
      },
    })

    if (!findExam)
      return res.status(404).json({
        message: 'No exam found',
      })

    if (findExam.status === 'ACTIVE') {
      return res.status(400).json({
        message: 'Cannot change status for ongoing exam',
      })
    }

    await tx.exams.update({
      where: {
        id: findExam.id,
      },
      data: {
        status,
      },
    })

    res.json({
      message: 'Status updated',
    })
  })
})

/*
  @route    DELETE: /exams/:id
  @access   private
  @desc     delete an exam
*/
const deleteExam = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findExam = await tx.exams.findUnique({
      where: {
        id,
      },
    })

    if (!findExam)
      return res.status(404).json({
        message: 'No exam found',
      })

    await tx.exams.delete({
      where: { id },
    })

    res.json({ message: 'Exam deleted successfully' })
  })
})

module.exports = {
  getAllClassesAndSections,
  getExamForStudent,
  getExamDetailsForStudent,
  getAllExams,
  getExam,
  createExam,
  updateExam,
  updateExamStatus,
  deleteExam,
}
