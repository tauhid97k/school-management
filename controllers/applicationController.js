const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  teacherApplicationValidator,
  studentApplicationValidator,
  applicationResponseValidator,
} = require('../validators/applicationValidator')
const {
  selectQueries,
  applicationFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')
const { attachmentValidator } = require('../validators/attachmentValidator')
const { formatDate } = require('../utils/transformData')

/*
  @route    GET: /applications/teachers
  @access   private
  @desc     Get Teachers Applications
*/
const getTeachersApplicationsForAdmin = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, applicationFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [teachersApplications, total] = await prisma.$transaction([
    prisma.teacher_applications.findMany({
      take,
      skip,
      orderBy,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            designation: true,
          },
        },
      },
    }),
    prisma.teacher_applications.count(),
  ])

  const formatData = teachersApplications.map(
    ({ id, subject, teacher, date, created_at, updated_at }) => ({
      id,
      subject,
      date,
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      teacher_designation: teacher.designation,
      created_at,
      updated_at,
    })
  )

  res.json({
    data: formatData,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    PUT: /applications/teachers/application/:id/response
  @access   private
  @desc     Response to teacher Applications
*/
const responseToTeacherApplication = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const { response } = await applicationResponseValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.teacher_applications.findUnique({
      where: {
        id,
      },
    })

    if (!findApplication) {
      return res.json({
        message: 'Application not found',
      })
    }

    await tx.teacher_applications.update({
      where: {
        id: findApplication.id,
      },
      data: {
        comment: response,
      },
    })

    res.json({
      message: 'Response has been sent',
    })
  })
})

/*
  @route    GET: /applications/students
  @access   private
  @desc     Get Teachers Applications
*/
const getStudentsApplicationsForAdmin = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, applicationFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const { class_id } = selectQueries

  let whereClause = {}

  if (class_id) {
    whereClause = {
      student: {
        class_id: Number(class_id),
      },
    }
  }

  const [studentApplications, total] = await prisma.$transaction([
    prisma.student_applications.findMany({
      where: whereClause,
      take,
      skip,
      orderBy,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            profile_img: true,
            class: {
              select: {
                class_name: true,
              },
            },
            section: {
              select: {
                section_name: true,
              },
            },
          },
        },
      },
    }),
    prisma.student_applications.count({
      where: whereClause,
    }),
  ])

  const formatData = studentApplications.map(
    ({ id, subject, date, student, created_at, updated_at }) => ({
      id,
      subject,
      date,
      student_name: student.name,
      student_roll: student.roll,
      class_name: student.class.class_name,
      section_name: student.section.section_name,
      created_at,
      updated_at,
    })
  )

  res.json({
    data: formatData,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    PUT: /applications/students/application/:id/response
  @access   private
  @desc     Response to student Applications
*/
const responseToStudentApplication = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const { response } = await applicationResponseValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.student_applications.findUnique({
      where: {
        id,
      },
    })

    if (!findApplication) {
      return res.json({
        message: 'Application not found',
      })
    }

    await tx.student_applications.update({
      where: {
        id: findApplication.id,
      },
      data: {
        comment: response,
      },
    })

    res.json({
      message: 'Response has been sent',
    })
  })
})

/*
  @route    GET: /applications/teachers/:id
  @access   private
  @desc     Get Teacher Applications
*/
const getTeacherApplications = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, applicationFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher) {
      return res.json({
        message: 'Teacher not found',
      })
    }

    const teacherApplications = await tx.teacher_applications.findMany({
      where: {
        teacher_id: findTeacher.id,
      },
      take,
      skip,
      orderBy,
    })

    const total = await tx.teacher_applications.count({
      where: {
        teacher_id: findTeacher.id,
      },
    })

    const formatData = teacherApplications.map(
      ({ id, subject, date, comment, created_at, updated_at }) => ({
        id,
        subject,
        date,
        response: comment ? 'Yes' : 'Pending',
        created_at,
        updated_at,
      })
    )

    res.json({
      data: formatData,
      meta: {
        page,
        limit: take,
        total,
      },
    })
  })
})

