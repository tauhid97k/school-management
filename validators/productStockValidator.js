const yup = require('yup')
const prisma = require('../utils/prisma')

const productStockValidator = () =>
  yup.object({
    product_id: yup
      .number()
      .typeError('Product id must be a number')
      .required('Product is required')
      .test('exists', 'Product id does not exist', async (value) => {
        const findProduct = await prisma.products.findUnique({
          where: {
            id: value,
          },
        })

        return findProduct ? true : false
      }),
    buying_price: yup.number().integer().optional(),
    selling_price: yup.number().integer().optional(),
    quantity: yup.number().integer().optional(),
    note: yup.string().optional(),
  })

module.exports = { productStockValidator }
