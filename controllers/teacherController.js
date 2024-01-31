const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const bcrypt = require('bcrypt')
const {
  teacherValidator,
  teacherProfileImageValidator,
  demoValidator,
} = require('../validators/teacherValidator')
const dayjs = require('dayjs')
const excludeFields = require('../utils/excludeFields')
const { formatDate } = require('../utils/transformData')
const { v4: uuid } = require('uuid')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /teachers
  @access   private
  @desc     Get all teachers
*/
const getTeachers = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [teachers, total] = await prisma.$transaction([
    prisma.teachers.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.teachers.count(),
  ])

  teachers.profile_img = generateFileLink(
    `teachers/profiles/${teachers.profile_img}`
  )

  const formatTeachers = teachers.map((teacher) => ({
    ...teacher,
    profile_img: generateFileLink(`teachers/profiles/${teacher.profile_img}`),
  }))

  res.json({
    data: formatTeachers,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /teachers/:id
  @access   private
  @desc     Get teacher details
*/

const getTeacher = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findTeacher = await prisma.teachers.findUnique({
    where: {
      id,
    },
  })

  if (!findTeacher)
    return res.status(404).json({
      message: 'No teacher found',
    })

  // Correct date format
  findTeacher.date_of_birth = formatDate(findTeacher.date_of_birth)
  findTeacher.joining_date = formatDate(findTeacher.joining_date)
  findTeacher.profile_img = generateFileLink(
    `teachers/profiles/${findTeacher.profile_img}`
  )

  // Exclude password field
  const formatTeacher = excludeFields(findTeacher, ['password'])

  res.json(formatTeacher)
})

/*
  @route    POST: /teachers
  @access   private
  @desc     Create a new teacher
*/
const createTeacher = asyncHandler(async (req, res, next) => {
  let data = await teacherValidator().validate(req.body, { abortEarly: false })

  if (req.files) {
    await teacherProfileImageValidator.validate(req.files, {
      abortEarly: false,
    })

    const { profile_img } = req.files
    const uniqueFilename = `${uuid()}_${profile_img.name}`

    // The path where the file is uploaded
    const uploadPath = `uploads/teachers/profiles/${uniqueFilename}`

    // Move the uploaded file to the correct folder
    profile_img.mv(uploadPath)

    data.profile_img = uniqueFilename
  }

  // Encrypt password
  data.password = await bcrypt.hash(data.password, 12)

  // Correct date format
  data.date_of_birth = dayjs(data.date_of_birth).toISOString()
  data.joining_date = dayjs(data.joining_date).toISOString()

  await prisma.teachers.create({
    data,
  })

  res.json({
    message: 'Teacher added',
  })
})

/*
  @route    PUT: /teachers/:id
  @access   private
  @desc     Update a teacher
*/
const updateTeacher = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await teacherValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher)
      return res.status(404).json({
        message: 'No teacher found',
      })

    // Encrypt password
    data.password = await bcrypt.hash(data.password, 12)

    // Correct date format
    data.date_of_birth = dayjs(data.date_of_birth).toISOString()
    data.joining_date = dayjs(data.joining_date).toISOString()

    await tx.teachers.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Teacher updated successfully' })
})

/*
  @route    DELETE: /teachers/:id
  @access   private
  @desc     delete a teachers
*/
const deleteTeacher = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher)
      return res.status(404).json({
        message: 'No teacher found',
      })

    await tx.teachers.delete({
      where: { id },
    })

    res.json({ message: 'Teacher data removed' })
  })
})

module.exports = {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
}
