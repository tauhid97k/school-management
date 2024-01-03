const yup = require('yup')
const prisma = require('../utils/prisma')

const teacherValidator = yup.object({
  name: yup.string().required('Full name is required'),
  email: yup
    .string()
    .required('Email is required')
    .email('Email is invalid')
    .test('unique', 'This email already exist', async (value) => {
      const email = await prisma.teachers.findUnique({
        where: {
          email: value,
        },
      })

      if (email) return false
      else return true
    }),

  password: yup.string().required('Password is required'),
  date_of_birth: yup.string().required('Date of birth is required'),
  blood_group: yup.object({
    blood_type: yup
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
    rarity: yup.string().optional().oneOf(['Common', 'Rare', 'Very rare']),
  }),
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
  designation: yup.string().required('Designation is required'),
  phone_number: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  salary: yup
    .number()
    .typeError('Salary must be in number')
    .required('Salary is required'),
  profile_img: yup.string().optional(),
  cover_letter: yup.string().optional(),
  education_qualification: yup
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
    .required('Minimum education qualification is required')
    .min(1, 'Minimum education qualification is required'),
  experience: yup
    .array()
    .of(
      yup.object({
        institute_name: yup.string().required(),
        position: yup.string().required(),
        job_period: yup.string().required(),
      })
    )
    .optional(),
})

module.exports = { teacherValidator }
