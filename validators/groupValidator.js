const yup = require('yup')
const prisma = require('../utils/prisma')

const groupValidator = (id) =>
  yup.object({
    group_name: yup
      .string()
      .required('Group name is required')
      .test('unique', 'Group name already exist', async (value) => {
        const findGroup = await prisma.groups.findUnique({
          where: {
            group_name: value,
          },
        })

        if (findGroup && !id) {
          return false
        }

        if (findGroup && id) {
          if (findGroup.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findGroup) {
          return true
        }
      }),
  })

module.exports = { groupValidator }
