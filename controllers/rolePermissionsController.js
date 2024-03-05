const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  rolePermissionsValidator,
  updateRolePermissionsValidator,
} = require('../validators/rolePermissionsValidator')

/*
  @route    GET: /role-permissions/roles
  @access   private
  @desc     Get all roles
*/
const getRoles = asyncHandler(async (req, res, next) => {
  const roles = await prisma.roles.findMany()
  res.json(roles)
})

/*
  @route    GET: /role-permissions/roles/ns
  @access   private
  @desc     Get roles without student
*/
const getRolesWithoutStudent = asyncHandler(async (req, res, next) => {
  const roles = await prisma.roles.findMany({
    where: {
      NOT: {
        name: 'student',
      },
    },
  })
  res.json(roles)
})

/*
  @route    GET: /role-permissions/roles/nats
  @access   private
  @desc     Get roles without student
*/
const getRolesWithoutAdminTeacherAndStudent = asyncHandler(
  async (req, res, next) => {
    const roles = await prisma.roles.findMany({
      where: {
        NOT: [{ name: 'admin' }, { name: 'teacher' }, { name: 'student' }],
      },
    })
    res.json(roles)
  }
)

/*
  @route    GET: /role-permissions/permissions
  @access   private
  @desc     Get all permissions
*/
const getPermissions = asyncHandler(async (req, res, next) => {
  const permissions =
    await prisma.$queryRaw`SELECT "group", jsonb_agg(jsonb_build_object('id', id, 'name', name)) as permissions
    FROM permissions
    GROUP BY "group"`
  res.json(permissions)
})

/*
  @route    GET: /role-permissions/permissions?role_id
  @access   private
  @desc     Get all permissions for a role
*/
const getRolePermissions = asyncHandler(async (req, res, next) => {
  const role_id = Number(req.query.role_id)

  if (!role_id) {
    return res.status(400).json({
      message: 'Role id is required',
    })
  }

  await prisma.$transaction(async (tx) => {
    const findRole = await prisma.roles.findUnique({
      where: {
        id: role_id,
      },
    })

    if (!findRole) {
      return res.status(400).json({
        message: 'Role not found',
      })
    }

    const rolePermissions = await tx.roles.findMany({
      where: {
        name: findRole.name,
      },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    })

    const formattedRolePermissions = rolePermissions.map(
      ({ id, name, created_at, updated_at, role_permissions }) => {
        return {
          id,
          role: name,
          created_at,
          updated_at,
          permissions: role_permissions.map(({ permissions, group }) => ({
            id: permissions.id,
            name: permissions.name,
            group,
            created_at: permissions.created_at,
            updated_at: permissions.updated_at,
          })),
        }
      }
    )

    res.json(formattedRolePermissions.at(0))
  })
})

/*
  @route    POST: /role-permissions
  @access   private
  @desc     Create a role with permissions
*/
const createRolePermissions = asyncHandler(async (req, res, next) => {
  const { role, permissions } = await rolePermissionsValidator.validate(
    req.body,
    {
      abortEarly: false,
    }
  )

  await prisma.$transaction(async (tx) => {
    // Create Role
    const addRole = await tx.roles.create({
      data: {
        name: role,
      },
    })

    // Format Role and Permissions for Database
    const formattedRolePermissions = permissions.map((permission) => {
      return { role_id: addRole.id, permission_id: permission }
    })

    // Create Role and their permissions
    await tx.role_permissions.createMany({
      data: formattedRolePermissions,
    })

    res.json({ message: 'Role and permissions are created' })
  })
})

/*
  @route    PUT: /role-permissions
  @access   private
  @desc     Update a role with permissions
*/
const updateRolePermissions = asyncHandler(async (req, res, next) => {
  const { role_id, permissions } =
    await updateRolePermissionsValidator.validate(req.body, {
      abortEarly: false,
    })

  await prisma.$transaction(async (tx) => {
    const findRole = await tx.roles.findUnique({
      where: {
        id: role_id,
      },
    })

    // Delete selected role index with related permissions
    await tx.role_permissions.deleteMany({
      where: {
        role_id: findRole.id,
      },
    })

    // Format Role and Permissions for Database
    const formattedRolePermissions = permissions.map((permission) => {
      return { role_id: findRole.id, permission_id: permission }
    })

    // Recreate selected role index and update/create permissions
    await tx.role_permissions.createMany({
      data: formattedRolePermissions,
    })

    res.json({
      message: `Permissions are updated for ${findRole.name} role`,
    })
  })
})

module.exports = {
  getRoles,
  getRolesWithoutStudent,
  getRolesWithoutAdminTeacherAndStudent,
  getPermissions,
  getRolePermissions,
  createRolePermissions,
  updateRolePermissions,
}
