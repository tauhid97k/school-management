const yup = require('yup')
const prisma = require('../utils/prisma')

const groupValidator = yup.object({
  group_name: yup
    .string()
    .required('Group name is required')
    .test('unique', 'Group name already exist', async (value) => {
      const findGroup = await prisma.groups.findUnique({
        where: {
          group_name: value,
        },
      })

      if (findGroup) return false
      else return true
    }),
})

module.exports = { groupValidator }
