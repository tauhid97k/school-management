const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  noticeFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  noticeValidator,
  noticeAttachmentValidator,
} = require('../validators/noticeValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /notices
  @access   private
  @desc     GET All Notice
*/
const getAllNotice = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, noticeFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)
  const { type } = selectedQueries
  type ? type : null

  const [notices, total] = await prisma.$transaction([
    prisma.notices.findMany({
      where: type ? { type } : {},
      take,
      skip,
      orderBy,
    }),
    prisma.notices.count(),
  ])

  const formatNotices = notices.map((notice) => ({
    ...notice,
    attachment: notice.attachment
      ? generateFileLink(`notices/${notice.attachment}`)
      : null,
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
  @route    GET: /notices/:id
  @access   private
  @desc     GET Notice details
*/
const getNotice = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findNotice = await prisma.notices.findUnique({
    where: {
      id,
    },
  })

  if (!findNotice)
    return res.status(404).json({
      message: 'No notice found',
    })

  findNotice.attachment = findNotice.attachment
    ? generateFileLink(`notices/${findNotice.attachment}`)
    : null

  res.json(findNotice)
})

/*
  @route    POST: /notices
  @access   private
  @desc     Create a notice (For all, teachers or classes)
*/
const createNotice = asyncHandler(async (req, res, next) => {
  const data = await noticeValidator().validate(req.body, { abortEarly: false })

  if (req.files) {
    const { attachment } = await noticeAttachmentValidator().validate(
      req.files,
      {
        abortEarly: false,
      }
    )

    // Notice Attachment
    const uniqueFolder = `notice_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/notices/${uniqueFolder}/${attachment.name}`
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

  await prisma.notices.create({
    data,
  })

  if (data.type === 'CLASSES') {
    return res.json({
      message: 'Notice has been sent to classes',
    })
  } else if (data.type === 'TEACHERS') {
    return res.json({
      message: 'Notice has been sent to teachers',
    })
  } else {
    return res.json({
      message: 'Notice has been sent to everyone',
    })
  }
})

/*
  @route    PUT: /notices/:id
  @access   private
  @desc     Update a notice
*/
const updateNotice = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await noticeValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findNotice = await tx.notices.findUnique({
      where: {
        id,
      },
    })

    if (!findNotice)
      return res.status(404).json({
        message: 'No notice found',
      })

    if (req.files) {
      const { attachment } = await noticeAttachmentValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Delete Previous attachment (If Exist)
      if (findNotice.attachment) {
        try {
          const photoDir = `uploads/notices/${
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
      const uniqueFolder = `notice_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/notices/${uniqueFolder}/${attachment.name}`
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

    await tx.notices.update({
      where: { id },
      data,
    })

    res.json({ message: 'Notice updated successfully' })
  })
})

/*
  @route    DELETE: /notices/:id
  @access   private
  @desc     Delete a notice
*/
const deleteNotice = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findNotice = await tx.notices.findUnique({
      where: {
        id,
      },
    })

    if (!findNotice)
      return res.status(404).json({
        message: 'No notice found',
      })

    // Delete Attachment (If Exist)
    if (findNotice.attachment) {
      try {
        const photoDir = `uploads/notices/${
          findNotice.attachment.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

    await tx.notices.delete({
      where: { id },
    })

    res.json({ message: 'Notice deleted' })
  })
})

/*
  @route    GET: /notices/all
  @access   private
  @desc     Get notices for all
*/
const getNoticesForAll = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, noticeFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [notices, total] = await prisma.$transaction([
    prisma.notices.findMany({
      where: {
        type: 'ALL',
      },
      select: {
        id: true,
        title: true,
        created_at: true,
        updated_at: true,
      },
      take,
      skip,
      orderBy,
    }),
    prisma.notices.count({
      where: {
        type: 'ALL',
      },
    }),
  ])

  res.json({
    data: notices,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /notices/teachers
  @access   private
  @desc     GET All Notice for teachers
*/
const getAllNoticeForTeachers = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, noticeFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [notices, total] = await prisma.$transaction([
    prisma.notices.findMany({
      where: {
        NOT: {
          type: 'DRAFT',
        },
      },
      select: {
        id: true,
        title: true,
        created_at: true,
        updated_at: true,
      },
      take,
      skip,
      orderBy,
    }),
    prisma.notices.count({
      where: {
        NOT: {
          type: 'DRAFT',
        },
      },
    }),
  ])

  res.json({
    data: notices,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /notices/classes
  @access   private
  @desc     GET All Notice for classes
*/
const getAllNoticeForClasses = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, noticeFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [notices, total] = await prisma.$transaction([
    prisma.notices.findMany({
      where: {
        NOT: {
          OR: [{ type: 'DRAFT' }, { type: 'TEACHERS' }],
        },
      },
      select: {
        id: true,
        title: true,
        created_at: true,
        updated_at: true,
      },
      take,
      skip,
      orderBy,
    }),
    prisma.notices.count({
      where: {
        NOT: {
          OR: [{ type: 'DRAFT' }, { type: 'TEACHERS' }],
        },
      },
    }),
  ])

  res.json({
    data: notices,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

module.exports = {
  getAllNotice,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
  getNoticesForAll,
  getAllNoticeForTeachers,
  getAllNoticeForClasses,
}
