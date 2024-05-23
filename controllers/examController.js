const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
  examFields,
} = require('../utils/metaData')
const {
  examValidator,
  examStatusUpdateValidator,
} = require('../validators/examValidator')

/*
  @route    GET: /exams/teacher/:id
  @access   private
  @desc     Get exam for teacher
*/
const getExamForTeacher = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const selectedQueries = selectQueries(req.query, examFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  let { class_id } = selectedQueries
  class_id = class_id ? Number(class_id) : null

  const findTeacher = await prisma.teachers.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      teacher_classes: {
        select: {
          class_id: true,
        },
      },
      teacher_sections: {
        select: {
          section_id: true,
        },
      },
    },
  })

  if (!findTeacher) {
    return res.status(404).json({ message: 'Teacher not found' })
  }

  // Format teacher classes/sections
  const formatClasses = findTeacher.teacher_classes.map(
    ({ class_id }) => class_id
  )
  const formatSections = findTeacher.teacher_sections.map(
    ({ section_id }) => section_id
  )

  // Get Exam
  const [exams, total] = await prisma.$transaction([
    prisma.exams.findMany({
      where: {
        OR: [
          {
            AND: [
              { section_id: null },
              class_id ? { class_id } : { class_id: { in: formatClasses } },
            ],
          },
          {
            section_id: { in: formatSections },
          },
        ],
      },
      select: {
        id: true,
        status: true,
        created_at: true,
        updated_at: true,
        exam_category: {
          select: {
            exam_name: true,
          },
        },
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
        exam_routines: {
          select: {
            full_mark: true,
            start_time: true,
            end_time: true,
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            start_time: 'asc',
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.exams.count({
      where: {
        OR: [
          {
            AND: [
              { section_id: null },
              class_id ? { class_id } : { class_id: { in: formatClasses } },
            ],
          },
          {
            section_id: { in: formatSections },
          },
        ],
      },
    }),
  ])

  const formatExams = exams.map((exam) => ({
    id: exam.id,
    exam_name: exam.exam_category.exam_name,
    exam_date: exam.exam_routines?.at(0)?.start_time,
    class_name: exam.class.class_name,
    section_name: exam.section.section_name,
    status: exam.status,
    created_at: exam.created_at,
    updated_at: exam.updated_at,
  }))

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
      class_id: findStudent.class_id,
    }
  } else if (findStudent.section_id) {
    whereCondition = {
      section_id: findStudent.section_id,
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
        class_id: findStudent.class_id,
      }
    } else if (findStudent.section_id) {
      whereCondition = {
        section_id: findStudent.section_id,
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
          subject_id: subjectId,
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
  @route    GET: /exams/teacher/:id/details/:examId
  @access   private
  @desc     Get exam details for teacher
*/
const getExamDetailsForTeacher = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const examId = Number(req.params.examId)

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher) {
      return res.status(404).json({ message: 'Teacher not found' })
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
          subject_id: subjectId,
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
  const selectedQueries = selectQueries(req.query, examFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)
  const { class_id } = selectQueries

  const [exams, total] = await prisma.$transaction([
    prisma.exams.findMany({
      where: class_id ? { class_id: Number(class_id) } : {},
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
    prisma.exams.count({
      where: class_id ? { class_id: Number(class_id) } : {},
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
        class: true,
        section: true,
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
      exam_category_id: findExam.exam_category.id,
      exam_name: findExam.exam_category.exam_name,
      class_id: findExam.class.id,
      class_name: findExam.class.class_name,
      section_id: findExam.section.id,
      section_name: findExam.section.section_name,
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
          subject_id: subjectId,
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
  @route    POST: /exams
  @access   private
  @desc     Create a new exam
*/
const createExam = asyncHandler(async (req, res, next) => {
  const data = await examValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check class section
  if (!data.section_id) {
    const checkClassSection = await prisma.classes.findUnique({
      where: {
        id: data.class_id,
      },
      select: {
        id: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    })

    if (checkClassSection._count.sections > 0) {
      return res.status(400).json({
        message: 'Section id is required',
      })
    }
  }

  await prisma.$transaction(async (tx) => {
    const exam = await tx.exams.create({
      data: {
        exam_category_id: data.exam_category_id,
        class_id: data.class_id,
        section_id: data.section_id,
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

  const data = await examValidator().validate(req.body, {
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
        message: 'Exam not found',
      })

    // Delete existing entries in exam routine
    await tx.exam_routines.deleteMany({
      where: {
        exam_id: findExam.id,
      },
    })

    await tx.exams.update({
      where: {
        id: findExam.id,
      },
      data: {
        exam_category_id: data.exam_category_id,
        class_id: data.class_id,
        section_id: data.section_id,
        exam_routines: {
          createMany: {
            data: data.exam_routine,
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
  getExamForTeacher,
  getExamDetailsForStudent,
  getExamDetailsForTeacher,
  getAllExams,
  getExam,
  createExam,
  updateExam,
  updateExamStatus,
  deleteExam,
}
