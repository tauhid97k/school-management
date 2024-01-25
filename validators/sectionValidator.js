const yup = require('yup')
const prisma = require('../utils/prisma')

const sectionValidator = yup.object({
  section_name: yup
    .string()
    .required('Section name is required')
    .test(
      'assigned',
      'This section already assigned for this class',
      async (value, ctx) => {
        const class_id = ctx.parent.class_id
        const findSection = await prisma.sections.findFirst({
          where: {
            AND: [{ class_id }, { section_name: value }],
          },
        })

        if (findSection) return false
        else return true
      }
    ),
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
    })
    .test(
      'assigned',
      'Room is already assigned to another section',
      async (value) => {
        const findSection = await prisma.sections.findFirst({
          where: {
            room_id: value,
          },
        })

        if (findSection) return false
        else return true
      }
    ),
})

module.exports = { sectionValidator }
