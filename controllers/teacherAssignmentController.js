const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  paginateWithSorting,
  assignmentFields,
} = require('../utils/metaData')
const {
  teacherAssignmentValidator,
  teacherAssignmentApprovalValidation,
} = require('../validators/teacherAssignmentValidator')
const dayjs = require('dayjs')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')
const { attachmentValidator } = require('../validators/attachmentValidator')

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
        status: true,
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
      status,
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
      status,
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
  @route    GET: /teacher-assignments/:id
  @access   private
  @desc     Get a single assignment
*/
const getAssignment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findAssignment = await tx.teacher_assignments.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        assignment_time: true,
        submission_time: true,
        description: true,
        attachment: true,
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
        subject: {
          select: {
            id: true,
            name: true,
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
    })

    if (!findAssignment) {
      return res.status(404).json({ message: 'No assignment found' })
    }

    const formatAssignment = {
      id: findAssignment.id,
      status: findAssignment.status,
      class_id: findAssignment.class.id,
      class_name: findAssignment.class.class_name,
      section_id: findAssignment.section.id,
      section_name: findAssignment.section.section_name,
      subject_id: findAssignment.subject.id,
      subject_name: findAssignment.subject.name,
      teacher_name: findAssignment.teacher.name,
      teacher_designation: findAssignment.teacher.designation.title,
      assignment_title: findAssignment.title,
      assignment_description: findAssignment.description,
      assignment_attachment: findAssignment.attachment
        ? generateFileLink(`teachers/assignments/${findAssignment.attachment}`)
        : null,
      assignment_time: dayjs(findAssignment.assignment_time).format(
        'MM/DD/YYYY hh:mm A'
      ),
      submission_time: dayjs(findAssignment.submission_time).format(
        'MM/DD/YYYY hh:mm A'
      ),
      status: findAssignment.status,
      created_at: findAssignment.created_at,
      updated_at: findAssignment.updated_at,
    }

    res.json(formatAssignment)
  })
})

/*
  @route    GET: /teacher-assignments/teacher/:id/submitted
  @access   private
  @desc     Get submitted assignments
*/
const getSubmittedAssignments = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, assignmentFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  let { class_id, section_id } = selectedQueries
  class_id = class_id ? Number(class_id) : null
  section_id = section_id ? Number(section_id) : null

  const id = Number(req.params.id)

  const [submittedAssignments, total] = await prisma.$transaction([
    prisma.student_homeworks.findMany({
      where: {
        assignment: {
          teacher_id: id,
          ...(section_id && { section_id }),
          ...(class_id && !section_id && { class_id }),
        },
      },
      select: {
        id: true,
        status: true,
        created_at: true,
        student: {
          select: {
            name: true,
            roll: true,
          },
        },
        assignment: {
          select: {
            title: true,
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
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.student_homeworks.count({
      where: {
        assignment: {
          teacher_id: id,
          ...(section_id && { section_id }),
          ...(class_id && !section_id && { class_id }),
        },
      },
    }),
  ])

  // Format Data
  const formatData = submittedAssignments.map(
    ({ id, status, created_at, assignment }) => ({
      id,
      status,
      submission_time: created_at,
      class_name: assignment.class.class_name,
      section_name: assignment.section.section_name,
      subject_name: assignment.subject.name,
      subject_code: assignment.subject.code,
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
  @route    GET: /teacher-assignments/submitted/:homeworkId
  @access   private
  @desc     Get submitted assignments
*/
const getSubmittedAssignmentDetails = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const homeworkDetails = await prisma.student_homeworks.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      description: true,
      attachment: true,
      created_at: true,
      updated_at: true,
      assignment: {
        select: {
          title: true,
          assignment_time: true,
          subject: {
            select: {
              name: true,
              code: true,
            },
          },
          teacher: {
            select: {
              name: true,
              designation: true,
            },
          },
        },
      },
    },
  })

  if (!homeworkDetails) {
    return res.json({
      message: 'Homework details not found',
    })
  }

  // Format Data
  const formatData = {
    id: homeworkDetails.id,
    status: homeworkDetails.status,
    subject_name: homeworkDetails.assignment.subject.name,
    description: homeworkDetails.description,
    attachment: homeworkDetails.attachment
      ? generateFileLink(`students/homeworks/${homeworkDetails.attachment}`)
      : null,
    submitted_date: homeworkDetails.created_at,
    homework_title: homeworkDetails.assignment.title,
    homework_date: homeworkDetails.assignment.assignment_time,
    teacher_name: homeworkDetails.assignment.teacher.name,
    teacher_designation: homeworkDetails.assignment.teacher.designation,
  }

  res.json(formatData)
})

/*
  @route    GET: /teacher-assignments/submitted/:id/approval
  @access   private
  @desc     Get submitted assignments
*/
const approveSubmittedAssignments = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.homeworkId)
  const { status } = await teacherAssignmentApprovalValidation.validate(
    req.body,
    {
      abortEarly: false,
    }
  )

  await prisma.$transaction(async (tx) => {
    const findHomework = await tx.student_homeworks.findUnique({
      where: {
        id,
      },
    })

    if (!findHomework) {
      return res.status(404).json({
        message: 'Homework not found',
      })
    }

    await tx.student_homeworks.update({
      where: {
        id,
      },
      data: {
        status,
      },
    })

    res.json({
      message: 'Status updated',
    })
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
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

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
      where: {
        id,
      },
    })

    if (!findAssignment) {
      return res.status(404).json({ message: 'Assignment not found' })
    }

    if (!findAssignment.teacher_id === req.user.id) {
      return res.status(403).json({ message: 'You are not authorized' })
    }

    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

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

    res.json({
      message: 'Assignment updated',
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

    if (!findAssignment.teacher_id === req.user.id) {
      return res.status(403).json({ message: 'You are not authorized' })
    }

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
  getAssignments,
  getAssignment,
  getSubmittedAssignments,
  getSubmittedAssignmentDetails,
  approveSubmittedAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
}
