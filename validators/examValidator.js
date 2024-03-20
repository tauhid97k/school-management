const yup = require('yup')
const prisma = require('../utils/prisma')

const examValidator = () =>
  yup.object({
    exam_category_id: yup
      .number()
      .typeError('Exam category id must be a number')
      .required('Exam category is required')
      .test('exist', 'Exam category does not exist', async (value) => {
        const findExamCategory = await prisma.exam_categories.findUnique({
          where: {
            id: value,
          },
        })

        return findExamCategory ? true : false
      }),
    class_id: yup
      .array(yup.number().typeError('Class must be an id'))
      .required('At least one class is required')
      .test('exist', 'Class does not exist', async (value) => {
        const findClass = await prisma.classes.findUnique({
          where: {
            id: value,
          },
        })

        return findClass ? true : false
      }),
    section_id: yup
      .array(yup.number().typeError('Section must be an id'))
      .test('exist', 'Section does not exist', async (value) => {
        if (!value) return true

        const findSection = await prisma.sections.findUnique({
          where: {
            id: value,
          },
        })

        return findSection ? true : false
      }),
    exam_routine: yup
      .array(
        yup.object({
          subject_id: yup
            .number()
            .typeError('Subject id must be a number')
            .required('Subject is required')
            .test('exist', 'Subject does not exist', async (value) => {
              const findSubject = await prisma.subjects.findUnique({
                where: {
                  id: value,
                },
              })

              if (findSubject) return true
              else return false
            }),
          full_mark: yup
            .number()
            .typeError('Subject mark must be in number')
            .integer('Subject mark must be an integer')
            .positive('Subject mark must be a positive number')
            .required('Subject full mark is required'),
          start_time: yup
            .date()
            .typeError('Start time must be a valid date time')
            .required('Start time is required')
            .test('time', 'Start time must be in the future', (value) => {
              const currentDate = new Date()
              const startDate = new Date(value)
              return startDate > currentDate
            }),
          end_time: yup
            .date()
            .typeError('End time must be a valid date time')
            .required('End time is required')
            .test(
              'compare',
              'End time must be after start time; and must be on the same day',
              (value, ctx) => {
                const startTime = ctx.parent.start_time

                if (!startTime) {
                  throw new yup.ValidationError(
                    'Please, select start time first',
                    value,
                    'start_time'
                  )
                }

                const startDate = new Date(startTime)
                  .toISOString()
                  .split('T')[0]
                const endDate = new Date(value).toISOString().split('T')[0]

                return value > startTime && startDate === endDate
              }
            ),
        })
      )
      .required('Exam routine is required')
      .min(1, 'Exam routine is required'),
  })

const examStatusUpdateValidator = yup.object({
  status: yup.string().optional().oneOf(['ACTIVE', 'CANCELLED']),
})

module.exports = { examValidator, examStatusUpdateValidator }
