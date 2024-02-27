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
  @route    GET: /teacher-notices/:teacherId
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
      take,
      skip,
      orderBy,
    }),
    prisma.teacher_notices.count(),
  ])

  const formatNotices = notices.map((notice) => ({
    ...notice,
    attachment: generateFileLink(`teachers/notices/${notice.attachment}`),
  }))

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
  @route    GET: /teacher-notices/:noticeId
  @access   private
  @desc     GET Notice details
*/
const getTeacherNotice = asyncHandler(async (req, res, next) => {
  const noticeId = Number(req.params.noticeId)
  const findNotice = await prisma.teacher_notices.findUnique({
    where: {
      id: noticeId,
    },
  })

  if (!findNotice)
    return res.status(404).json({
      message: 'No notice found',
    })

  findNotice.attachment = generateFileLink(
    `teachers/notices/${findNotice.attachment}`
  )

  res.json(findNotice)
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
  @route    PUT: /teacher-notices/:teacherId/:noticeId
  @access   private
  @desc     Update a notice
*/
const updateTeacherNotice = asyncHandler(async (req, res, next) => {
  const teacherId = Number(req.params.id)
  const noticeId = Number(req.params.id)

  if (teacherId !== req.user.id) {
    return res.status(403).json({
      message: 'You are not authorized',
    })
  }

  const data = await teacherNoticeValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findNotice = await tx.teacher_notices.findUnique({
      where: {
        id: noticeId,
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
      where: { id: noticeId },
      data,
    })

    res.json({ message: 'Notice updated successfully' })
  })
})

/*
  @route    DELETE: /teacher-notices/:teacherId/:noticeId
  @access   private
  @desc     Delete a notice
*/
const deleteTeacherNotice = asyncHandler(async (req, res, next) => {
  const teacherId = Number(req.params.id)
  const noticeId = Number(req.params.id)

  if (teacherId !== req.user.id) {
    return res.status(403).json({
      message: 'You are not authorized',
    })
  }

  await prisma.$transaction(async (tx) => {
    const findNotice = await tx.teacher_notices.findUnique({
      where: {
        id: noticeId,
      },
    })

    if (!findNotice)
      return res.status(404).json({
        message: 'No notice found',
      })

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
      where: { id: noticeId },
    })

    res.json({ message: 'Notice deleted' })
  })
})

module.exports = {
  getAllTeacherNotices,
  getTeacherNotice,
  createTeacherNotice,
  updateTeacherNotice,
  deleteTeacherNotice,
}
