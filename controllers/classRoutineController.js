const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  classRoutineFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  classRoutineValidator,
  classRoutineWeekDayValidator,
} = require('../validators/classRoutineValidator')

/*
  @route    GET: /class-routines/teacher/:id
  @access   private
  @desc     Get routine by for a student (Based on class/section)
*/
const getTeacherClassRoutine = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    const routines = await tx.routines.findMany({
      where: {
        teacher_id: findTeacher.id,
      },
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        start_time: true,
        end_time: true,
        routine: {
          select: {
            id: true,
            week_day: true,
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
        },
      },
    })

    // Format Data
    const formatData = routines.map(
      ({ routine, subject, start_time, end_time }) => ({
        id: routine.id,
        week_day: routine.week_day,
        class_name: routine.class.class_name,
        section_name: routine.section ? routine.section.section_name : null,
        subject_id: subject.id,
        subject_name: subject.name,
        subject_code: subject.code,
        start_time,
        end_time,
      })
    )

    return res.json(formatData)
  })
})

/*
  @route    GET: /class-routines/student/:id
  @access   private
  @desc     Get routine by for a student (Based on class/section)
*/
const getStudentClassRoutine = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Get class or section routine (Based on student)
    let response
    if (findStudent.class_id && !findStudent.section_id) {
      response = await tx.class_routines.findMany({
        where: {
          class_id: findStudent.class_id,
        },
        select: {
          id: true,
          week_day: true,
          class: {
            select: {
              class_name: true,
            },
          },
          routines: {
            select: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              teacher: {
                select: {
                  id: true,
                  name: true,
                  designation: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
              start_time: true,
              end_time: true,
            },
          },
        },
      })

      // Format Data
      const formatData = response.map(
        ({ id, week_day, class: routineClass, routines }) => ({
          id,
          week_day,
          class_name: routineClass.class_name,
          routines: routines.map(
            ({ subject, teacher, start_time, end_time }) => ({
              subject_id: subject.id,
              subject_name: subject.name,
              subject_code: subject.code,
              teacher_id: teacher.id,
              teacher_name: teacher.name,
              teacher_designation: teacher.designation.title,
              start_time,
              end_time,
            })
          ),
        })
      )

      return res.json(formatData)
    } else if (findStudent.section_id) {
      response = await tx.class_routines.findMany({
        where: {
          section_id: findStudent.section_id,
        },
        select: {
          id: true,
          week_day: true,
          class: {
            select: {
              class_name: true,
            },
          },
          routines: {
            select: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              teacher: {
                select: {
                  id: true,
                  name: true,
                  designation: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
              start_time: true,
              end_time: true,
            },
          },
        },
      })

      // Format Data
      const formatData = response.map(
        ({ id, week_day, class: routineClass, routines }) => ({
          id,
          week_day,
          class_name: routineClass.class_name,
          routines: routines.map(
            ({ subject, teacher, start_time, end_time }) => ({
              subject_id: subject.id,
              subject_name: subject.name,
              subject_code: subject.code,
              teacher_id: teacher.id,
              teacher_name: teacher.name,
              teacher_designation: teacher.designation.title,
              start_time,
              end_time,
            })
          ),
        })
      )

      return res.json(formatData)
    }
  })
})

/*
  @route    GET: /class-routines/routine?class_id&section_id&week_day
  @access   private
  @desc     Get routine by class or section and weekday (Filter)
*/
const getRoutineByClassOrSection = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, classRoutineFields)
  let { class_id, section_id, week_day } = selectedQueries
  class_id = class_id ? Number(class_id) : null
  section_id = section_id ? Number(section_id) : null

  if (!class_id) {
    return res.status(400).json({
      message: 'Class id is required',
    })
  }

  // Check class section
  if (!section_id) {
    const checkClassSection = await prisma.classes.findUnique({
      where: {
        id: class_id,
      },
      select: {
        id: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    })

    if (checkClassSection._count.sections > 0) {
      return res.status(400).json({
        message: 'Section id is required',
      })
    }
  }

  if (!week_day) {
    return res.status(400).json({
      message: 'Week day is required',
    })
  }

  let whereCondition = {}

  if (class_id && section_id) {
    whereCondition = {
      AND: [{ class_id }, { section_id }, { week_day }],
    }
  } else if (class_id && !section_id) {
    whereCondition = {
      AND: [{ class_id }, { week_day }],
    }
  }

  const classSectionRoutine = await prisma.class_routines.findMany({
    where: whereCondition,
    select: {
      routines: {
        select: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
          start_time: true,
          end_time: true,
        },
      },
    },
  })

  const formatRoutines = classSectionRoutine.flatMap(({ routines }) =>
    routines.map(({ subject, teacher, start_time, end_time }) => ({
      subject_id: subject.id,
      subject_name: subject.name,
      subject_code: subject.code,
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      start_time,
      end_time,
    }))
  )

  res.json(formatRoutines)
})

