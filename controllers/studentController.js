const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  studentsFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  studentValidator,
  studentProfileImageValidator,
} = require('../validators/studentValidator')
const bcrypt = require('bcrypt')
const dayjs = require('dayjs')
const excludeFields = require('../utils/excludeFields')
const { formatDate } = require('../utils/transformData')
const { v4: uuidV4 } = require('uuid')
const generateFileLink = require('../utils/generateFileLink')
const fs = require('node:fs/promises')
const assignRole = require('../utils/assignRole')

/*
  @route    GET: /students/:id/subjects
  @access   private
  @desc     Get only assigned subjects for a student (Based on class)
*/
const getSubjectsForStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Get Subjects for this student (Based on class)
    const subjects = await tx.subject_classes.findMany({
      where: {
        class_id: findStudent.class_id,
      },
      include: {
        subject: true,
      },
    })

    // Format Data
    const formatData = subjects.map(
      ({ subject: { id, name, code, created_at, updated_at } }) => ({
        id,
        name,
        code,
        created_at,
        updated_at,
      })
    )

    res.json(formatData)
  })
})

/*
  @route    GET: /students
  @access   private
  @desc     Get all students
*/
const getStudents = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, studentsFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  let { class_id, roll } = selectedQueries

  const whereClause = {}

  if (class_id && roll) {
    whereClause = {
      AND: [{ class_id: Number(class_id) }, { roll }],
    }
  } else if (class_id) {
    whereClause.class_id = Number(class_id)
  } else if (roll) {
    whereClause.roll = roll
  }

  const [students, total] = await prisma.$transaction([
    prisma.students.findMany({
      where: whereClause,
      take,
      skip,
      orderBy,
    }),
    prisma.students.count({
      where: whereClause,
    }),
  ])

  const formatStudents = students.map((student) => ({
    ...student,
    profile_img: student.profile_img
      ? generateFileLink(`students/profiles/${student.profile_img}`)
      : null,
  }))

  res.json({
    data: formatStudents,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /students/:id
  @access   private
  @desc     Get student details
*/
const getStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findStudent = await prisma.students.findUnique({
    where: {
      id,
    },
    include: {
      class: true,
      group: true,
    },
  })

  if (!findStudent)
    return res.status(404).json({
      message: 'No student found',
    })

  // Correct date & image format
  findStudent.date_of_birth = formatDate(findStudent.date_of_birth)
  findStudent.admission_date = formatDate(findStudent.admission_date)
  findStudent.profile_img = findStudent.profile_img
    ? generateFileLink(`students/profiles/${findStudent.profile_img}`)
    : null

  // Exclude password field
  const dataWithExcludeFields = excludeFields(findStudent, ['password'])

  // Format Data
  const formatStudent = {
    ...dataWithExcludeFields,
    class_name: findStudent.class.class_name,
    group_name: findStudent.group.group_name,
  }

  // Remove the original "class" property
  delete formatStudent.class

  res.json(formatStudent)
})

/*
  @route    POST: /students
  @access   private
  @desc     Create a new student
*/
const createStudent = asyncHandler(async (req, res, next) => {
  let data = await studentValidator().validate(req.body, { abortEarly: false })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { profile_img } = await studentProfileImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Profile Img
      const uniqueFolder = `student_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/students/profiles/${uniqueFolder}/${profile_img.name}`
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
    data.admission_date = dayjs(data.admission_date).toISOString()

    const student = await tx.students.create({
      data,
    })

    await assignRole(student.id, 'student', tx)

    res.json({
      message: 'Student added',
    })
  })
})

/*
  @route    PUT: /students/:id
  @access   private
  @desc     Update a student
*/
const updateStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await studentValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent)
      return res.status(404).json({
        message: 'No student found',
      })

    if (req.files) {
      const { profile_img } = await studentProfileImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Delete Previous Profile Image (If Exist)
      if (findStudent.profile_img) {
        try {
          const photoDir = `uploads/students/profiles/${
            findStudent.profile_img.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous profile image',
          })
        }
      }

      // New Profile Img
      const uniqueFolder = `student_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/students/profiles/${uniqueFolder}/${profile_img.name}`
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
    data.admission_date = dayjs(data.admission_date).toISOString()

    await tx.students.update({
      where: { id },
      data,
    })

    res.json({ message: 'Student updated successfully' })
  })
})

/*
  @route    DELETE: /students/:id
  @access   private
  @desc     delete a student
*/
const deleteStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent)
      return res.status(404).json({
        message: 'No student found',
      })

    // Delete Profile Image
    if (findStudent.profile_img) {
      try {
        const photoDir = `uploads/students/profiles/${
          findStudent.profile_img.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting profile image',
        })
      }
    }

    await tx.students.delete({
      where: { id },
    })

    res.json({ message: 'Student deleted' })
  })
})

module.exports = {
  getSubjectsForStudent,
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
}
