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
} = require('../validators/teacherValidator')
const dayjs = require('dayjs')
const excludeFields = require('../utils/excludeFields')
const { formatDate } = require('../utils/transformData')
const { v4: uuidV4 } = require('uuid')
const generateFileLink = require('../utils/generateFileLink')
const fs = require('node:fs/promises')

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
      include: {
        designation: true,
      },
    }),
    prisma.teachers.count(),
  ])

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
    const { profile_img } = await teacherProfileImageValidator().validate(
      req.files,
      {
        abortEarly: false,
      }
    )

    // Profile Img
    const uniqueFolder = `teacher_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/teachers/profiles/${uniqueFolder}/${profile_img.name}`
    const filePathToSave = `${uniqueFolder}/${profile_img.name}`

    profile_img.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error saving Profile image',
        })
    })

    // Update file path (For saving to database)
    data.profile_img = filePathToSave
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

    if (req.files) {
      const { profile_img } = await teacherProfileImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Delete Previous Profile Image (If Exist)
      if (findTeacher.profile_img) {
        try {
          const photoDir = `uploads/teachers/profiles/${
            findTeacher.profile_img.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous profile image',
          })
        }
      }

      // New Profile Img
      const uniqueFolder = `teacher_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/teachers/profiles/${uniqueFolder}/${profile_img.name}`
      const filePathToSave = `${uniqueFolder}/${profile_img.name}`

      profile_img.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving Profile image',
          })
      })

      // Update file path (For saving to database)
      data.profile_img = filePathToSave
    }

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

    // Delete Profile Image
    if (findTeacher.profile_img) {
      try {
        const photoDir = `uploads/teachers/profiles/${
          findTeacher.profile_img.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting profile image',
        })
      }
    }

    await tx.teachers.delete({
      where: { id },
    })

    res.json({ message: 'Teacher deleted' })
  })
})

module.exports = {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
}
