const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  examResultFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { examResultValidator } = require('../validators/examResultValidator')

/*
  @route    GET: /exam-results/subjects
  @access   private
  @desc     Get subjects for result of a student
*/
const getExamSubjectsForResults = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, examResultFields)

  const { class_id, exam_id } = selectedQueries

  if (!class_id) {
    return res.status(400).json({
      message: 'Class id is required',
    })
  }

  await prisma.$transaction(async (tx) => {
    let response = {
      students: [],
      exams: [],
      subjects: [],
    }

    const findExams = await tx.exams.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        exam_classes: {
          where: {
            class_id: Number(class_id),
          },
          include: {
            exam: {
              include: {
                exam_category: true,
              },
            },
          },
        },
      },
    })

    if (findExams.length) {
      response.exams = findExams.flatMap(({ exam_classes }) =>
        exam_classes.map(
          ({
            exam: {
              id,
              exam_category: { exam_name },
            },
          }) => ({
            id,
            exam_name,
          })
        )
      )
    }

    // Get All Students (Of selected class)
    response.students = await tx.students.findMany({
      where: {
        class_id: Number(class_id),
      },
      select: {
        id: true,
        name: true,
        roll: true,
      },
    })

    // Get Subjects (Routine here as these subjects are selected for the exam)
    if (exam_id) {
      const getSubjects = await tx.exam_routines.findMany({
        where: {
          exam_id: Number(exam_id),
        },
        include: {
          subject: true,
        },
      })

      response.subjects = getSubjects.map(
        ({ full_mark, subject: { id, name, code } }) => ({
          id,
          name,
          code,
          full_mark,
        })
      )
    }

    res.json(response)
  })
})

/*
  @route    GET: /exam-results
  @access   private
  @desc     Get exam results
*/
const getExamResults = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, examResultFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)
  let { class_id, exam_id } = selectedQueries

  let response = {
    exams: [],
    results: [],
  }

  if (class_id) {
    const findExams = await prisma.exams.findMany({
      include: {
        exam_classes: {
          where: {
            class_id: Number(class_id),
          },
          include: {
            exam: {
              include: {
                exam_category: true,
              },
            },
          },
        },
      },
    })

    response.exams = findExams.flatMap(({ exam_classes }) =>
      exam_classes.map(
        ({
          exam: {
            id,
            exam_category: { exam_name },
          },
        }) => ({
          id,
          exam_name,
        })
      )
    )
  }

  const [results, total] = await prisma.$transaction([
    prisma.exam_results.findMany({
      where: {
        AND: [
          class_id ? { class_id: Number(class_id) } : {},
          exam_id ? { exam_id: Number(exam_id) } : {},
        ],
      },
      select: {
        id: true,
        class_id: true,
        exam_id: true,
        student_id: true,
        class: true,
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.exam_results.count({
      where: {
        AND: [
          class_id ? { class_id: Number(class_id) } : {},
          exam_id ? { exam_id: Number(exam_id) } : {},
        ],
      },
    }),
  ])

  const formatResults = results.map(
    ({
      id,
      class: { class_name },
      student: { roll, name },
      subjects_marks,
    }) => ({
      id,
      class_name,
      student_name: name,
      student_roll: roll,
      subjects_marks,
    })
  )

  response.results = formatResults

  res.json({
    data: response,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /exam-results
  @access   private
  @desc     Create exam result
*/
const createExamResult = asyncHandler(async (req, res, next) => {
  const data = await examResultValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.exam_results.create({
    data,
  })

  res.json({
    message: 'Subject mark added',
  })
})

/*
  @route    PUT: /exam-results
  @access   private
  @desc     Update exam result
*/
const updateExamResult = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await examResultValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    await tx.exam_results.update({
      where: {
        id,
      },
      data,
    })

    res.json({
      message: 'Subject mark added or updated',
    })
  })
})

module.exports = {
  getExamSubjectsForResults,
  getExamResults,
  createExamResult,
  updateExamResult,
}
