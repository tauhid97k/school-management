const yup = require('yup')
const prisma = require('../utils/prisma')

const salaryValidator = (id) =>
  yup.object({
    user_type: yup
      .string()
      .required('User type is required')
      .test('exist', 'User type does not exist', async (value) => {
        const findUserRole = await prisma.roles.findUnique({
          where: {
            name: value,
          },
        })

        return findUserRole ? true : false
      }),
    user_id: yup
      .number()
      .typeError('User id must be a number')
      .test('exist', 'User does not exist', async (value, ctx) => {
        const user_type = ctx.parent.user_type
        if (!user_type) {
          throw new yup.ValidationError(
            'User type is required',
            value,
            'user_type'
          )
        }

        if (user_type === 'admin') {
          const findAdmin = await prisma.admins.findUnique({
            where: {
              id: value,
            },
          })

          return findAdmin ? true : false
        } else if (user_type === 'teacher') {
          const findTeacher = await prisma.teachers.findUnique({
            where: {
              id: value,
            },
          })

          return findTeacher ? true : false
        } else {
          const findStaff = await prisma.staffs.findUnique({
            where: {
              id: value,
            },
          })
          return findStaff ? true : false
        }
      }),
    salary_amount: yup
      .number()
      .integer()
      .typeError('Salary amount must be a valid number')
      .required('Salary amount is required'),
    salary_date: yup.date().required('Salary date is required'),
    bonus: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== '' ? Number(val) : null)),
    advance: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== '' ? Number(val) : null)),
    due: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== '' ? Number(val) : null)),
    payment_status: yup
      .string()
      .required('Payment status is required')
      .oneOf(['PAID', 'UNPAID']),
  })

module.exports = { salaryValidator }
