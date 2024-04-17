const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  paymentMethodValidator,
  paymentMethodImageValidator,
} = require('../validators/paymentMethodValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /payment-methods
  @access   private
  @desc     Get all payment methods
*/
const getPaymentMethods = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [paymentMethods, total] = await prisma.$transaction([
    prisma.payment_methods.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.payment_methods.count(),
  ])

  const formatData = paymentMethods.map(
    ({ id, name, image, status, created_at, updated_at }) => ({
      id,
      name,
      status,
      image: image ? generateFileLink(`payments/methods/${image}`) : null,
      created_at,
      updated_at,
    })
  )

  res.json({
    data: formatData,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /payment-methods
  @access   private
  @desc     Add new payment method
*/
const createPaymentMethod = asyncHandler(async (req, res, next) => {
  const data = await paymentMethodValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { image } = await paymentMethodImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Payment Method Img (Icon)
      const uniqueFolder = `payment_method_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/payments/methods/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving Image',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.payment_methods.create({
      data,
    })

    res.json({
      message: 'Payment method added',
    })
  })
})

/*
  @route    PUT: /payment-methods
  @access   private
  @desc     Update a payment method
*/
const updatePaymentMethod = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await paymentMethodValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const paymentMethod = await tx.payment_methods.findUnique({
      where: {
        id,
      },
    })

    if (!paymentMethod)
      return res.status(404).json({
        message: 'Payment method not found',
      })

    if (req.files) {
      const { image } = await paymentMethodImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Delete Previous Image (If Exist)
      if (paymentMethod.image) {
        try {
          const photoDir = `uploads/payments/methods/${
            paymentMethod.image.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous image',
          })
        }
      }

      // New Image
      const uniqueFolder = `payment_method_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/payments/methods/${uniqueFolder}/${image.name}`
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

    await tx.payment_methods.update({
      where: { id: paymentMethod.id },
      data,
    })

    res.json({
      message: 'Payment method updated',
    })
  })
})

/*
  @route    DELETE: /payment-methods
  @access   private
  @desc     Delete a payment-method
*/
const deletePaymentMethod = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const paymentMethod = await tx.payment_methods.findUnique({
      where: {
        id,
      },
    })

    if (!paymentMethod)
      return res.status(404).json({
        message: 'Payment method not found',
      })

    // Delete Image (If Exist)
    if (paymentMethod.image) {
      try {
        const photoDir = `uploads/payments/methods/${
          paymentMethod.image.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting image',
        })
      }
    }

    await tx.payment_methods.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Payment method deleted',
    })
  })
})

module.exports = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
}
