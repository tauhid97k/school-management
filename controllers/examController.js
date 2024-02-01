const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { examValidator } = require('../validators/examValidator')

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
      },
    }),
    prisma.exams.count(),
  ])

  res.json({
    data: exams,
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
  const findExam = await prisma.exams.findUnique({
    where: {
      id,
    },
    include: {
      exam_category: true,
      exam_classes: {
        select: {
          class_id: true,
        },
      },
      exam_sections: {
        select: {
          section_id: true,
        },
      },
    },
  })

  if (!findExam)
    return res.status(404).json({
      message: 'No exam found',
    })

  // Format the data
  const classes = findExam.exam_classes.map((examClass) => examClass.class_id)

  const sections = findExam.exam_sections.map(
    (examSection) => examSection.section_id
  )

  const formatData = {
    id: findExam.id,
    exam_category: findExam.exam_category.exam_name,
    classes,
    sections,
    created_at: findExam.created_at,
    updated_at: findExam.updated_at,
  }

  res.json(formatData)
})

/*
  @route    POST: /exams
  @access   private
  @desc     Create a new exam
*/
const createExam = asyncHandler(async (req, res, next) => {
  const { exam_category_id, classes, sections, exam_routine } =
    await examValidator().validate(req.body, {
      abortEarly: false,
    })

  // Format Data For Database
  const formatClasses = classes.map((class_id) => ({ class_id }))
  const formatSections = sections.map((section_id) => ({ section_id }))

  await prisma.exams.create({
    data: {
      exam_category_id,
      exam_routine,
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
    },
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
    await examValidator(id).validate(req.body, {
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

    // Format Data For Database
    const formatClasses = classes.map((class_id) => ({ class_id }))
    const formatSections = sections.map((section_id) => ({ section_id }))

    await tx.exams.update({
      where: {
        id: findExam.id,
      },
      data: {
        exam_category_id,
        exam_routine,
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
      },
    })

    res.json({ message: 'Exam updated successfully' })
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
  getAllExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
}
