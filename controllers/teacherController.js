const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  paginateFields,
  paginateWithSorting,
} = require('../utils/transformData')
const bcrypt = require('bcrypt')
const { teacherValidator } = require('../validators/teacherValidator')

/*
  @route    GET: /teachers
  @access   private
  @desc     Get all teachers
*/
const getTeachers = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, paginateFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [teachers, total] = await prisma.$transaction([
    prisma.teachers.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.teachers.count(),
  ])

  res.json({
    data: teachers,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /teachers
  @access   private
  @desc     Create a new teacher
*/
const createTeacher = asyncHandler(async (req, res, next) => {
  let data = await teacherValidator.validate(req.body, { abortEarly: false })

  // Encrypt password
  data.password = await bcrypt.hash(data.password, 12)
  // Correct date format
  data.date_of_birth = new Date(data.date_of_birth).toISOString()

  // Blood type rarity match
  const blood_rarity = ['Common', 'Rare', 'Very rare']
  const blood_types = [
    'O_POSITIVE',
    'O_NEGATIVE',
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
  ]

  const blood_info = blood_types.map((type) => {
    let rarity

    if (type.includes('O_POSITIVE')) {
      rarity = blood_rarity[0] // Common for O+- blood types
    } else if (type.includes('AB')) {
      rarity = blood_rarity[2] // Very rare for AB blood types
    } else {
      rarity = blood_rarity[1] // Rare for other blood types
    }

    return {
      blood_type: type,
      rarity,
    }
  })
  const blood_matching_info = blood_info.filter((type) =>
    type.blood_type.includes(data.blood_group.blood_type)
  )

  // Update form data
  data = { ...data, ...{ blood_group: blood_matching_info } }

  await prisma.teachers.create({
    data,
  })

  res.json({
    message: 'Teacher added',
  })
})

module.exports = { getTeachers, createTeacher }
