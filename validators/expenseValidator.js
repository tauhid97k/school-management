const yup = require('yup')
const prisma = require('../utils/prisma')

const expenseValidator = () =>
  yup.object({
    expense_category_id: yup
      .number()
      .typeError('Category id must be a number')
      .required('Expense category is required')
      .test('exist', 'Expense category does not exist', async (value) => {
        const findExpenseCategory = await prisma.expense_categories.findUnique({
          where: {
            id: value,
          },
        })

        if (findExpenseCategory) return true
        else return false
      }),
    title: yup.string().required('Title is required'),
    description: yup.string().optional(),
    invoice_no: yup.string().optional(),
    date: yup.date().required('Date is required'),
    attachment: yup.string().optional(),
  })

const expenseAttachmentValidator = yup.object({
  attachment: yup
    .mixed()
    .test(
      'type',
      'Invalid file type. Only JPG, JPEG, and PNG are allowed',
      (file) => {
        if (!file) return true

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(file.mimetype)) return false
        else return true
      }
    )
    .test('size', 'File size is too large; max 2mb is allowed', (file) => {
      if (!file) return true

      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) return false
      return true
    }),
})

module.exports = { expenseValidator, expenseAttachmentValidator }
