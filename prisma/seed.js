const prisma = require('../utils/prisma')

// Create admin and user role
const roles = [{ name: 'admin' }, { name: 'teacher' }, { name: 'student' }]

// Create a few permissions
const permissions = [
  {
    name: 'view_users',
    group: 'users',
  },
  {
    name: 'create_users',
    group: 'users',
  },
  {
    name: 'update_users',
    group: 'users',
  },
  {
    name: 'delete_users',
    group: 'users',
  },
  {
    name: 'view_posts',
    group: 'posts',
  },
  {
    name: 'create_posts',
    group: 'posts',
  },
  {
    name: 'update_posts',
    group: 'posts',
  },
  {
    name: 'delete_posts',
    group: 'posts',
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
