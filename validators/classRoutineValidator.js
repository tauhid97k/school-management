const yup = require('yup')
const prisma = require('../utils/prisma')

const classRoutineValidator = (id) =>
  yup.object({
    class_id: yup
      .number()
      .typeError('Class id must be a number')
      .required('Class id is required')
      .test('exist', 'Class id does not exist', async (value) => {
        const class_id = await prisma.classes.findUnique({
          where: {
            id: value,
          },
        })

        if (class_id) return true
        else return false
      }),
    section_id: yup
      .number()
      .typeError('Section id must be a number backend')
      .transform((originalValue) => {
        return originalValue || undefined
      })
      .optional()
      .test('exist', 'Section id does not exist', async (value) => {
        if (!value) return true

        const findSection = await prisma.sections.findUnique({
          where: {
            id: value,
          },
        })

        if (findSection) return true
        else return false
      }),
    week_day: yup
      .string()
      .required('Week day is required')
      .oneOf([
        'SATURDAY',
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
      ])
      .test('unique', 'Weekday already exist', async (value, ctx) => {
        const class_id = ctx.parent.class_id
        const section_id = ctx.parent.section_id

        if (section_id) {
          const findSectionRoutine = await prisma.class_routines.findFirst({
            where: {
              section_id,
              AND: {
                week_day: value,
              },
            },
          })

          if (findSectionRoutine && !id) {
            return false
          } else if (findSectionRoutine && id) {
            if (findSectionRoutine.id === id) {
              return true
            }
          }
        } else if (class_id && !section_id) {
          const findClassRoutine = await prisma.class_routines.findFirst({
            where: {
              class_id,
              AND: {
                week_day: value,
              },
            },
          })

          if (findClassRoutine && !id) {
            return false
          } else if (findClassRoutine && id) {
            if (findClassRoutine.id === id) {
              return true
            }
          }
        }

        return true
      }),
    routines: yup
      .array()
      .of(
        yup.object({
          subject_id: yup
            .number()
            .typeError('Subject id must be a number')
            .required('Subject is required')
            .test('exist', 'Subject does not exist', async (value) => {
              const findSubject = await prisma.subjects.findUnique({
                where: {
                  id: value,
                },
              })

              if (findSubject) return true
              else return false
            }),
          teacher_id: yup
            .number()
            .typeError('Teacher id must be a number')
            .required('Teacher is required')
            .test('exist', 'Teacher does not exist', async (value) => {
              const findTeacher = await prisma.teachers.findUnique({
                where: {
                  id: value,
                },
              })

              if (findTeacher) return true
              else return false
            }),
          start_time: yup
            .date()
            .typeError('Start time must be a valid date time')
            .required('Start time is required')
            .test('time', 'Start time must be in the future', (value) => {
              const currentDate = new Date()
              const startDate = new Date(value)
              return startDate > currentDate
            }),
          end_time: yup
            .date()
            .typeError('End time must be a valid date time')
            .required('End time is required')
            .test('time', 'End time must be in the future', (value) => {
              const currentDate = new Date()
              const endDate = new Date(value)
              return endDate > currentDate
            })
            .test(
              'compare',
              'End time must be after start time; and must be on the same day',
              (value, ctx) => {
                const startTime = ctx.parent.start_time

                if (!startTime) {
                  throw new yup.ValidationError(
                    'Please, select start time first',
                    value,
                    'start_time'
                  )
                }

                const startDate = new Date(startTime)
                  .toISOString()
                  .split('T')[0]
                const endDate = new Date(value).toISOString().split('T')[0]

                return value > startTime && startDate === endDate
              }
            ),
        })
      )
      .required('Class routine is required')
      .min(1, 'Class routine is required'),
  })

module.exports = { classRoutineValidator }
