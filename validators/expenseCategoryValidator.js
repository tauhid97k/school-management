const yup = require('yup')
const prisma = require('../utils/prisma')

const expenseCategoryValidator = (id) =>
  yup.object({
    category_name: yup
      .string()
      .required('Exam name is required')
      .test('unique', 'This name already exist', async (value) => {
        const findExpenseCategory = await prisma.expense_categories.findUnique({
          where: {
            category_name: value,
          },
        })

        if (findExpenseCategory && !id) {
          return false
        }

        if (findExpenseCategory && id) {
          if (findExpenseCategory.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findExpenseCategory) {
          return true
        }
      }),
    description: yup.string().optional(),
  })

module.exports = { expenseCategoryValidator }
