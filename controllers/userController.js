const prisma = require('../utils/prisma')
const createError = require('../utils/errorHandler')
const asyncHandler = require('express-async-handler')

const users = asyncHandler(async (req, res, next) => {
  const users = await prisma.users.findMany()
  if (!users.length) throw new createError(404, 'No data found')
  res.json(users)
})

module.exports = { users }
