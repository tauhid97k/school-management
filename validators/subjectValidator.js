const yup = require('yup')
const prisma = require('../utils/prisma')

const subjectValidator = yup.object({
  name: yup
    .string()
    .required('Subject name is required')
    .test('unique', 'Subject already exist', async (value) => {
      const subject = await prisma.subjects.findUnique({
        where: {
          name: value,
        },
      })

      if (subject) return false
      else return true
    }),
  code: yup
    .string()
    .required('Subject code is required')
    .test(
      'unique',
      'This code already assigned to another subject',
      async (value) => {
        const subject = await prisma.subjects.findUnique({
          where: {
            code: value,
          },
        })

        if (subject) return false
        else return true
      }
    ),
})

module.exports = { subjectValidator }
