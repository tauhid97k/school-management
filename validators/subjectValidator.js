const yup = require('yup')
const prisma = require('../utils/prisma')

const subjectValidator = (id) =>
  yup.object({
    name: yup.string().required('Subject name is required'),
    code: yup
      .string()
      .required('Subject code is required')
      .test(
        'unique',
        'This code already assigned to another subject',
        async (value) => {
          const findSubject = await prisma.subjects.findUnique({
            where: {
              code: value,
            },
          })

          if (findSubject && !id) {
            return false
          }

          if (findSubject && id) {
            if (findSubject.id === id) {
              return true
            } else {
              return false
            }
          }

          if (!findSubject) {
            return true
          }
        }
      ),
    groups: yup
      .array(yup.number().typeError('Group must be an id'))
      .required('At least one group is required')
      .test('exist', 'One or more groups are invalid', async (values) => {
        const checkGroups = await prisma.groups.findMany({
          where: {
            id: {
              in: values,
            },
          },
        })

        if (checkGroups.length === values.length) return true
        else return false
      })
      .min(1, 'At least one group is required'),
    class_id: yup
      .number()
      .typeError('Class id must be a number')
      .test('exist', 'Class id does not exist', async (value) => {
        const class_id = await prisma.classes.findUnique({
          where: {
            id: value,
          },
        })

        if (class_id) return true
        else return false
      }),
  })

module.exports = { subjectValidator }
