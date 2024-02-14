const yup = require('yup')

const photoGalleryValidator = yup.object({
  photo: yup.string().optional(),
  description: yup.string().optional(),
})

const photoGalleryPhotoValidator = yup
  .object({
    photo: yup
      .mixed()
      .test(
        'type',
        'Invalid file type. Only JPG, JPEG, and PNG are allowed',
        (file) => {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
          return allowedTypes.includes(file.mimetype)
        }
      )
      .test('size', 'File size is too large; max 2mb is allowed', (file) => {
        const maxSize = 2 * 1024 * 1024
        return file.size <= maxSize
      }),
  })
  .required('Photo is required')

module.exports = { photoGalleryValidator, photoGalleryPhotoValidator }
