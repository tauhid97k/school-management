const yup = require('yup')
const prisma = require('../utils/prisma')

const sectionValidator = (id) =>
  yup.object({
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

          if (findSection && !id) {
            return false
          }

          if (findSection && id) {
            if (findSection.id === id) {
              return true
            } else {
              return false
            }
          }

          if (!findSection) {
            return true
          }
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
      .transform((originalValue) => {
        return originalValue || undefined
      })
      .optional()
      .test('exists', 'Room id does not exist', async (value) => {
        if (!value) return true

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
          if (!value) return true

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
