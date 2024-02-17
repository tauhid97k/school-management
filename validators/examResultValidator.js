const yup = require('yup')
const prisma = require('../utils/prisma')

const examResultSubjectsValidator = yup.object({
  class_id: yup
    .number()
    .typeError('Class id must be a number')
    .required('Class is required')
    .test('exists', 'Class id does not exist', async (value) => {
      const findClass = await prisma.classes.findUnique({
        where: {
          id: value,
        },
      })

      if (findClass) return true
      else return false
    }),
  exam_id: yup
    .number()
    .typeError('Exam id must be a number')
    .required('Exam is required')
    .test('exists', 'Exam id does not exist', async (value) => {
      const findExam = await prisma.exams.findUnique({
        where: {
          id: value,
        },
      })

      if (findExam) return true
      else return false
    }),
})

const examResultValidator = (id) =>
  yup.array().of({
    exam_id: yup
      .number()
      .typeError('Exam id must be a number')
      .required('Exam is required')
      .test('exists', 'Exam id does not exist', async (value) => {
        const findExam = await prisma.exams.findUnique({
          where: {
            id: value,
          },
        })

        if (findExam) return true
        else return false
      }),
    student_id: yup
      .number()
      .typeError('Student id must be a number')
      .required('Student is required')
      .test('exists', 'Student id does not exist', async (value) => {
        const findStudent = await prisma.students.findUnique({
          where: {
            id: value,
          },
        })

        if (findStudent) return true
        else return false
      }),
    subject_id: yup
      .number()
      .typeError('Subject id must be a number')
      .required('Subject is required')
      .test('exists', 'Subject does not exist', async (value) => {
        const findSubject = await prisma.subjects.findUnique({
          where: {
            id: value,
          },
        })

        if (findSubject) return true
        else return false
      }),
    subject_mark: yup
      .number()
      .typeError('Subject mark must be in number')
      .required('Subject mark is required')
      .test(
        'mark',
        'Subject mark cannot be greater than full mark',
        async (value, ctx) => {
          const examId = ctx.parent.exam_id
          const subjectId = ctx.parent.subject_id

          if (!examId) {
            throw new yup.ValidationError('Exam is required', examId, 'exam_id')
          }

          if (!subjectId) {
            throw new yup.ValidationError(
              'Subject is required',
              subjectId,
              'exam_id'
            )
          }

          const examRoutine = await prisma.exam_routines.findUnique({
            where: {
              AND: [{ exam_id: examId }, { subject_id: subjectId }],
            },
          })

          return value > examRoutine.full_mark ? false : true
        }
      ),
    grade: yup.string().optional(),
  })

module.exports = { examResultSubjectsValidator, examResultValidator }