/*
  @route    GET: /applications/teachers/application/:id
  @access   private
  @desc     Get Teacher Application details
*/
const getTeacherApplicationDetails = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.teacher_applications.findUnique({
      where: {
        id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            profile_img: true,
            designation: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    if (!findApplication) {
      return res.json({
        message: 'Application not found',
      })
    }

    const formatData = {
      id: findApplication.id,
      subject: findApplication.subject,
      description: findApplication.description,
      date: formatDate(findApplication.date),
      attachment: generateFileLink(
        `teachers/applications/${findApplication.attachment}`
      ),
      teacher_id: findApplication.teacher.id,
      teacher_name: findApplication.teacher.name,
      teacher_designation: findApplication.teacher.designation.title,
      profile_img: generateFileLink(
        `teachers/profiles/${findApplication.teacher.profile_img}`
      ),
      response: findApplication.comment ? findApplication.comment : 'Pending',
      created_at: findApplication.created_at,
      updated_at: findApplication.updated_at,
    }

    res.json(formatData)
  })
})

/*
  @route    POST: /applications/teachers
  @access   private
  @desc     Create Teacher Application
*/
const createTeacherApplication = asyncHandler(async (req, res, next) => {
  const data = await teacherApplicationValidator().validate(req.body, {
    abortEarly: false,
  })

  if (req.files) {
    const { attachment } = await attachmentValidator().validate(req.files, {
      abortEarly: false,
    })

    // Attachment
    const uniqueFolder = `teacher_application_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/teachers/applications/${uniqueFolder}/${attachment.name}`
    const filePathToSave = `${uniqueFolder}/${attachment.name}`

    attachment.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error saving notice attachment',
        })
    })

    // Update file path (For saving to database)
    data.attachment = filePathToSave
  }

  await prisma.teacher_applications.create({
    data,
  })

  res.json({
    message: 'Application has been sent to admin',
  })
})

/*
  @route    PUT: /applications/teachers/application/:id
  @access   private
  @desc     Update Teacher Application
*/
const updateTeacherApplication = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await teacherApplicationValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.teacher_applications.findUnique({
      where: {
        id,
      },
    })

    if (!findApplication)
      return res.status(404).json({
        message: 'Application not found',
      })

    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous attachment (If Exist)
      if (findApplication.attachment) {
        try {
          const photoDir = `uploads/teachers/applications/${
            findApplication.attachment.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous attachment',
          })
        }
      }

      // New Attachment
      const uniqueFolder = `teacher_application_${uuidV4()}_${
        new Date() * 1000
      }`
      const uploadPath = `uploads/teachers/applications/${uniqueFolder}/${attachment.name}`
      const filePathToSave = `${uniqueFolder}/${attachment.name}`

      attachment.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving attachment',
          })
      })

      // Update file path (For saving to database)
      data.attachment = filePathToSave
    }

    await tx.teacher_applications.update({
      where: { id },
      data,
    })

    res.json({ message: 'Application updated successfully' })
  })
})

/*
  @route    DELETE: /applications/teachers/application/:id
  @access   private
  @desc     Delete Teacher Application
*/
const deleteTeacherApplication = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.teacher_applications.findUnique({
      where: {
        id,
      },
    })

    if (!findApplication) {
      return res.json({
        message: 'Application not found',
      })
    }

    // Delete Attachment (If Exist)
    if (findApplication.attachment) {
      try {
        const photoDir = `uploads/teachers/applications/${
          findApplication.attachment.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

    await tx.teacher_applications.delete({
      where: { id },
    })

    res.json({ message: 'Application deleted' })
  })
})

/*
  @route    GET: /applications/students/:id
  @access   private
  @desc     Get Student Applications
*/
const getStudentApplications = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, applicationFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent) {
      return res.json({
        message: 'Student not found',
      })
    }

    const studentApplications = await tx.student_applications.findMany({
      where: {
        student_id: findStudent.id,
      },
      take,
      skip,
      orderBy,
    })

    const total = await tx.student_applications.count({
      where: {
        student_id: findStudent.id,
      },
    })

    const formatData = studentApplications.map(
      ({ id, subject, date, comment, created_at, updated_at }) => ({
        id,
        subject,
        date,
        response: comment ? 'Yes' : 'No',
        created_at,
        updated_at,
      })
    )

    res.json({
      data: formatData,
      meta: {
        page,
        limit: take,
        total,
      },
    })
  })
})

