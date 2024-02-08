const yup = require('yup')
const prisma = require('../utils/prisma')

const designationValidator = (id) =>
  yup.object({
    title: yup
      .string()
      .required('Designation title is required')
      .test('unique', 'This designation already exist', async (value) => {
        const findDesignation = await prisma.designations.findUnique({
          where: {
            title: value,
          },
        })

        if (findDesignation && !id) {
          return false
        }

        if (findDesignation && id) {
          if (findDesignation.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findDesignation) {
          return true
        }
      }),
  })

module.exports = { designationValidator }
