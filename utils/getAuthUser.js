const asyncHandler = require('express-async-handler')
const prisma = require('./prisma')

module.exports = asyncHandler(async (role, email) => {
  if (role === 'admin') {
    return await prisma.admins.findUnique({
      where: {
        email,
      },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  } else if (role === 'teacher') {
    return await prisma.teachers.findUnique({
      where: {
        email,
      },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  } else if (role === 'student') {
    return await prisma.students.findUnique({
      where: {
        email,
      },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  } else {
    return await prisma.staffs.findUnique({
      where: {
        email,
      },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  }
})