/*
  @route    GET: /class-routines/classes
  @access   private
  @desc     All classes that has routine
*/
const getAllRoutineClasses = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, classRoutineFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const routineClasses = await prisma.class_routines.findMany({
    distinct: ['class_id'],
    select: {
      id: true,
      class: {
        select: {
          id: true,
          class_name: true,
        },
      },
    },
    take,
    skip,
    orderBy,
  })

  // Format data
  const formatData = routineClasses.map(({ id, class: routineClass }) => ({
    id,
    class_id: routineClass.id,
    class_name: routineClass.class_name,
  }))

  res.json({
    data: formatData,
    meta: {
      page,
      limit: take,
      total: routineClasses.length,
    },
  })
})

/*
  @route    GET: /class-routines/:id
  @access   private
  @desc     Get class routine details or get sections (For section routine later)
*/
const getClassRoutineOrSections = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  let response = {
    class_routine: [],
    sections: [],
  }

  await prisma.$transaction(async (tx) => {
    const findClassRoutine = await tx.class_routines.findUnique({
      where: {
        id,
      },
    })

    if (!findClassRoutine)
      return res.status(404).json({
        message: 'No routine found',
      })

    // Check if class has section
    const checkClassSection = await tx.classes.findUnique({
      where: {
        id: findClassRoutine.class_id,
      },
      select: {
        id: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    })

    if (checkClassSection._count.sections > 0) {
      response.class_routine = []
      const findDistinctSections = await tx.class_routines.findMany({
        where: {
          NOT: {
            section_id: null,
          },
        },
        distinct: ['section_id'],
        select: {
          id: true,
          section: {
            select: {
              id: true,
              section_name: true,
            },
          },
        },
      })
      // Format Data
      const formatSections = findDistinctSections.map(({ section }) => ({
        id: section.id,
        section_name: section.section_name,
      }))
      response.sections = formatSections
    } else {
      response.sections = []
      const getClassRoutine = await tx.class_routines.findMany({
        where: {
          class_id: findClassRoutine.class_id,
        },
        select: {
          id: true,
          week_day: true,
          class: {
            select: {
              id: true,
              class_name: true,
            },
          },
          routines: {
            select: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              teacher: {
                select: {
                  id: true,
                  name: true,
                  designation: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
              start_time: true,
              end_time: true,
            },
          },
        },
      })

      const formatData = getClassRoutine.map(
        ({ id, week_day, class: routineClass, routines }) => ({
          id,
          week_day,
          class_id: routineClass.id,
          class_name: routineClass.class_name,
          routines: routines.map(
            ({ subject, teacher, start_time, end_time }) => ({
              subject_id: subject.id,
              subject_name: subject.name,
              subject_code: subject.code,
              teacher_id: teacher.id,
              teacher_name: teacher.name,
              teacher_designation: teacher.designation.title,
              start_time,
              end_time,
            })
          ),
        })
      )
      response.class_routine = formatData
    }

    res.json(response)
  })
})

