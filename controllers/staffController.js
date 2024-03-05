const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const bcrypt = require('bcrypt')
const {
  staffValidator,
  staffProfileImageValidator,
} = require('../validators/staffValidator')
const dayjs = require('dayjs')
const excludeFields = require('../utils/excludeFields')
const { formatDate } = require('../utils/transformData')
const { v4: uuidV4 } = require('uuid')
const generateFileLink = require('../utils/generateFileLink')
const fs = require('node:fs/promises')
const assignRole = require('../utils/assignRole')

/*
  @route    GET: /staffs
  @access   private
  @desc     Get all staffs
*/
const getStaffs = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [staffs, total] = await prisma.$transaction([
    prisma.staffs.findMany({
      take,
      skip,
      orderBy,
      include: {
        designation: true,
      },
    }),
    prisma.staffs.count(),
  ])

  const formatStaff = staffs.map((teacher) => ({
    ...teacher,
    profile_img: generateFileLink(`staffs/profiles/${teacher.profile_img}`),
  }))

  res.json({
    data: formatStaff,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /staffs/:id
  @access   private
  @desc     Get staff details
*/

const getStaff = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findStaff = await prisma.teachers.findUnique({
    where: {
      id,
    },
  })

  if (!findStaff)
    return res.status(404).json({
      message: 'No teacher found',
    })

  // Correct date format
  findStaff.date_of_birth = formatDate(findStaff.date_of_birth)
  findStaff.joining_date = formatDate(findStaff.joining_date)
  findStaff.profile_img = generateFileLink(
    `staffs/profiles/${findStaff.profile_img}`
  )

  // Exclude password field
  const formatStaff = excludeFields(findStaff, ['password'])

  res.json(formatStaff)
})

/*
  @route    POST: /staffs
  @access   private
  @desc     Create a new staffs
*/
const createStaff = asyncHandler(async (req, res, next) => {
  let data = await staffValidator().validate(req.body, { abortEarly: false })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { profile_img } = await staffProfileImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Profile Img
      const uniqueFolder = `staff_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/staffs/profiles/${uniqueFolder}/${profile_img.name}`
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

    const staff = await tx.staffs.create({
      data: {
        name: data.name,
        email: data.email,
        designation_id: data.designation_id,
        password: data.password,
        date_of_birth: data.date_of_birth,
        blood_group: data.blood_group,
        religion: data.religion,
        gender: data.gender,
        age: data.age,
        joining_date: data.joining_date,
        phone_number: data.phone_number,
        address: data.address,
        salary: data.salary,
        profile_img: data.profile_img,
        cover_letter: data.cover_letter,
        education: data.education,
        experience: data.experience,
      },
    })

    await assignRole(staff.id, data.role, tx)

    res.json({
      message: 'Staff added',
    })
  })
})

/*
  @route    PUT: /staffs/:id
  @access   private
  @desc     Update a staff
*/
const updateStaff = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await teacherValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findStaff = await tx.staffs.findUnique({
      where: {
        id,
      },
    })

    if (!findStaff)
      return res.status(404).json({
        message: 'No staff found',
      })

    if (req.files) {
      const { profile_img } = await staffProfileImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Delete Previous Profile Image (If Exist)
      if (findStaff.profile_img) {
        try {
          const photoDir = `uploads/staffs/profiles/${
            findStaff.profile_img.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous profile image',
          })
        }
      }

      // New Profile Img
      const uniqueFolder = `staff_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/staffs/profiles/${uniqueFolder}/${profile_img.name}`
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

    const staff = await tx.staffs.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        designation_id: data.designation_id,
        password: data.password,
        date_of_birth: data.date_of_birth,
        blood_group: data.blood_group,
        religion: data.religion,
        gender: data.gender,
        age: data.age,
        joining_date: data.joining_date,
        phone_number: data.phone_number,
        address: data.address,
        salary: data.salary,
        profile_img: data.profile_img,
        cover_letter: data.cover_letter,
        education: data.education,
        experience: data.experience,
      },
    })

    await assignRole(staff.id, data.role, tx)

    res.json({ message: 'Staff updated successfully' })
  })
})

/*
  @route    DELETE: /staffs/:id
  @access   private
  @desc     delete a staff
*/
const deleteStaff = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findStaff = await tx.staffs.findUnique({
      where: {
        id,
      },
    })

    if (!findStaff)
      return res.status(404).json({
        message: 'No staff found',
      })

    // Delete Profile Image
    if (findStaff.profile_img) {
      try {
        const photoDir = `uploads/staffs/profiles/${
          findStaff.profile_img.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting profile image',
        })
      }
    }

    await tx.staffs.delete({
      where: { id },
    })

    res.json({ message: 'Staff deleted' })
  })
})

module.exports = {
  getStaffs,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
}
