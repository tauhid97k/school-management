const asyncHandler = require('express-async-handler')

const assignRole = asyncHandler(async (userId, roleName, tx) => {
  const role = await tx.roles.findUnique({
    where: {
      name: roleName,
    },
  })

  if (role.name === 'admin') {
    await tx.user_roles.upsert({
      where: {
        admin_id: userId,
      },
      create: {
        admin_id: userId,
        role_id: role.id,
      },
      update: {
        role_id: role.id,
      },
    })
  } else if (role.name === 'teacher') {
    await tx.user_roles.upsert({
      where: {
        teacher_id: userId,
      },
      create: {
        teacher_id: userId,
        role_id: role.id,
      },
      update: {
        role_id: role.id,
      },
    })
  } else if (role.name === 'student') {
    await tx.user_roles.upsert({
      where: {
        student_id: userId,
      },
      create: {
        student_id: userId,
        role_id: role.id,
      },
      update: {
        role_id: role.id,
      },
    })
  } else {
    await tx.user_roles.upsert({
      where: {
        staff_id: userId,
      },
      create: {
        staff_id: userId,
        role_id: role.id,
      },
      update: {
        role_id: role.id,
      },
    })
  }
})

module.exports = assignRole
