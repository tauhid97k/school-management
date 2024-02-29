const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  classRoutineFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { classRoutineValidator } = require('../validators/classRoutineValidator')

/*
  @route    GET: /class-routines
  @access   private
  @desc     All exams
*/
const getAllClassRoutines = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, classRoutineFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)
  const { week_day, class_id, section_id } = selectedQueries

  const [routines, total] = await prisma.$transaction([
    prisma.class_routines.findMany({
      select: {
        id: true,
        week_day: true,
        created_at: true,
        updated_at: true,
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
    prisma.class_routines.count(),
  ])

  // Format Class Routines
  const formatData = routines.map(
    ({
      id,
      week_day,
      created_at,
      updated_at,
      class: { class_name },
      section: { section_name },
    }) => ({
      id,
      week_day,
      class_name,
      section_name,
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
  @route    GET: /class-routines/:id
  @access   private
  @desc     Get class routine details
*/
const getClassRoutine = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const classRoutine = await tx.class_routines.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        week_day: true,
        created_at: true,
        updated_at: true,
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
        routines: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            start_time: 'asc',
          },
        },
      },
    })

    if (!classRoutine)
      return res.status(404).json({
        message: 'No routine found',
      })

    // Format Data
    const formatData = {
      id: classRoutine.id,
      week_day: classRoutine.week_day,
      class_name: classRoutine.class.class_name,
      section_name: classRoutine.section.section_name,
      routines: classRoutine.routines.map(
        ({ id, subject, start_time, end_time }) => ({
          id,
          subject_id: subject.id,
          subject_name: subject.name,
          subject_code: subject.code,
          start_time,
          end_time,
        })
      ),
      created_at: classRoutine.created_at,
      updated_at: classRoutine.updated_at,
    }

    res.json(formatData)
  })
})

/*
  @route    POST: /class-routine
  @access   private
  @desc     Create new class routine
*/
const createClassRoutine = asyncHandler(async (req, res, next) => {
  const data = await classRoutineValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const routineIdentity = await tx.class_routines.create({
      data: {
        class_id: data.class_id,
        section_id: data.section_id,
        week_day: data.week_day,
      },
    })

    // Format Routine
    const formattedRoutines = data.routines.map((routine) => ({
      ...routine,
      class_routine_id: routineIdentity.id,
    }))

    await tx.routines.createMany({
      data: formattedRoutines,
    })

    res.status(201).json({ message: 'Class routine created' })
  })
})

/*
  @route    PUT: /class-routines/:id
  @access   private
  @desc     Update class routine
*/
const updateClassRoutine = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await classRoutineValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const classRoutine = await tx.class_routines.findUnique({
      where: {
        id,
      },
    })

    if (!classRoutine)
      return res.status(404).json({
        message: 'No class routine found',
      })

    await prisma.class_routines.update({
      where: {
        id,
      },
      data: {
        class_id: data.class_id,
        section_id: data.section_id,
        week_day: data.week_day,
        routines: {
          createMany: {
            data: data.routines,
          },
        },
      },
    })

    res.json({ message: 'Class routine updated' })
  })
})

/*
  @route    DELETE: /class-routines/:id
  @access   private
  @desc     delete class routine
*/
const deleteClassRoutine = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const classRoutine = await tx.class_routines.findUnique({
      where: {
        id,
      },
    })

    if (!classRoutine)
      return res.status(404).json({
        message: 'No class routine found',
      })

    await tx.class_routines.delete({
      where: { id },
    })

    res.json({ message: 'Class routine deleted' })
  })
})

module.exports = {
  getAllClassRoutines,
  getClassRoutine,
  createClassRoutine,
  updateClassRoutine,
  deleteClassRoutine,
}
