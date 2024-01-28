const { PrismaClient } = require('@prisma/client')

module.exports = new PrismaClient({
  log: ['error', 'warn'],
})
