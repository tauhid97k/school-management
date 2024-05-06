const prisma = require('../utils/prisma')

// Create admin and user role
const roles = [{ name: 'admin' }, { name: 'teacher' }, { name: 'student' }]

// Create a few permissions
const permissions = [
  {
    name: 'teachers_access',
    group: 'user_management',
  },
  {
    name: 'students_access',
    group: 'user_management',
  },
  {
    name: 'staffs_access',
    group: 'user_management',
  },
  {
    name: 'designation_access',
    group: 'user_management',
  },
  {
    name: 'role_permissions_access',
    group: 'role_permissions',
  },
  {
    name: 'teachers_attendance',
    group: 'attendance',
  },
  {
    name: 'staffs_attendance',
    group: 'attendance',
  },
  {
    name: 'class_attendance',
    group: 'attendance',
  },
  {
    name: 'room_access',
    group: 'academic_management',
  },
  {
    name: 'group_access',
    group: 'academic_management',
  },
  {
    name: 'class_access',
    group: 'academic_management',
  },
  {
    name: 'section_access',
    group: 'academic_management',
  },
  {
    name: 'subject_access',
    group: 'academic_management',
  },
  {
    name: 'exam_category_access',
    group: 'exam_management',
  },
  {
    name: 'exam_access',
    group: 'exam_management',
  },
  {
    name: 'exam_grade_access',
    group: 'exam_management',
  },
  {
    name: 'exam_result_access',
    group: 'exam_management',
  },
  {
    name: 'exam_result_publish_access',
    group: 'exam_management',
  },
  {
    name: 'teachers_application_access',
    group: 'application',
  },
  {
    name: 'students_application_access',
    group: 'application',
  },
  {
    name: 'routine_access',
    group: 'routine',
  },
  {
    name: 'exam_routine_access',
    group: 'routine',
  },
  {
    name: 'notice_access',
    group: 'notice',
  },
  {
    name: 'expense_category_access',
    group: 'account',
  },
  {
    name: 'expense_access',
    group: 'account',
  },
  {
    name: 'salary_access',
    group: 'account',
  },
  {
    name: 'student_fees_access',
    group: 'account',
  },
  {
    name: 'website_management',
    group: 'website',
  },
  {
    name: 'admin_permissions',
    group: 'admins',
  },
  {
    name: 'teacher_permissions',
    group: 'teachers',
  },
  {
    name: 'student_permissions',
    group: 'students',
  },
]

async function main() {
  const [rolesCount, permissionsCount] = await prisma.$transaction([
    prisma.roles.count(),
    prisma.permissions.count(),
  ])

  if (!rolesCount) {
    await prisma.roles.createMany({
      data: roles,
    })
  }

  if (!permissionsCount) {
    await prisma.permissions.createMany({
      data: permissions,
    })
  }
}

main()
  .then(async () => {
    console.log('Seeding was successful')
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.log('Error seeding database', error)
    await prisma.$disconnect()
    process.exit(1)
  })
