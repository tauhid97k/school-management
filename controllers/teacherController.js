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
const assignRole = require('../utils/assignRole')

/*
  @route    GET: /teachers/:id/classes
  @access   private
  @desc     Get only assigned classes for a teacher
*/
const getClassesForTeacher = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher) {
      return res.status(404).json({ message: 'No teacher found' })
    }

    // Get Classes for this teacher
    const classes = await tx.classes.findMany({
      where: {
        teacher_classes: {
          some: {
            teacher_id: findTeacher.id,
          },
        },
      },
    })

    res.json(classes)
  })
})

/*
  @route    GET: /teachers/:id/subjects
  @access   private
  @desc     Get only assigned subjects for a teacher
*/
const getSubjectsForTeacher = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher) {
      return res.status(404).json({ message: 'No teacher found' })
    }

    // Get Subjects for this teacher
    const subjects = await tx.subjects.findMany({
      where: {
        teacher_subjects: {
          some: {
            teacher_id: findTeacher.id,
          },
        },
      },
    })

    res.json(subjects)
  })
})

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
    profile_img: teacher.profile_img
      ? generateFileLink(`teachers/profiles/${teacher.profile_img}`)
      : null,
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
    include: {
      designation: {
        select: {
          id: true,
          title: true,
        },
      },
      teacher_classes: {
        select: {
          class: {
            select: {
              id: true,
              class_name: true,
            },
          },
        },
      },
      teacher_sections: {
        select: {
          section: {
            select: {
              id: true,
              section_name: true,
            },
          },
        },
      },
      teacher_subjects: {
        select: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  })

  if (!findTeacher)
    return res.status(404).json({
      message: 'No teacher found',
    })

  // Format Data
  const {
    id: teacherId,
    name,
    email,
    email_verified_at,
    designation,
    date_of_birth,
    blood_group,
    religion,
    gender,
    age,
    joining_date,
    phone_number,
    address,
    salary,
    profile_img,
    cover_letter,
    education,
    experience,
    is_suspended,
    teacher_classes,
    teacher_sections,
    teacher_subjects,
    created_at,
    updated_at,
  } = findTeacher
  const formatData = {
    id: teacherId,
    name,
    email,
    email_verified_at,
    designation_id: designation.id,
    designation: designation.title,
    date_of_birth: formatDate(date_of_birth),
    blood_group,
    religion,
    gender,
    age,
    joining_date: formatDate(joining_date),
    phone_number,
    address,
    salary,
    profile_img: profile_img
      ? generateFileLink(`teachers/profiles/${profile_img}`)
      : null,
    cover_letter,
    education,
    experience,
    classes: teacher_classes.map(({ class: teacherClass }) => ({
      id: teacherClass.id,
      class_name: teacherClass.class_name,
    })),
    sections: teacher_sections.map(({ section }) => ({
      id: section.id,
      section_name: section.section_name,
    })),
    subjects: teacher_subjects.map(({ subject }) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
    })),
    is_suspended,
    created_at,
    updated_at,
  }

  res.json(formatData)
})

/*
  @route    POST: /teachers
  @access   private
  @desc     Create a new teacher
*/
const createTeacher = asyncHandler(async (req, res, next) => {
  let data = await teacherValidator().validate(req.body, { abortEarly: false })

  // Format Classes, Sections (If exist) & Subjects for database
  const formatClasses = data.classes.map((class_id) => ({ class_id }))
  const formatSections = data.sections.map((section_id) => ({ section_id }))
  const formatSubjects = data.subjects.map((subject_id) => ({ subject_id }))

  await prisma.$transaction(async (tx) => {
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

    const teacher = await tx.teachers.create({
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
        teacher_classes: {
          createMany: {
            data: formatClasses,
          },
        },
        ...(formatSections.length > 0 && {
          teacher_sections: {
            createMany: {
              data: formatSections,
            },
          },
        }),
        teacher_subjects: {
          createMany: {
            data: formatSubjects,
          },
        },
      },
    })

    await assignRole(teacher.id, 'teacher', tx)

    res.json({
      message: 'Teacher added',
    })
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

  // Format Classes, Sections (If exist) & Subjects for database
  const formatClasses = data.classes.map((class_id) => ({ class_id }))
  const formatSections = data.sections.map((section_id) => ({ section_id }))
  const formatSubjects = data.subjects.map((subject_id) => ({ subject_id }))

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

    // Delete Previous records (Classes)
    await tx.teacher_classes.deleteMany({
      where: {
        teacher_id: findTeacher.id,
      },
    })

    // Delete Previous records (Sections)
    await tx.teacher_sections.deleteMany({
      where: {
        teacher_id: findTeacher.id,
      },
    })

    // Delete Previous records (Subjects)
    await tx.teacher_subjects.deleteMany({
      where: {
        teacher_id: findTeacher.id,
      },
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

    const teacher = await tx.teachers.update({
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
        teacher_classes: {
          createMany: {
            data: formatClasses,
          },
        },
        ...(formatSections.length > 0 && {
          teacher_sections: {
            createMany: {
              data: formatSections,
            },
          },
        }),
        teacher_subjects: {
          createMany: {
            data: formatSubjects,
          },
        },
      },
    })

    await assignRole(teacher.id, 'teacher', tx)

    res.json({ message: 'Teacher updated successfully' })
  })
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
  getClassesForTeacher,
  getSubjectsForTeacher,
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
}