/*
  @route    GET: /applications/students/application/:id
  @access   private
  @desc     Get Student Application details
*/
const getStudentApplicationDetails = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.student_applications.findUnique({
      where: {
        id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            profile_img: true,
            class: {
              select: {
                class_name: true,
              },
            },
            section: {
              select: {
                section_name: true,
              },
            },
          },
        },
      },
    })

    if (!findApplication) {
      return res.json({
        message: 'Application not found',
      })
    }

    const formatData = {
      id: findApplication.id,
      subject: findApplication.subject,
      description: findApplication.description,
      date: formatDate(findApplication.date),
      attachment: generateFileLink(
        `students/applications/${findApplication.attachment}`
      ),
      student_id: findApplication.student.id,
      student_name: findApplication.student.name,
      student_class: findApplication.student.class.class_name,
      student_section: findApplication.student.section.section_name,
      profile_img: generateFileLink(
        `students/profiles/${findApplication.student.profile_img}`
      ),
      response: findApplication.comment ? findApplication.comment : 'PENDING',
      created_at: findApplication.created_at,
      updated_at: findApplication.updated_at,
    }

    res.json(formatData)
  })
})

/*
  @route    POST: /applications/students
  @access   private
  @desc     Create Student Application
*/
const createStudentApplication = asyncHandler(async (req, res, next) => {
  const data = await studentApplicationValidator().validate(req.body, {
    abortEarly: false,
  })

  if (req.files) {
    const { attachment } = await attachmentValidator().validate(req.files, {
      abortEarly: false,
    })

    // Notice Attachment
    const uniqueFolder = `student_application_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/students/applications/${uniqueFolder}/${attachment.name}`
    const filePathToSave = `${uniqueFolder}/${attachment.name}`

    attachment.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error saving notice attachment',
        })
    })

    // Update file path (For saving to database)
    data.attachment = filePathToSave
  }

  await prisma.student_applications.create({
    data,
  })

  res.json({
    message: 'Application has been sent to admin',
  })
})

/*
  @route    PUT: /applications/students/application/:id
  @access   private
  @desc     Update Student Application
*/
const updateStudentApplication = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await studentApplicationValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.student_applications.findUnique({
      where: {
        id,
      },
    })

    if (!findApplication)
      return res.status(404).json({
        message: 'Application not found',
      })

    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous attachment (If Exist)
      if (findApplication.attachment) {
        try {
          const photoDir = `uploads/students/applications/${
            findApplication.attachment.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous attachment',
          })
        }
      }

      // New Attachment
      const uniqueFolder = `student_application_${uuidV4()}_${
        new Date() * 1000
      }`
      const uploadPath = `uploads/students/applications/${uniqueFolder}/${attachment.name}`
      const filePathToSave = `${uniqueFolder}/${attachment.name}`

      attachment.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving attachment',
          })
      })

      // Update file path (For saving to database)
      data.attachment = filePathToSave
    }

    await tx.student_applications.update({
      where: { id },
      data,
    })

    res.json({ message: 'Application updated successfully' })
  })
})

/*
  @route    DELETE: /applications/student/application/:id
  @access   private
  @desc     Delete Teacher Application
*/
const deleteStudentApplication = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findApplication = await tx.student_applications.findUnique({
      where: {
        id,
      },
    })

    if (!findApplication) {
      return res.json({
        message: 'Application not found',
      })
    }

    // Delete Attachment (If Exist)
    if (findApplication.attachment) {
      try {
        const photoDir = `uploads/students/applications/${
          findApplication.attachment.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

    await tx.student_applications.delete({
      where: { id },
    })

    res.json({ message: 'Application deleted' })
  })
})

module.exports = {
  getTeachersApplicationsForAdmin,
  getStudentsApplicationsForAdmin,
  responseToTeacherApplication,
  responseToStudentApplication,
  getTeacherApplications,
  getTeacherApplicationDetails,
  createTeacherApplication,
  updateTeacherApplication,
  deleteTeacherApplication,
  getStudentApplications,
  getStudentApplicationDetails,
  createStudentApplication,
  updateStudentApplication,
  deleteStudentApplication,
}
