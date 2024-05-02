const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  productCategoryValidator,
} = require('../validators/productCategoryValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /product-categories
  @access   private
  @desc     GET All Product Categories
*/
const getProductCategories = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [categories, total] = await prisma.$transaction([
    prisma.categories.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.categories.count(),
  ])

  res.json({
    data: categories,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /product-categories
  @access   private
  @desc     Create new product category
*/
const createProductCategory = asyncHandler(async (req, res, next) => {
  const data = await productCategoryValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.product_categories.create({
    data,
  })

  res.json({
    message: 'Product category added',
  })
})

/*
  @route    PUT: /product-categories/:id
  @access   private
  @desc     Update product category
*/
const updateProductCategory = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await productCategoryValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findCategory = await tx.product_categories.findUnique({
      where: {
        id,
      },
    })

    if (!findCategory)
      return res.status(404).json({
        message: 'Category not found',
      })

    await tx.product_categories.update({
      where: {
        id: findCategory.id,
      },
      data,
    })

    res.json({
      message: 'Category updated',
    })
  })
})

/*
  @route    DELETE: /product-categories/:id
  @access   private
  @desc     Delete Product Categories
*/
const deleteProductCategory = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const categoryToDelete = await prisma.product_categories.delete({
    where: {
      id,
    },
  })

  if (!categoryToDelete)
    return res.status(404).json({
      message: 'Category not found',
    })

  res.json({
    message: 'Category deleted',
  })
})

module.exports = {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
}
