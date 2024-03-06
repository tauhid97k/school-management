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
    fee_amount: yup.number().integer().required('Fee amount is required'),
    fine_type: yup.string().optional(),
    fine_amount: yup.number().integer().optional(),
    due_type: yup.string().optional(),
    due_amount: yup.number().integer().optional(),
    payment_status: yup.date().required('Payment status is required'),
    payment_date: yup.date().required('Payment date is required'),
  })

module.exports = { studentFeesValidator }
