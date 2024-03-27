const yup = require('yup')
const prisma = require('../utils/prisma')

const heroSectionValidator = () =>
  yup.object({
    title: yup.string().required('Title is required'),
    description: yup.string().optional(),
    image: yup.string().optional(),
    btn_title: yup.string().optional(),
    btn_link: yup.string().url().optional(),
    btn_visibility: yup.bool().default(true),
  })

const heroBannerValidator = () =>
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

module.exports = { heroSectionValidator, heroBannerValidator }