/*
  @route    GET: /class-routines/section/:id
  @access   private
  @desc     Get section routine
*/
const getSectionRoutine = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findSection = await tx.sections.findUnique({
      where: {
        id,
      },
    })

    if (!findSection) {
      return res.status(404).json({
        message: 'Section not found',
      })
    }

    const findSectionRoutine = await tx.class_routines.findMany({
      where: {
        section_id: id,
      },
      include: {
        section: {
          select: {
            id: true,
            section_name: true,
            room: {
              select: {
                room_number: true,
              },
            },
            class: {
              select: {
                class_name: true,
              },
            },
          },
        },
        routines: {
          select: {
            start_time: true,
            end_time: true,
            created_at: true,
            updated_at: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            teacher: {
              select: {
                id: true,
                name: true,
                designation: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Format Data
    const formatData = {
      class_name: findSectionRoutine.at(0).section.class.class_name,
      section_id: findSectionRoutine.at(0).section.id,
      section_name: findSectionRoutine.at(0).section.section_name,
      room_number: findSectionRoutine.at(0).section.room.room_number,
      routines: findSectionRoutine.map(
        ({ id, week_day, created_at, updated_at, section, routines }) => ({
          id,
          week_day,
          section_id: section.id,
          section_name: section.section_name,
          class_name: section.class.class_name,
          routines: routines.map(
            ({ subject, teacher, start_time, end_time }) => ({
              subject_id: subject.id,
              subject_name: subject.name,
              subject_code: subject.code,
              teacher_id: teacher.id,
              teacher_name: teacher.name,
              teacher_designation: teacher.designation.title,
              start_time,
              end_time,
            })
          ),
          created_at,
          updated_at,
        })
      ),
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

    // Delete Previous Routines
    await tx.routines.deleteMany({
      where: {
        class_routine_id: classRoutine.id,
      },
    })

    await tx.class_routines.update({
      where: {
        id: classRoutine.id,
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
  @route    GET: /class-routines/:id/week
  @access   private
  @desc     class routine details on week
*/
const getClassRoutineOnWeek = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const classRoutine = await tx.class_routines.findUnique({
      where: {
        id,
      },
      include: {
        class: true,
        section: true,
        routines: true,
      },
    })

    if (!classRoutine)
      return res.status(404).json({
        message: 'Class routine not found',
      })

    // Format Data
    const formatData = {
      class_id: classRoutine.class.id,
      class_name: classRoutine.class.class_name,
      section_id: classRoutine.section ? classRoutine.section.id : null,
      section_name: classRoutine.section
        ? classRoutine.section.section_name
        : null,
      routines: classRoutine.routines,
      created_at: classRoutine.created_at,
      updated_at: classRoutine.updated_at,
    }

    res.json(formatData)
  })
})

/*
  @route    PUT: /class-routines/:id/week
  @access   private
  @desc     class routine update on week
*/
const updateClassRoutineOnWeek = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await classRoutineWeekDayValidator().validate(req.body, {
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
        message: 'Class routine not found',
      })

    // Delete Previous Routines
    await tx.routines.deleteMany({
      where: {
        class_routine_id: classRoutine.id,
      },
    })

    // Update Routines
    const formattedRoutines = data.routines.map((routine) => ({
      ...routine,
      class_routine_id: classRoutine.id,
    }))

    await tx.routines.createMany({
      data: formattedRoutines,
    })

    res.json({
      message: 'Routine updated',
    })
  })
})

/*
  @route    DELETE: /class-routines/:id/week
  @access   private
  @desc     delete class routine
*/
const deleteClassRoutineOnWeek = asyncHandler(async (req, res, next) => {
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
      where: {
        id: classRoutine.id,
      },
    })

    res.json({
      message: `${classRoutine.week_day} routine deleted`,
    })
  })
})

/*
  @route    DELETE: /class-routines/:classId
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

    await tx.class_routines.deleteMany({
      where: {
        class_id: classRoutine.class_id,
      },
    })

    res.json({ message: 'Class routine deleted' })
  })
})

module.exports = {
  getStudentClassRoutine,
  getTeacherClassRoutine,
  getRoutineByClassOrSection,
  getAllRoutineClasses,
  getClassRoutineOrSections,
  getSectionRoutine,
  createClassRoutine,
  updateClassRoutine,
  getClassRoutineOnWeek,
  updateClassRoutineOnWeek,
  deleteClassRoutineOnWeek,
  deleteClassRoutine,
}
