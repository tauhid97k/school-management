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
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')
const { formatDate } = require('../utils/transformData')
const { attachmentValidator } = require('../validators/attachmentValidator')

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

  // Format Data
  const formatData = expenses.map(
    ({
      id,
      expense_category: { category_name },
      title,
      description,
      amount,
      invoice_no,
      date,
      attachment,
      created_at,
      updated_at,
    }) => ({
      id,
      category_name,
      title,
      description,
      amount,
      invoice_no,
      date,
      attachment: attachment
        ? generateFileLink(`expenses/${attachment}`)
        : null,
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
  findExpense.date = formatDate(findExpense.date)
  findExpense.attachment = findExpense.attachment
    ? generateFileLink(`expenses/${findExpense.attachment}`)
    : null

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
    const { attachment } = await attachmentValidator().validate(req.files, {
      abortEarly: false,
    })

    // Notice Attachment
    const uniqueFolder = `expense_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/expenses/${uniqueFolder}/${attachment.name}`
    const filePathToSave = `${uniqueFolder}/${attachment.name}`

    attachment.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error saving notice attachment',
        })
    })

    // Update file path (For saving to database)
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
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous attachment (If Exist)
      if (findExpense.attachment) {
        try {
          const photoDir = `uploads/expenses/${
            findExpense.attachment.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous attachment',
          })
        }
      }

      // New Attachment
      const uniqueFolder = `expense_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/expenses/${uniqueFolder}/${attachment.name}`
      const filePathToSave = `${uniqueFolder}/${attachment.name}`

      attachment.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving attachment',
          })
      })

      // Update file path (For saving to database)
      data.attachment = filePathToSave
    }

    await tx.expenses.update({
      where: { id },
      data,
    })

    res.json({ message: 'Expense updated' })
  })
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

    // Delete Attachment (If Exist)
    if (findExpense.attachment) {
      try {
        const photoDir = `uploads/expenses/${
          findExpense.attachment.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

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
