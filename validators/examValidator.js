const yup = require('yup')
const prisma = require('../utils/prisma')

const examValidator = (id) =>
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
          start_time: yup.string().required('Start time is required'),
          end_time: yup.string().required('End time is required'),
          exam_date: yup.string().required('Exam date is required'),
        })
      )
      .required('Exam routine is required')
      .min(1, 'Exam routine is required'),
  })

module.exports = { examValidator }
