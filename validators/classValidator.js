const yup = require('yup')
const prisma = require('../utils/prisma')

const classValidator = yup.object({
  class_name: yup
    .string()
    .required('Class name is required')
    .test('exist', 'Class name already exist', async (value) => {
      const findClass = await prisma.classes.findUnique({
        where: {
          class_name: value,
        },
      })

      if (findClass) return false
      else return true
    }),
})

module.exports = { classValidator }
