const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  expenseCategoryValidator,
} = require('../validators/expenseCategoryValidator')

/*
  @route    GET: /expense-categories
  @access   private
  @desc     All expense categories
*/
const getAllExpenseCategory = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [expenseCategories, total] = await prisma.$transaction([
    prisma.expense_categories.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.expense_categories.count(),
  ])

  res.json({
    data: expenseCategories,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /expense-categories
  @access   private
  @desc     Add a new expense category
*/
const createExpenseCategory = asyncHandler(async (req, res, next) => {
  const data = await expenseCategoryValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.expense_categories.create({ data })

  res.status(201).json({ message: 'Expense category added' })
})

/*
  @route    PUT: /expense-categories/:id
  @access   private
  @desc     Update an expense category
*/
const updateExpenseCategory = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await expenseCategoryValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findExpenseCategory = await tx.expense_categories.findUnique({
      where: {
        id,
      },
    })

    if (!findExpenseCategory)
      return res.status(404).json({
        message: 'No expense category found',
      })

    await tx.expense_categories.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Expense category updated' })
})

/*
  @route    DELETE: /expense-categories/:id
  @access   private
  @desc     delete an expense category
*/
const deleteExpenseCategory = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findExpenseCategory = await tx.expense_categories.findUnique({
      where: {
        id,
      },
    })

    if (!findExpenseCategory)
      return res.status(404).json({
        message: 'No expense category found',
      })

    await tx.expense_categories.delete({
      where: { id },
    })

    res.json({ message: 'Expense category deleted' })
  })
})

module.exports = {
  getAllExpenseCategory,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
}
