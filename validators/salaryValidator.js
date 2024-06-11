const yup = require('yup')
const prisma = require('../utils/prisma')

const teacherSalaryValidator = (id) =>
  yup.object({
    teacher_id: yup
      .number()
      .typeError('Teacher id must be a number')
      .required('Teacher id is required')
      .test('exist', 'Teacher id does not exist', async (value) => {
        const teacher = await prisma.teachers.findUnique({
          where: {
            id: value,
          },
        })

        if (teacher) return true
        else return false
      }),
    amount: yup
      .number()
      .integer()
      .typeError('Amount must be a valid number')
      .required('Amount is required')
      .min(1, 'Invalid minimum amount'),
    bonus: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== '' ? Number(val) : null))
      .min(1, 'Invalid minimum amount'),
    advance: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== '' ? Number(val) : null))
      .min(1, 'Invalid minimum amount'),
    status: yup
      .string()
      .required('Payment status is required')
      .oneOf(['PAID', 'UNPAID']),
  })

const staffSalaryValidator = (id) =>
  yup.object({
    staff_id: yup
      .number()
      .typeError('Staff id must be a number')
      .required('Staff id is required')
      .test('exist', 'Staff id does not exist', async (value) => {
        const staff = await prisma.staffs.findUnique({
          where: {
            id: value,
          },
        })

        if (staff) return true
        else return false
      }),
    amount: yup
      .number()
      .integer()
      .typeError('Amount must be a valid number')
      .required('Amount is required')
      .min(1, 'Invalid minimum amount'),
    bonus: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== '' ? Number(val) : null))
      .min(1, 'Invalid minimum amount'),
    advance: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== '' ? Number(val) : null))
      .min(1, 'Invalid minimum amount'),
    status: yup
      .string()
      .required('Payment status is required')
      .oneOf(['PAID', 'UNPAID']),
  })
module.exports = { teacherSalaryValidator, staffSalaryValidator }
