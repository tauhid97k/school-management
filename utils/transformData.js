const selectQueries = (obj, keys) => {
  const finalObj = {}
  // Map and set only defined keys
  keys.forEach((key) => {
    if (obj && Object.hasOwnProperty.call(obj, key)) {
      finalObj[key] = obj[key]
    }
  })

  return finalObj
}

const paginateFields = ['page', 'limit', 'sortBy', 'sortOrder']

const paginateWithSorting = (options) => {
  const page = Number(options.page || 1)
  const take = Number(options.limit || 15)
  const skip = (page - 1) * take
  const sortBy = options.sortBy || 'id'
  const sortOrder = options.sortOrder || 'desc'

  return {
    page,
    skip,
    take,
    orderBy: {
      [sortBy]: sortOrder,
    },
  }
}

module.exports = { selectQueries, paginateFields, paginateWithSorting }
