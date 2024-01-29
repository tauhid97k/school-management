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
          const subject = await prisma.subjects.findUnique({
            where: {
              code: value,
            },
          })

          if (subject && !id) {
            return false
          }

          if (subject && id) {
            if (subject.id === id) {
              return true
            } else {
              return false
            }
          }

          if (!subject) {
            return true
          }
        }
      ),
    group_id: yup
      .number()
      .typeError('group id must be number')
      .required('Group id is required')
      .test('exists', 'Group id does not exist', async (value) => {
        const findGroup = await prisma.groups.findUnique({
          where: {
            id: value,
          },
        })

        if (findGroup) return true
        else return false
      }),
  })

module.exports = { subjectValidator }
