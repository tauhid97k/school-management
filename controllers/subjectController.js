const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { subjectValidator } = require('../validators/subjectValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /subjects/:id/teachers
  @access   private
  @desc     Get subject teachers
*/
const getSubjectTeachers = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findSubject = await tx.subjects.findUnique({
      where: {
        id,
      },
    })

    if (!findSubject) {
      return res.status(404).json({
        message: 'Subject not found',
      })
    }

    const getTeachers = await tx.teacher_subjects.findMany({
      where: {
        subject_id: findSubject.id,
      },
      select: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Format Data
    const formatData = getTeachers.map(({ teacher }) => ({
      id: teacher.id,
      name: teacher.name,
    }))

    res.json(formatData)
  })
})

/*
  @route    GET: /subjects
  @access   private
  @desc     All subjects
*/
const getAllSubjects = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [subjects, total] = await prisma.$transaction([
    prisma.subjects.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.subjects.count(),
  ])

  res.json({
    data: subjects,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /subjects/:id
  @access   private
  @desc     Get a subject details
*/
const getSubject = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findSubject = await prisma.subjects.findUnique({
    where: {
      id,
    },
    include: {
      subject_groups: {
        select: {
          group_id: true,
        },
      },
      subject_classes: {
        select: {
          class_id: true,
        },
      },
    },
  })

  if (!findSubject)
    return res.status(404).json({
      message: 'No Subject found',
    })

  // Format the data
  const groups = findSubject.subject_groups.map(
    (subjectGroup) => subjectGroup.group_id
  )

  const classes = findSubject.subject_classes.map(
    (subjectClass) => subjectClass.class_id
  )

  const formatData = {
    id: findSubject.id,
    name: findSubject.name,
    code: findSubject.code,
    groups: groups,
    classes: classes,
    created_at: findSubject.created_at,
    updated_at: findSubject.updated_at,
  }

  res.json(formatData)
})

/*
  @route    POST: /subjects
  @access   private
  @desc     Create a new subject
*/
const createSubject = asyncHandler(async (req, res, next) => {
  const { name, code, groups, classes } = await subjectValidator().validate(
    req.body,
    {
      abortEarly: false,
    }
  )

  // Format Data For Database
  const formatGroups = groups.map((group_id) => ({ group_id }))
  const formatClasses = classes.map((class_id) => ({ class_id }))

  await prisma.subjects.create({
    data: {
      name,
      code,
      subject_groups: {
        createMany: {
          data: formatGroups,
        },
      },
      ...(formatGroups.length > 0 && {
        subject_classes: {
          createMany: {
            data: formatClasses,
          },
        },
      }),
    },
  })

  res.status(201).json({ message: 'Subject added successfully' })
})

/*
  @route    PUT: /subjects/:id
  @access   private
  @desc     Update a subject
*/
const updateSubject = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const { name, code, groups, classes } = await subjectValidator(id).validate(
    req.body,
    {
      abortEarly: false,
    }
  )

  await prisma.$transaction(async (tx) => {
    const findSubject = await tx.subjects.findUnique({
      where: {
        id,
      },
    })

    if (!findSubject)
      return res.status(404).json({
        message: 'No subject found',
      })

    // Delete existing entries in subject groups
    await tx.subject_groups.deleteMany({
      where: {
        subject_id: findSubject.id,
      },
    })

    // Delete existing entries in subject classes
    await tx.subject_classes.deleteMany({
      where: {
        subject_id: findSubject.id,
      },
    })

    // Format Data For Database
    const formatGroups = groups.map((group_id) => ({ group_id }))
    const formatClasses = classes.map((class_id) => ({ class_id }))

    await tx.subjects.update({
      where: {
        id: findSubject.id,
      },
      data: {
        name,
        code,
        subject_groups: {
          createMany: {
            data: formatGroups,
          },
        },
        ...(formatGroups.length > 0 && {
          subject_classes: {
            createMany: {
              data: formatClasses,
            },
          },
        }),
      },
    })

    res.json({ message: 'Subject updated successfully' })
  })
})

/*
  @route    DELETE: /subjects/:id
  @access   private
  @desc     delete a class
*/
const deleteSubject = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findSubject = await tx.subjects.findUnique({
      where: {
        id,
      },
    })

    if (!findSubject)
      return res.status(404).json({
        message: 'No Subject found',
      })

    await tx.subjects.delete({
      where: { id },
    })

    res.json({ message: 'Subject deleted successfully' })
  })
})

module.exports = {
  getAllSubjects,
  getSubjectTeachers,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
}
