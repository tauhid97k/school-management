const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  teacherNoticeFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')
const { attachmentValidator } = require('../validators/attachmentValidator')
const {
  teacherNoticeValidator,
} = require('../validators/teacherNoticeValidator')

/*
  @route    GET: /teacher-notices/student/:id
  @access   private
  @desc     GET Notice for student
*/
const getTeacherNoticeForStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const selectedQueries = selectQueries(req.query, teacherNoticeFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const findStudent = await prisma.students.findUnique({
    where: {
      id,
    },
  })

  if (!findStudent) {
    return res.status(404).json({ message: 'Student not found' })
  }

  let whereCondition = {}

  if (findStudent.class_id && !findStudent.section_id) {
    whereCondition = {
      AND: [{ class_id: findStudent.class_id }, { status: 'PUBLISHED' }],
    }
  } else if (findStudent.section_id) {
    whereCondition = {
      AND: [{ section_id: findStudent.section_id }, { status: 'PUBLISHED' }],
    }
  }

  // Get Notices
  const [notices, total] = await prisma.$transaction([
    prisma.teacher_notices.findMany({
      where: whereCondition,
      include: {
        teacher: {
          select: {
            name: true,
            designation: {
              select: {
                title: true,
              },
            },
            profile_img: true,
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.teacher_notices.count({
      where: whereCondition,
    }),
  ])

  // Format Data
  const formatData = notices.map(
    ({
      id,
      title,
      status,
      description,
      attachment,
      teacher,
      created_at,
      updated_at,
    }) => ({
      id,
      title,
      status,
      description,
      attachment: attachment
        ? generateFileLink(`teachers/notices/${attachment}`)
        : null,
      teacher_name: teacher.name,
      teacher_designation: teacher.designation.title,
      teacher_profile_img: teacher.profile_img
        ? generateFileLink(`teachers/profiles/${teacher.profile_img}`)
        : null,
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
  @route    GET: /teacher-notices/teacher/:teacherId
  @access   private
  @desc     GET All Notices
*/
const getAllTeacherNotices = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, teacherNoticeFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)
  const { status } = selectedQueries
  status ? status : null

  const teacherId = Number(req.params.teacherId)

  const findTeacher = await prisma.teachers.findUnique({
    where: {
      id: teacherId,
    },
  })

  if (!findTeacher) {
    return res.status(404).json({
      message: 'Teacher not found',
    })
  }

  const [notices, total] = await prisma.$transaction([
    prisma.teacher_notices.findMany({
      where: {
        teacher_id: teacherId,
        ...(status && { status }),
      },
      select: {
        id: true,
        title: true,
        status: true,
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
      take,
      skip,
      orderBy,
    }),
    prisma.teacher_notices.count({
      where: {
        teacher_id: teacherId,
        ...(status && { status }),
      },
    }),
  ])

  const formatNotices = notices.map(
    ({ id, title, status, section, class: { class_name } }) => ({
      id,
      title,
      status,
      class_name,
      section_name: section ? section.section_name : null,
    })
  )

  res.json({
    data: formatNotices,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /teacher-notices/:id
  @access   private
  @desc     GET Notice details
*/
const getTeacherNotice = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findNotice = await prisma.teacher_notices.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      status: true,
      description: true,
      attachment: true,
      class: {
        select: {
          id: true,
          class_name: true,
        },
      },
      section: {
        select: {
          id: true,
          section_name: true,
        },
      },
    },
  })

  if (!findNotice)
    return res.status(404).json({
      message: 'No notice found',
    })

  const formatData = {
    id: findNotice.id,
    title: findNotice.title,
    status: findNotice.status,
    description: findNotice.description,
    attachment: findNotice.attachment
      ? generateFileLink(`teachers/notices/${findNotice.attachment}`)
      : null,
    class_id: findNotice.class.id,
    class_name: findNotice.class.class_name,
    section_id: findNotice.section.id,
    section_name: findNotice.section.section_name,
  }

  res.json(formatData)
})

/*
  @route    POST: /teacher-notices
  @access   private
  @desc     Create a notice (For class/section)
*/
const createTeacherNotice = asyncHandler(async (req, res, next) => {
  const data = await teacherNoticeValidator().validate(req.body, {
    abortEarly: false,
  })

  if (req.files) {
    const { attachment } = await attachmentValidator().validate(req.files, {
      abortEarly: false,
    })

    // Notice Attachment
    const uniqueFolder = `teacher_notice_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/teachers/notices/${uniqueFolder}/${attachment.name}`
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

  await prisma.teacher_notices.create({
    data,
  })

  res.json({
    message: 'Notice created',
  })
})

/*
  @route    PUT: /teacher-notices/:id
  @access   private
  @desc     Update a notice
*/
const updateTeacherNotice = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await teacherNoticeValidator(id).validate(req.body, {
    abortEarly: false,
  })

  const teacherId = data.teacher_id

  if (teacherId !== req.user.id) {
    return res.status(403).json({
      message: 'You are not authorized',
    })
  }

  await prisma.$transaction(async (tx) => {
    const findNotice = await tx.teacher_notices.findUnique({
      where: {
        id,
      },
    })

    if (!findNotice)
      return res.status(404).json({
        message: 'No notice found',
      })

    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous attachment (If Exist)
      if (findNotice.attachment) {
        try {
          const photoDir = `uploads/teachers/notices/${
            findNotice.attachment.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous attachment',
          })
        }
      }

      // New Attachment
      const uniqueFolder = `teacher_notice_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/teachers/notices/${uniqueFolder}/${attachment.name}`
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

    await tx.teacher_notices.update({
      where: { id },
      data,
    })

    res.json({ message: 'Notice updated successfully' })
  })
})

/*
  @route    DELETE: /teacher-notices/:id
  @access   private
  @desc     Delete a notice
*/
const deleteTeacherNotice = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findNotice = await tx.teacher_notices.findUnique({
      where: {
        id,
      },
    })

    if (!findNotice)
      return res.status(404).json({
        message: 'No notice found',
      })

    if (findNotice.teacher_id !== req.user.id) {
      return res.status(403).json({
        message: 'You are not authorized',
      })
    }

    // Delete Attachment (If Exist)
    if (findNotice.attachment) {
      try {
        const photoDir = `uploads/teachers/notices/${
          findNotice.attachment.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

    await tx.teacher_notices.delete({
      where: { id },
    })

    res.json({ message: 'Notice deleted' })
  })
})

module.exports = {
  getTeacherNoticeForStudent,
  getAllTeacherNotices,
  getTeacherNotice,
  createTeacherNotice,
  updateTeacherNotice,
  deleteTeacherNotice,
}
