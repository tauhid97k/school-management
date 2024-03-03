const yup = require('yup')
const prisma = require('../utils/prisma')

const salaryValidator = (id) =>
  yup.object({
    amount: yup.number().integer().typeError('Salary amount must be in number'),
  })

module.exports = { salaryValidator }
