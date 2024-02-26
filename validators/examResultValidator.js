const yup = require('yup')
const prisma = require('../utils/prisma')

const examResultValidator = (id) =>
  yup.object({
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
    subjects_marks: yup
      .array()
      .of(
        yup.object({
          subject_id: yup
            .number()
            .typeError('Subject id must be a number')
            .test('exists', 'Subject does not exist', async (value) => {
              if (!value) return true

              const findSubject = await prisma.subjects.findUnique({
                where: {
                  id: value,
                },
              })

              if (findSubject) return true
              else return false
            }),
          subject_name: yup.string().optional(),
          full_mark: yup
            .number()
            .typeError('Full mark must be in number')
            .optional(),
          obtained_mark: yup
            .number()
            .typeError('Subject mark must be in number'),
          grade: yup.string().optional(),
        })
      )
      .min(1, 'At least one subject mark is required')
      .required('At least one subject mark is required'),
  })

const examResultPublishValidator = () =>
  yup.object({
    status: yup
      .string()
      .required('Status is required')
      .oneOf(['PENDING', 'REVALUATING', 'PUBLISHED']),
  })

module.exports = { examResultValidator, examResultPublishValidator }
