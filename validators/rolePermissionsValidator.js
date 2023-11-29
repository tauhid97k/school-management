const yup = require('yup')
const prisma = require('../utils/prisma')

const rolePermissionsValidator = yup.object({
  role: yup
    .string()
    .required('Role is required')
    .test('unique', 'Role already exist', async (value) => {
      const role = await prisma.roles.findUnique({
        where: {
          name: value,
        },
      })

      if (role) return false
      else return true
    }),
  permissions: yup
    .array(yup.number().typeError('Permission must be an id'))
    .required('At least one permission is required')
    .test('exist', 'One or more permission is invalid', async (values) => {
      const checkPermissions = await prisma.permissions.findMany({
        where: {
          id: {
            in: values,
          },
        },
      })

      if (checkPermissions.length === values.length) return true
      else return false
    }),
})

const updateRolePermissionsValidator = yup.object({
  role: yup
    .string()
    .required('Role is required')
    .test('exist', 'Role does not exist', async (value) => {
      const role = await prisma.roles.findUnique({
        where: {
          name: value,
        },
      })

      if (role) return true
      else return false
    }),
  permissions: yup
    .array(yup.number().typeError('Permission must be an id'))
    .required('At least one permission is required')
    .test('exist', 'One or more permission is invalid', async (values) => {
      const checkPermissions = await prisma.permissions.findMany({
        where: {
          id: {
            in: values,
          },
        },
      })

      if (checkPermissions.length === values.length) return true
      else return false
    }),
})

module.exports = {
  rolePermissionsValidator,
  updateRolePermissionsValidator,
}
