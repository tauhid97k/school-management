const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  expenseValidator,
  expenseAttachmentValidator,
} = require('../validators/expenseValidator')
const dayjs = require('dayjs')
const generateFileLink = require('../utils/generateFileLink')
const { v4: uuid } = require('uuid')

/*
  @route    GET: /expenses
  @access   private
  @desc     All expenses
*/
const getAllExpenses = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [expenses, total] = await prisma.$transaction([
    prisma.expenses.findMany({
      take,
      skip,
      orderBy,
      include: {
        expense_category: true,
      },
    }),
    prisma.expenses.count(),
  ])

  res.json({
    data: expenses,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /expenses/:id
  @access   private
  @desc     Get expense details
*/

const getExpense = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findExpense = await prisma.expenses.findUnique({
    where: {
      id,
    },
  })

  if (!findExpense)
    return res.status(404).json({
      message: 'No expense found',
    })

  // Correct date format & File link
  findExpense.date = formatDate(findExpense.date_of_birth)
  findExpense.attachment = generateFileLink(
    `expenses/${findExpense.attachment}`
  )

  res.json(findExpense)
})

/*
  @route    POST: /expenses
  @access   private
  @desc     Add a new expense 
*/
const createExpense = asyncHandler(async (req, res, next) => {
  const data = await expenseValidator().validate(req.body, {
    abortEarly: false,
  })

  if (req.files) {
    await expenseAttachmentValidator.validate(req.files, { abortEarly: false })

    const { attachment } = req.files
    const fileNameWithoutExt = attachment.name.split('.').shift()
    const uniqueFolderName = `${uuid()}_${fileNameWithoutExt}`

    // The path where the file is uploaded
    const uploadPath = `uploads/expenses/${uniqueFolderName}/${attachment.name}`
    const filePathToSave = `${uniqueFolderName}/${attachment.name}`

    // Move the uploaded file to the correct folder
    attachment.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error uploading attachment',
        })
    })

    data.attachment = filePathToSave
  }

  data.date = dayjs(data.date).toISOString()
  await prisma.expenses.create({ data })

  res.status(201).json({ message: 'Expense added' })
})

/*
  @route    PUT: /expenses/:id
  @access   private
  @desc     Update an expense
*/
const updateExpense = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await expenseValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findExpense = await tx.expenses.findUnique({
      where: {
        id,
      },
    })

    if (!findExpense)
      return res.status(404).json({
        message: 'No expense found',
      })

    if (req.files) {
      await expenseAttachmentValidator.validate(req.files, {
        abortEarly: false,
      })

      const { attachment } = req.files
      const fileNameWithoutExt = attachment.name.split('.').shift()
      const uniqueFolderName = `${uuid()}_${fileNameWithoutExt}`

      // The path where the file is uploaded
      const uploadPath = `uploads/expenses/${uniqueFolderName}/${attachment.name}`
      const filePathToSave = `${uniqueFolderName}/${attachment.name}`

      // Move the uploaded file to the correct folder
      attachment.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error uploading attachment',
          })
      })

      data.attachment = filePathToSave
    }

    await tx.expenses.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Expense updated' })
})

/*
  @route    DELETE: /expenses/:id
  @access   private
  @desc     delete an expense
*/
const deleteExpense = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findExpense = await tx.expenses.findUnique({
      where: {
        id,
      },
    })

    if (!findExpense)
      return res.status(404).json({
        message: 'No expense found',
      })

    await tx.expenses.delete({
      where: { id },
    })

    res.json({ message: 'Expense deleted' })
  })
})

module.exports = {
  getAllExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
}
