const yup = require('yup')
const prisma = require('../utils/prisma')

const examValidator = () =>
  yup.object({
    exam_category_id: yup
      .number()
      .typeError('Exam category id must be number')
      .required('Exam category is required')
      .test('exists', 'Exam category does not exist', async (value) => {
        const findExamCategory = await prisma.exam_categories.findUnique({
          where: {
            id: value,
          },
        })

        if (findExamCategory) return true
        else return false
      }),
    classes: yup
      .array(yup.number().typeError('Class must be an id'))
      .required('At least one class is required')
      .test('exist', 'One or more classes are invalid', async (values) => {
        const checkClasses = await prisma.classes.findMany({
          where: {
            id: {
              in: values,
            },
          },
        })

        if (checkClasses.length === values.length) return true
        else return false
      }),
    sections: yup
      .array(yup.number().typeError('Section must be an id'))
      .test('exist', 'One or more sections are invalid', async (values) => {
        const checkSections = await prisma.sections.findMany({
          where: {
            id: {
              in: values,
            },
          },
        })

        if (checkSections.length === values.length) return true
        else return false
      }),
    exam_routine: yup
      .array()
      .of(
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
            .test('time', 'End time must be in the future', (value) => {
              const currentDate = new Date()
              const endDate = new Date(value)
              return endDate > currentDate
            })
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

module.exports = { examValidator }
