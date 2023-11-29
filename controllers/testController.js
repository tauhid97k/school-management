const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')

const getTest = asyncHandler(async (req, res, next) => {})
const createTest = asyncHandler(async (req, res, next) => {})
const updateTest = asyncHandler(async (req, res, next) => {})
const deleteTest = asyncHandler(async (req, res, next) => {})

module.exports = { getTest, createTest, updateTest, deleteTest }
