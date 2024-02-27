const yup = require('yup')

const teacherNoticeValidator = () =>
  yup.object({
    title: yup.string().required('Notice title is required'),
    teacher_id: yup
      .number()
      .typeError('Teacher id must be a number')
      .required('Teacher id is required')
      .test('exist', 'Teacher id does not exist', async (value) => {
        const findTeacher = await prisma.teachers.findUnique({
          where: {
            id: value,
          },
        })

        if (findTeacher) return true
        else return false
      }),
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
    description: yup.string().optional(),
    status: yup
      .string()
      .required('Notice status is required')
      .oneOf(['DRAFT', 'PUBLISHED']),
    attachment: yup.string().optional(),
  })

module.exports = { teacherNoticeValidator }
