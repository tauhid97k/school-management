// Select only given keys from query string
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

// Pagination and sorting functionalities
const paginateWithSorting = (options) => {
  const page = Number(options.page <= 0 ? 1 : options.page || 1)
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

// Pagination and sorting keys (Common)
const commonFields = ['search', 'page', 'limit', 'sortBy', 'sortOrder']

// Attendance Fields
const attendanceFields = ['date', 'page', 'limit', 'sortBy', 'sortOrder']

// Noticeboard Fields
const noticeFields = ['type', 'page', 'limit', 'sortBy', 'sortOrder']

module.exports = {
  selectQueries,
  paginateWithSorting,
  commonFields,
  attendanceFields,
  noticeFields,
}
