const prisma = require('../utils/prisma')

// Create admin and user role
const roles = [{ name: 'admin' }, { name: 'teacher' }, { name: 'student' }]

// Create a few permissions
const permissions = [
  {
    name: 'teachers_access',
    group: 'teachers',
  },
  {
    name: 'create_teacher',
    group: 'teachers',
  },
  {
    name: 'edit_teacher',
    group: 'teachers',
  },
  {
    name: 'update_teacher',
    group: 'teachers',
  },
  {
    name: 'delete_teacher',
    group: 'teachers',
  },
]

async function main() {
  const [rolesCount, permissionsCount] = await prisma.$transaction([
    prisma.roles.count(),
    prisma.permissions.count(),
  ])

  if (!rolesCount && !permissionsCount) {
    await prisma.$transaction([
      prisma.roles.createMany({
        data: roles,
      }),
      prisma.permissions.createMany({
        data: permissions,
      }),
    ])
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
