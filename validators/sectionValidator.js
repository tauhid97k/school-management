const yup = require('yup')
const prisma = require('../utils/prisma')

const sectionValidator = yup.object({
  section_name: yup
    .string()
    .required('Section name is required')
    .test('unique', 'Section already exist', async (value) => {
      const sectionName = await prisma.sections.findUnique({
        where: {
          section_name: value,
        },
      })

      if (sectionName) return false
      else return true
    }),
  class_id: yup
    .number()
    .typeError('Class id must be number')
    .required('Class id is required')
    .test('exists', 'Class id does not exist', async (value) => {
      const findClass = await prisma.classes.findUnique({
        where: {
          id: value,
        },
      })

      if (findClass) return true
      else return false
    }),
  room_id: yup
    .number()
    .typeError('Room id must be number')
    .required('Room id is required')
    .test('exists', 'Room id does not exist', async (value) => {
      const room = await prisma.rooms.findUnique({
        where: {
          id: value,
        },
      })

      if (room) return true
      else return false
    }),
})

module.exports = { sectionValidator }
