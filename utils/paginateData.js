module.exports = (page = 1, limit = 15, sortBy = 'id', sortOrder = 'desc') => {
  const skip = (page - 1) * limit
  const take = limit
  const pagination = {
    skip,
    take,
    orderBy: {
      [sortBy]: sortOrder,
    },
  }

  return pagination
}
