const yup = require('yup')
const prisma = require('../utils/prisma')

const studentValidator = (id) =>
  yup.object({
    admission_no: yup
      .number()
      .typeError('Admission No must be number')
      .required('Admission no is required')
      .test('unique', 'Admission number already exist', async (value) => {
        const admission_no = await prisma.students.findUnique({
          where: {
            admission_no: value,
          },
        })

        if (admission_no && !id) {
          return false
        }

        if (admission_no && id) {
          if (findStudent.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!admission_no) {
          return true
        }
      }),
    admission_date: yup.string().required('Date of admission is required'),
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
    roll: yup
      .string()
      .required('Roll is required')
      .test('unique', 'Role already exist', async (value) => {
        const roll = await prisma.students.findUnique({
          where: {
            roll: value,
          },
        })

        if (roll) return false
        else return true
      }),
    name: yup.string().required('Full name is required'),
    email: yup
      .string()
      .required('Email is required')
      .email('Email is invalid')
      .test('unique', 'This email already exist', async (value) => {
        const findStudent = await prisma.students.findUnique({
          where: {
            email: value,
          },
        })

        if (findStudent && !id) {
          return false
        }

        if (findStudent && id) {
          if (findStudent.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findStudent) {
          return true
        }
      }),
    profile_img: yup.string().optional(),
    password: yup.string().required('Password is required'),
    date_of_birth: yup.string().required('Date of birth is required'),
    blood_group: yup
      .string()
      .required('Blood type is required')
      .oneOf([
        'O_POSITIVE',
        'O_NEGATIVE',
        'A_POSITIVE',
        'A_NEGATIVE',
        'B_POSITIVE',
        'B_NEGATIVE',
        'AB_POSITIVE',
        'AB_NEGATIVE',
      ]),
    religion: yup.string().required('Religion is required'),
    gender: yup
      .string()
      .required('Gender is required')
      .oneOf(['MALE', 'FEMALE', 'OTHER']),
    age: yup
      .number()
      .typeError('Age must be a number')
      .required('Age is required'),
    phone_number: yup.string().optional(),
    address: yup.string().required('Address is required'),
    guardians: yup
      .array()
      .of(
        yup.object({
          guardian_name: yup.string().required('Name is required'),
          guardian_relation: yup.string().required('Relation is required'),
          guardian_phone: yup.string().required('Phone number is required'),
          guardian_nid: yup.string().optional(),
          guardian_occupation: yup.string().optional(),
        })
      )
      .optional(),
  })

module.exports = { studentValidator }
