const yup = require('yup')
const prisma = require('../utils/prisma')

const chairmanSectionValidator = () =>
  yup.object({
    message_title: yup.string().required('Message title is required'),
    description: yup.string().optional(),
    image: yup.string().optional(),
  })

const chairmanSectionImageValidator = () =>
  yup.object({
    image: yup
      .mixed()
      .test(
        'type',
        'Invalid file type. Only JPG, JPEG, and PNG are allowed',
        (file) => {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
          return allowedTypes.includes(file.mimetype)
        }
      )
      .test('size', 'File size is too large; max 5mb is allowed', (file) => {
        const maxSize = 5 * 1024 * 1024
        return file.size <= maxSize
      }),
  })

module.exports = {
  chairmanSectionValidator,
  chairmanSectionImageValidator,
}
