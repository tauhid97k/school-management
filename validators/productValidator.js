const yup = require('yup')
const prisma = require('../utils/prisma')

const productValidator = () =>
  yup.object({
    name: yup.string().required('Product name is required'),
    product_category_id: yup
      .number()
      .typeError('Category id must be a number')
      .required('Product category is required')
      .test('exists', 'Product category does not exist', async (value) => {
        const findCategory = await prisma.product_categories.findUnique({
          where: {
            id: value,
          },
        })

        if (findCategory) return true
        else return false
      }),
    description: yup.string().optional(),
    image: yup.string().optional(),
  })

const productImageValidator = () =>
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

module.exports = { productValidator, productImageValidator }
