const yup = require('yup')
const prisma = require('../utils/prisma')

const roomValidator = yup.object({
  room_number: yup
    .number()
    .typeError('Room number must be number')
    .required('Room number is required')
    .test('unique', 'This room is already listed', async (value) => {
      const findRoom = await prisma.rooms.findUnique({
        where: {
          room_number: value,
        },
      })

      if (findRoom) return false
      else return true
    }),
})

module.exports = { roomValidator }
