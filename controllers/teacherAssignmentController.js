const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  paginateWithSorting,
  assignmentFields,
} = require('../utils/metaData')
const {
  teacherAssignmentValidator,
  assignmentAttachmentValidator,
} = require('../validators/teacherAssignmentValidator')
const dayjs = require('dayjs')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')

/*
  @route    GET: /teacher-assignments/classes/:id/sections
  @access   private
  @desc     Get sections of a class
*/
const getClassSectionsForAssignment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findClass = await tx.classes.findUnique({
      where: {
        id,
      },
    })

    if (!findClass) {
      return res.status(404).json({ message: 'No class found' })
    }

    const sections = await tx.sections.findMany({
      where: {
        class_id: id,
      },
    })

    res.json(sections)
  })
})

/*
  @route    GET: /teacher-assignments
  @access   private
  @desc     All assignments
*/
const getAssignments = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, assignmentFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)
  let { class_id, section_id } = selectedQueries

  const [assignments, total] = await prisma.$transaction([
    prisma.teacher_assignments.findMany({
      where: {
        AND: [
          class_id ? { class_id: Number(class_id) } : {},
          section_id ? { section_id: Number(section_id) } : {},
        ],
      },
      select: {
        id: true,
        title: true,
        assignment_time: true,
        submission_time: true,
        created_at: true,
        updated_at: true,
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
        teacher: {
          select: {
            id: true,
            name: true,
            designation: true,
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.teacher_assignments.count({
      where: {
        AND: [
          class_id ? { class_id: Number(class_id) } : {},
          section_id ? { section_id: Number(section_id) } : {},
        ],
      },
    }),
  ])

  // Format Data
  const formatData = assignments.map(
    ({
      id,
      title,
      assignment_time,
      submission_time,
      class: { class_name },
      section,
      teacher: { name, designation },
      created_at,
      updated_at,
    }) => ({
      id,
      class_name,
      section_name: section.section_name ? section.section_name : null,
      teacher_name: name,
      teacher_designation: designation.title,
      assignment_title: title,
      assignment_time,
      submission_time,
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
  @route    POST: /teacher-assignments
  @access   private
  @desc     Create a new assignment
*/
const createAssignment = asyncHandler(async (req, res, next) => {
  const data = await teacherAssignmentValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { attachment } = await assignmentAttachmentValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Attachment
      const uniqueFolder = `assignment_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/teachers/assignments/${uniqueFolder}/${attachment.name}`
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

    // Correct dateTime format
    data.assignment_time = dayjs(data.assignment_time).toISOString()
    data.submission_time = dayjs(data.submission_time).toISOString()

    await tx.teacher_assignments.create({
      data: {
        ...data,
        teacher_id: req.user.id,
      },
    })

    res.status(201).json({ message: 'Assignment created successfully' })
  })
})

/*
  @route    PUT: /teacher-assignments/:id
  @access   private
  @desc     Update and assignment
*/
const updateAssignment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await teacherAssignmentValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findAssignment = await tx.teacher_assignments.findUnique({
      id,
    })

    if (!findAssignment) {
      return res.status(404).json({ message: 'Assignment not found' })
    }

    if (!findAssignment.teacher_id === req.user.id) {
      return res.status(403).json({ message: 'You are not authorized' })
    }

    if (req.files) {
      const { attachment } = await assignmentAttachmentValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Delete Previous attachment (If Exist)
      if (findAssignment.attachment) {
        try {
          const photoDir = `uploads/teachers/assignments/${
            findAssignment.attachment.split('/')[0]
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
      const uploadPath = `uploads/teachers/assignments/${uniqueFolder}/${attachment.name}`
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

    // Correct dateTime format
    data.assignment_time = dayjs(data.assignment_time).toISOString()
    data.submission_time = dayjs(data.submission_time).toISOString()

    await tx.teacher_assignments.update({
      where: {
        id,
      },
      data: {
        ...data,
        teacher_id: req.user.id,
      },
    })
  })
})
/*
  @route    DELETE: /teacher-assignments/:id
  @access   private
  @desc     Delete an assignment
*/
const deleteAssignment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findAssignment = await tx.teacher_assignments.findUnique({
      where: {
        id,
      },
    })

    if (!findAssignment)
      return res.status(404).json({
        message: 'No assignment found',
      })

    // Delete Attachment (If Exist)
    if (findAssignment.attachment) {
      try {
        const photoDir = `uploads/teachers/assignments/${
          findAssignment.attachment.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

    await tx.teacher_assignments.delete({
      where: { id },
    })

    res.json({ message: 'Assignment deleted' })
  })
})

module.exports = {
  getClassSectionsForAssignment,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
}
