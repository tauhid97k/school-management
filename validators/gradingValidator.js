const yup = require('yup')
const prisma = require('../utils/prisma')

const gradingValidator = (id) =>
  yup.object({
    start_range: yup
      .number()
      .typeError('Start range must be number')
      .integer('Start range must be an integer')
      .positive('Start range must be a positive integer')
      .required('Start range is required'),
    end_range: yup
      .number()
      .typeError('End range must be number')
      .integer('Start range must be an integer')
      .positive('Start range must be a positive integer')
      .required('End range is required'),
    grading_name: yup
      .string()
      .required('Grading name is required')
      .test('unique', 'Grading name already exist', async (value) => {
        const findGrade = await prisma.grades.findUnique({
          where: {
            grading_name: value,
          },
        })

        if (findGrade && !id) {
          return false
        }

        if (findGrade && id) {
          if (findGrade.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findGrade) {
          return true
        }
      }),
    grading_point: yup
      .number()
      .typeError('Grading point must be a number')
      .positive('Grading point must be a positive number'),
    comment: yup.string().optional(),
  })

module.exports = { gradingValidator }
