const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  classNoticeValidator,
  noticeValidator,
} = require('../validators/noticeValidator')

/*
  @route    POST: /notices
  @access   private
  @desc     Create a notice (For all, teachers or classes)
*/
const createNotice = asyncHandler(async (req, res, next) => {
  const data = await noticeValidator.validate(req.body, { abortEarly: false })

  await prisma.noticeboard.create({
    data,
  })

  if (data.recipient_type === 'CLASSES') {
    return res.json({
      message: 'Notice has been sent to classes',
    })
  } else if (data.recipient_ids === 'TEACHERS') {
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
  @route    GET: /notices/class/:id
  @access   private
  @desc     Get Specific class notices
*/
const getClassNotice = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const id = req.params.id

  const [notices, total] = await prisma.$transaction([
    prisma.classes_noticeboard.findMany({
      where: {
        id: Number(id),
      },
      include: {
        teacher: {
          select: {
            name: true,
            designation: true,
            profile_img: true,
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.classes_noticeboard.count(),
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
  @route    POST: /notices/class/:id
  @access   private
  @desc     Create a new notice for a class
*/
const createClassNotice = asyncHandler(async (req, res, next) => {
  let data = await classNoticeValidator.validate(req.body, {
    abortEarly: false,
  })

  // Get Class Info
  const findClass = await prisma.classes.findUnique({
    where: {
      id: Number(data.class_id),
    },
  })

  if (!findClass) {
    return res.json({
      message: 'No class found',
    })
  }

  // Get Teacher Id
  const teacher_id = req.user.id

  await prisma.classes_noticeboard.create({
    data: {
      ...data,
      teacher_id,
    },
  })

  res.json({
    message: `Notice added for ${findClass.class_name}`,
  })
})

module.exports = { createNotice, getClassNotice, createClassNotice }
