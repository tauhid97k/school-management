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

// Role Permissions
const rolePermissions = [
  { role_id: 1, permission_id: 1 },
  { role_id: 1, permission_id: 2 },
  { role_id: 1, permission_id: 3 },
  { role_id: 1, permission_id: 4 },
  { role_id: 1, permission_id: 5 },
  { role_id: 1, permission_id: 6 },
  { role_id: 1, permission_id: 7 },
  { role_id: 1, permission_id: 8 },
  { role_id: 1, permission_id: 9 },
  { role_id: 1, permission_id: 10 },
  { role_id: 1, permission_id: 11 },
  { role_id: 1, permission_id: 12 },
  { role_id: 1, permission_id: 13 },
  { role_id: 1, permission_id: 14 },
  { role_id: 1, permission_id: 15 },
  { role_id: 1, permission_id: 16 },
  { role_id: 1, permission_id: 17 },
  { role_id: 1, permission_id: 18 },
  { role_id: 1, permission_id: 19 },
  { role_id: 1, permission_id: 20 },
  { role_id: 1, permission_id: 21 },
  { role_id: 1, permission_id: 22 },
  { role_id: 1, permission_id: 23 },
  { role_id: 1, permission_id: 24 },
  { role_id: 1, permission_id: 25 },
  { role_id: 1, permission_id: 26 },
  { role_id: 1, permission_id: 27 },
  { role_id: 1, permission_id: 28 },
  { role_id: 1, permission_id: 29 },
  { role_id: 2, permission_id: 30 },
  { role_id: 3, permission_id: 31 },
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

  await prisma.role_permissions.createMany({
    data: rolePermissions,
  })
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
