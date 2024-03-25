const yup = require('yup')
const prisma = require('../utils/prisma')

const todoValidator = () =>
  yup.object({
    role: yup
      .string()
      .required('Role is required')
      .test('exist', 'Role does not exist', async (value) => {
        const role = await prisma.roles.findUnique({
          where: {
            name: value,
          },
        })

        return role ? true : false
      }),
    user_id: yup
      .number()
      .typeError('User id must be a number')
      .test('exist', 'User does not exist', async (value, ctx) => {
        const role = ctx.parent.role
        if (!role) {
          throw new yup.ValidationError('Role is required', role, 'role')
        }

        if (role === 'admin') {
          const findAdmin = await prisma.admins.findUnique({
            where: {
              id: value,
            },
          })

          return findAdmin ? true : false
        } else if (role === 'teacher') {
          const findTeacher = await prisma.teachers.findUnique({
            where: {
              id: value,
            },
          })
          return findTeacher ? true : false
        } else if (role === 'student') {
          const findStudent = await prisma.students.findUnique({
            where: {
              id: value,
            },
          })
          return findStudent ? true : false
        } else {
          return false
        }
      }),
    title: yup.string().required('Title is required'),
    description: yup.string().optional(),
    is_completed: yup.boolean().default(false).optional(),
  })

const todoStatusValidator = () =>
  yup.object({
    is_completed: yup.boolean().required('Status is required'),
  })

module.exports = {
  todoValidator,
  todoStatusValidator,
}
