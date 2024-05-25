const yup = require('yup')
const prisma = require('../utils/prisma')

const classValidator = (id) =>
  yup.object({
    class_name: yup
      .string()
      .required('Class name is required')
      .test('exist', 'Class name already exist', async (value) => {
        const findClass = await prisma.classes.findUnique({
          where: {
            class_name: value,
          },
        })

        if (findClass && !id) {
          return false
        }

        if (findClass && id) {
          if (findClass.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findClass) {
          return true
        }
      }),
  })

module.exports = { classValidator }
