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
  section_name: yup.string().required('Section name is required'),
  room_number: yup
    .number()
    .typeError('Room number must be number')
    .required('Room number is required')
    .test(
      'reserved',
      'Room is already reserved by another class',
      async (value) => {
        const findRoom = await prisma.classes.findUnique({
          where: {
            room_number: value,
          },
        })

        if (findRoom) return false
        else return true
      }
    ),
})

module.exports = { classValidator }
