const yup = require('yup')

const photoGalleryValidator = yup
  .object({
    photo: yup
      .mixed()
      .required('Photo is required')
      .test(
        'type',
        'Invalid file type. Only JPG, JPEG, and PNG are allowed',
        (file) => {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
          if (!allowedTypes.includes(file.mimetype)) return false
          else return true
        }
      )
      .test('size', 'File size is too large; max 2mb is allowed', (file) => {
        const maxSize = 2 * 1024 * 1024
        if (file.size > maxSize) return false
        return true
      }),
  })
  .required('Photo is required')

module.exports = { photoGalleryValidator }
