const asyncHandler = require('express-async-handler')

const assignRole = asyncHandler(async (userId, roleName, tx) => {
  const role = await tx.roles.findUnique({
    where: {
      name: roleName,
    },
  })

  await tx.user_roles.upsert({
    where: {
      user_id: userId,
    },
    create: {
      user_id: userId,
      role_id: role.id,
    },
    update: {
      role_id: role.id,
    },
  })
})

module.exports = assignRole
