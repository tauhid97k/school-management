const yup = require('yup')
const prisma = require('../utils/prisma')

const productCategoryValidator = () =>
  yup.object({
    name: yup
      .string()
      .required('Category name is required')
      .test('unique', 'This category already exist', async (value) => {
        const findCategory = await prisma.product_categories.findUnique({
          where: {
            name: value,
          },
        })

        return findCategory ? false : true
      }),
    description: yup.string().optional(),
  })

module.exports = { productCategoryValidator }
