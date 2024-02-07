const yup = require('yup')

const photoGalleryValidator = yup.object({
  photo: yup
    .mixed()
    .test(
      'type',
      'Invalid file type. Only JPG, JPEG, and PNG are allowed',
      (file) => {
        if (!file) {
          throw new yup.ValidationError('Photo is required', file, 'photo')
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(file.mimetype)) return false
        else return true
      }
    )
    .test('size', 'File size is too large; max 2mb is allowed', (file) => {
      if (!file) {
        throw new yup.ValidationError('Photo is required', file, 'photo')
      }

      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) return false
      return true
    }),
})

module.exports = { photoGalleryValidator }
