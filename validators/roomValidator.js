const yup = require('yup')
const prisma = require('../utils/prisma')

const roomValidator = (id) =>
  yup.object({
    room_number: yup
      .string()
      .required('Room number is required')
      .test('unique', 'This room is already listed', async (value) => {
        const findRoom = await prisma.rooms.findUnique({
          where: {
            room_number: value,
          },
        })

        if (findRoom && !id) {
          return false
        }

        if (findRoom && id) {
          if (findRoom.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findRoom) {
          return true
        }
      }),
  })

module.exports = { roomValidator }
