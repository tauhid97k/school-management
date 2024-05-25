const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { subjectValidator } = require('../validators/subjectValidator')
const {
  selectQueries,
  subjectFields,
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
      include: {
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
  const selectedQueries = selectQueries(req.query, subjectFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  let { class_id } = selectedQueries

  const whereClause = class_id ? { class_id: Number(class_id) } : {}

  const [subjects, total] = await prisma.$transaction([
    prisma.subjects.findMany({
      where: whereClause,
      include: {
        subject_class: {
          select: {
            class_name: true,
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.subjects.count({
      where: whereClause,
    }),
  ])

  const formatData = subjects.map(
    ({ id, code, name, subject_class, created_at, updated_at }) => ({
      id,
      code,
      name: `${name} - ${subject_class.class_name}`,
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
      subject_class: {
        select: {
          id: true,
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

  const formatData = {
    id: findSubject.id,
    name: findSubject.name,
    code: findSubject.code,
    class_id: findSubject?.subject_class?.id,
    groups: groups,
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
  const { name, code, groups, class_id } = await subjectValidator().validate(
    req.body,
    {
      abortEarly: false,
    }
  )

  // Format Data For Database
  const formatGroups = groups.map((group_id) => ({ group_id }))

  await prisma.subjects.create({
    data: {
      name,
      code,
      class_id,
      subject_groups: {
        createMany: {
          data: formatGroups,
        },
      },
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

  const { name, code, groups, class_id } = await subjectValidator(id).validate(
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

    // Format Data For Database
    const formatGroups = groups.map((group_id) => ({ group_id }))

    await tx.subjects.update({
      where: {
        id: findSubject.id,
      },
      data: {
        name,
        code,
        class_id,
        subject_groups: {
          createMany: {
            data: formatGroups,
          },
        },
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
