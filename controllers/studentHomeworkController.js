const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  paginateWithSorting,
  commonFields,
} = require('../utils/metaData')
const dayjs = require('dayjs')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')
const { attachmentValidator } = require('../validators/attachmentValidator')
const {
  studentHomeworkValidator,
} = require('../validators/studentHomeworkValidator')

/*
  @route    GET: /homeworks/student/:id
  @access   private
  @desc     All homeworks by teachers
*/
const getStudentHomeworks = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const studentId = Number(req.params.id)

  const findStudent = await prisma.students.findUnique({
    where: {
      id: studentId,
    },
  })

  if (!findStudent) {
    return res.status(404).json({ message: 'No student found' })
  }

  const [homeworks, total] = await prisma.$transaction([
    prisma.teacher_assignments.findMany({
      where: {
        AND: [
          { class_id: findStudent.class_id },
          { OR: [{ status: 'ACTIVE' }, { status: 'CONCLUDED' }] },
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
          { class_id: findStudent.class_id },
          { OR: [{ status: 'ACTIVE' }, { status: 'CONCLUDED' }] },
        ],
      },
    }),
  ])

  // Format Data
  const formatData = homeworks.map(
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
  @route    GET: /homeworks/students/:id/submitted
  @access   private
  @desc     Get Submitted homeworks of a student
*/
const getSubmittedHomeworks = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const studentId = Number(req.params.id)

  const [homeworks, total] = await prisma.$transaction([
    prisma.student_homeworks.findMany({
      where: {
        student_id: studentId,
      },
      select: {
        id: true,
        status: true,
        comment: true,
        created_at: true,
        updated_at: true,
        assignment: {
          select: {
            id: true,
            title: true,
            assignment_time: true,
            subject: {
              select: {
                name: true,
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
      take,
      skip,
      orderBy,
    }),
    prisma.student_homeworks.count({
      where: {
        student_id: studentId,
      },
    }),
  ])

  // Format Data
  const formatData = homeworks.map(
    ({
      id,
      status,
      comment,
      assignment: {
        id: assignment_id,
        title,
        assignment_time,
        subject: { name: subject_name },
        teacher: { name, designation },
      },
    }) => ({
      id,
      assignment_id,
      subject_name,
      status,
      comment,
      homework_title: title,
      homework_date: assignment_time,
      teacher_name: name,
      teacher_designation: designation.title,
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
  @route    GET: /homeworks/students/:studentId/submitted/:homeworkId
  @access   private
  @desc     Get Submitted homeworks of a student
*/
const getSubmittedHomeworkDetails = asyncHandler(async (req, res, next) => {
  const studentId = Number(req.params.studentId)
  const homeworkId = Number(req.params.homeworkId)

  const homeworkDetails = await prisma.student_homeworks.findFirst({
    where: {
      AND: [{ student_id: studentId }, { assignment_id: homeworkId }],
    },
    select: {
      id: true,
      status: true,
      comment: true,
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
    comment: homeworkDetails.comment,
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
  @route    GET: /homeworks/:id
  @access   private
  @desc     Get homework details
*/
const getHomework = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findAssignment = await tx.teacher_assignments.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
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
      assignment_time: findAssignment.assignment_time,
      submission_time: findAssignment.submission_time,
      status: findAssignment.status,
      created_at: findAssignment.created_at,
      updated_at: findAssignment.updated_at,
    }

    res.json(formatAssignment)
  })
})

/*
  @route    POST: /homeworks
  @access   private
  @desc     Add homework
*/
const addHomework = asyncHandler(async (req, res, next) => {
  const data = await studentHomeworkValidator().validate(req.body, {
    abortEarly: false,
  })

  const studentId = data.student_id
  const assignmentId = data.assignment_id

  await prisma.$transaction(async (tx) => {
    const checkHomeworkExist = await tx.student_homeworks.findFirst({
      where: {
        AND: [{ student_id: studentId }, { assignment_id: assignmentId }],
      },
    })

    if (checkHomeworkExist) {
      return res.status(403).json({ message: 'Not allowed to submit twice' })
    }

    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Attachment
      const uniqueFolder = `homework_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/students/homeworks/${uniqueFolder}/${attachment.name}`
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

    await tx.student_homeworks.create({
      data,
    })

    res.status(201).json({ message: 'Homework added successfully' })
  })
})

/*
  @route    PUT: /homeworks/submitted/:id
  @access   private
  @desc     Update a homework
*/
const updateHomework = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const userRole = req.user.role
  const userId = req.user.id

  const data = await studentHomeworkValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findHomework = await tx.student_homeworks.findUnique({
      where: {
        id,
      },
    })

    if (!findHomework) {
      return res.status(404).json({ message: 'Homework not found' })
    }

    // Check role
    if (!userRole && userRole !== 'student') {
      return res.status(403).json({ message: 'You are not authorized' })
    }

    // Check student
    if (!findHomework.student_id === userId) {
      return res.status(403).json({ message: 'You are not authorized' })
    }

    // Check Status
    if (!findHomework.status === 'REVISION') {
      return res.status(403).json({ message: 'Update is not allowed' })
    }

    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous attachment (If Exist)
      if (findHomework.attachment) {
        try {
          const photoDir = `uploads/students/homeworks/${
            findHomework.attachment.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous attachment',
          })
        }
      }

      // New Attachment
      const uniqueFolder = `homework_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/students/homeworks/${uniqueFolder}/${attachment.name}`
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

    await tx.student_homeworks.update({
      where: {
        id,
      },
      data: {
        ...data,
        status: 'PENDING',
      },
    })

    res.json({
      message: 'Homework Updated',
    })
  })
})

module.exports = {
  getStudentHomeworks,
  getSubmittedHomeworks,
  getSubmittedHomeworkDetails,
  getHomework,
  addHomework,
  updateHomework,
}
