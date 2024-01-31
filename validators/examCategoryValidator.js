const yup = require('yup')
const prisma = require('../utils/prisma')

const examCategoryValidator = (id) =>
  yup.object({
    exam_name: yup
      .string()
      .required('Exam name is required')
      .test('unique', 'This name already exist', async (value) => {
        const findExamName = await prisma.exam_categories.findUnique({
          where: {
            exam_name: value,
          },
        })

        if (findExamName && !id) {
          return false
        }

        if (findExamName && id) {
          if (findExamName.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findExamName) {
          return true
        }
      }),
  })

module.exports = { examCategoryValidator }
