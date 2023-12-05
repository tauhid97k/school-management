module.exports = (requiredPermission) => {
  return (req, res, next) => {
    // Assuming you have a user object attached to the request (e.g., obtained from authentication)
    const userPermissions = req.user ? req.user.permissions : null

    // Check if the user has the required permission
    if (userPermissions && userPermissions.includes(requiredPermission)) {
      // User has the required permission, proceed to the next middleware/route handler
      next()
    } else {
      // User does not have the required permission, send a forbidden response
      res
        .status(403)
        .json({ message: 'You do not have permission to access this resource' })
    }
  }
}
