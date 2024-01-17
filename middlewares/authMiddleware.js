const jwt = require('jsonwebtoken')
const { formatDate } = require('../utils/transformData')
const getAuthUser = require('../utils/getAuthUser')

const authMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, decoded) => {
        if (error) return res.status(403).json({ message: 'Forbidden' })

        const role = decoded.user.role
        const email = decoded.user.email

        const user = await getAuthUser(role, email)

        // Check if user exists in the database
        if (!user) {
          return res.status(401).json({ message: 'Unauthorized' })
        }

        // Check if user is suspended
        if (user.is_suspended) {
          return res.status(423).json({ message: 'Your account is suspended' })
        }

        // Check if user is verified
        // if (!user.email_verified_at) {
        //   return res.status(423).json({ message: 'You must verify your email' })
        // }

        // Format User Data
        const formattedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          email_verified_at: user.email_verified_at,
          created_at: user.created_at,
          role: user.user_roles.at(0).roles.name,
          permissions: user.user_roles
            .at(0)
            .roles.role_permissions.map(({ permissions }) => permissions.name),
        }

        // Format dates
        formattedUser.email_verified_at = formatDate(user.email_verified_at)
        formattedUser.created_at = formatDate(user.created_at)

        // Check if user has the required permission
        if (
          requiredPermission &&
          !formattedUser.permissions.includes(requiredPermission)
        ) {
          return res.status(403).json({
            message: 'Permission denied',
          })
        }

        // Save user
        req.user = formattedUser

        next()
      }
    )
  }
}

module.exports = authMiddleware
