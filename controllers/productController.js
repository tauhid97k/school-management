const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  productValidator,
  productImageValidator,
} = require('../validators/productValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /products
  @access   private
  @desc     GET All Products
*/
const getProducts = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [products, total] = await prisma.$transaction([
    prisma.products.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.products.count(),
  ])

  res.json({
    data: products,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /products
  @access   private
  @desc     Create new product
*/
const createProduct = asyncHandler(async (req, res, next) => {
  const data = await productValidator().validate(req.body, {
    abortEarly: false,
  })

  if (req.files) {
    const { image } = await productImageValidator().validate(req.files, {
      abortEarly: false,
    })

    // Product Image
    const uniqueFolder = `product_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/products/${uniqueFolder}/${image.name}`
    const filePathToSave = `${uniqueFolder}/${image.name}`

    image.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error saving image',
        })
    })

    // Update file path (For saving to database)
    data.image = filePathToSave
  }

  await prisma.products.create({
    data,
  })

  res.json({
    message: 'Product added',
  })
})

/*
  @route    PUT: /products/:id
  @access   private
  @desc     Update product
*/
const updateProduct = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await productValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findProduct = await tx.products.findUnique({
      where: {
        id,
      },
    })

    if (!findProduct)
      return res.status(404).json({
        message: 'Product not found',
      })

    if (req.files) {
      const { image } = await productImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous image (If Exist)
      if (findProduct.image) {
        try {
          const photoDir = `uploads/products/${findProduct.image.split('/')[0]}`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous image',
          })
        }
      }

      // New Image
      const uniqueFolder = `product_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/products/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving image',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.products.update({
      where: {
        id: findProduct.id,
      },
      data,
    })

    res.json({
      message: 'Product updated',
    })
  })
})

/*
  @route    DELETE: /products/:id
  @access   private
  @desc     Delete Product
*/
const deleteProduct = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const findProduct = await tx.products.findUnique({
      where: {
        id,
      },
    })

    if (!findProduct)
      return res.status(404).json({
        message: 'Product not found',
      })

    // Delete Attachment (If Exist)
    if (findProduct.attachment) {
      try {
        const photoDir = `uploads/products/${
          findProduct.attachment.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

    await tx.products.delete({
      where: { id },
    })

    res.json({ message: 'Product deleted' })
  })
})

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}
