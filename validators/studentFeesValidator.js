const yup = require('yup')
const prisma = require('../utils/prisma')

const studentFeesValidator = (id) =>
  yup.object({
    student_id: yup
      .number()
      .typeError('Student id must be number')
      .required('Student is required')
      .test('exist', 'Student does not exist', async (value) => {
        const findStudent = await prisma.students.findUnique({
          where: {
            id: value,
          },
        })

        return findStudent ? true : false
      }),
    fee_type: yup.string().required('Fee type is required'),
    fee_amount: yup
      .number()
      .integer()
      .typeError('Fee amount must be an integer')
      .required('Fee amount is required'),
    fine_type: yup.string().optional(),
    fine_amount: yup
      .number()
      .integer()
      .typeError('Fee amount must be an integer')
      .optional()
      .nullable(),
    due_type: yup.string().optional(),
    due_amount: yup
      .number()
      .integer()
      .typeError('Fee amount must be an integer')
      .optional()
      .nullable(),
    payment_status: yup
      .string()
      .required('Payment status is required')
      .oneOf(['PAID', 'UNPAID']),
    payment_date: yup.date().required('Payment date is required'),
  })

module.exports = { studentFeesValidator }
