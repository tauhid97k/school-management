const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { selectQueries, examResultFields } = require('../utils/metaData')
const {
  examResultSubjectsValidator,
  examResultValidator,
} = require('../validators/examResultValidator')

/*
  @route    GET: /exam-results/subjects
  @access   private
  @desc     Get subjects for result of a student
*/
const getExamSubjectsForResults = asyncHandler(async (req, res, next) => {
  const { class_id, exam_id } = await examResultSubjectsValidator.validate(
    req.query,
    {
      abortEarly: false,
    }
  )

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
        name,
        code,
        full_mark,
      })
    )

    res.json(response)
  })
})

module.exports = {
  getExamSubjectsForResults,
}
