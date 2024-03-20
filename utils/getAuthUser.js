const asyncHandler = require('express-async-handler')
const prisma = require('./prisma')
const generateFileLink = require('./generateFileLink')

module.exports = asyncHandler(async (role, email) => {
  if (role === 'admin') {
    const admin = await prisma.admins.findUnique({
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

    admin.profile_img = admin.profile_img
      ? generateFileLink(`admins/profiles/${admin.profile_img}`)
      : null

    return admin
  } else if (role === 'teacher') {
    const teacher = await prisma.teachers.findUnique({
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
    teacher.profile_img = teacher.profile_img
      ? generateFileLink(`teachers/profiles/${teacher.profile_img}`)
      : null

    return teacher
  } else if (role === 'student') {
    const student = await prisma.students.findUnique({
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

    student.profile_img = student.profile_img
      ? generateFileLink(`students/profiles/${student.profile_img}`)
      : null

    return student
  } else {
    const staff = await prisma.staffs.findUnique({
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

    staff.profile_img = staff.profile_img
      ? generateFileLink(`staffs/profiles/${staff.profile_img}`)
      : null

    return staff
  }
})
