const yup = require('yup')
const prisma = require('../utils/prisma')

const staffValidator = (id) =>
  yup.object({
    name: yup.string().required('Full name is required'),
    email: yup
      .string()
      .required('Email is required')
      .email('Email is invalid')
      .test('unique', 'This email already exist', async (value) => {
        const findTeacher = await prisma.teachers.findUnique({
          where: {
            email: value,
          },
        })

        if (findTeacher && !id) {
          return false
        }

        if (findTeacher && id) {
          if (findTeacher.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!findTeacher) {
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
    joining_date: yup.string().optional(),
    designation_id: yup
      .number()
      .typeError('Designation id must be a number')
      .required('Designation is required')
      .test('exist', 'Designation does not exist', async (value) => {
        const findDesignation = await prisma.designations.findUnique({
          where: {
            id: value,
          },
        })

        if (findDesignation) return true
        else return false
      }),
    phone_number: yup.string().required('Phone number is required'),
    address: yup.string().required('Address is required'),
    salary: yup
      .number()
      .typeError('Salary must be in number')
      .required('Salary is required'),
    cover_letter: yup.string().optional(),
    education: yup
      .array()
      .of(
        yup.object({
          exam_name: yup.string().required('Exam name is required'),
          institute_name: yup.string().required('Institute name is required'),
          passing_year: yup
            .number()
            .typeError('Year must be in number format')
            .required('Passing year is required'),
          grade: yup.string().required('Grade is required'),
        })
      )
      .transform((originalValue) => {
        try {
          return JSON.parse(originalValue)
        } catch (error) {
          throw new yup.ValidationError(
            'JSON parsing failed!',
            originalValue,
            'education'
          )
        }
      })
      .optional(),
    experience: yup
      .array()
      .of(
        yup.object({
          institute_name: yup.string().required('Institute name is required'),
          position: yup.string().required('Position is required'),
          job_period: yup.string().required('Job period is required'),
        })
      )
      .transform((originalValue) => {
        try {
          return JSON.parse(originalValue)
        } catch (error) {
          throw new yup.ValidationError(
            'JSON parsing failed!',
            originalValue,
            'experience'
          )
        }
      })
      .optional(),
    role: yup
      .string()
      .required('Role is required')
      .test('exist', 'Role does not exist', async (value) => {
        const findRole = await prisma.roles.findUnique({
          where: {
            name: value,
          },
        })

        return findRole ? true : false
      }),
  })

const staffProfileImageValidator = () =>
  yup.object({
    profile_img: yup
      .mixed()
      .test(
        'type',
        'Invalid file type. Only JPG, JPEG, and PNG are allowed',
        (file) => {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
          return allowedTypes.includes(file.mimetype)
        }
      )
      .test('size', 'File size is too large; max 2mb is allowed', (file) => {
        const maxSize = 2 * 1024 * 1024
        return file.size <= maxSize
      }),
  })

module.exports = {
  staffValidator,
  staffProfileImageValidator,
}
