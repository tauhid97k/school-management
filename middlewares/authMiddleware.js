const jwt = require('jsonwebtoken')
const dayjs = require('dayjs')
const getAuthUser = require('../utils/getAuthUser')

const verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (error, decoded) => {
    if (error) return res.status(403).json({ message: 'Forbidden' })

    const role = decoded.user.role
    const email = decoded.user.email

    const user = await getAuthUser(role, email)

    // Check if user exist in db
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check if user is suspended
    if (user.is_suspended)
      return res.json({ message: 'Your account is suspended' })

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
    if (user.email_verified_at) {
      formattedUser.email_verified_at = dayjs(user.created_at).format(
        'DD MMM YYYY'
      )
    }

    formattedUser.created_at = dayjs(user.created_at).format('DD MMM YYYY')

    req.user = formattedUser

    next()
  })
}

module.exports = verifyAuth
