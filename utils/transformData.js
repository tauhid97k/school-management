const dayjs = require('dayjs')

const formatDate = (date) => {
  return dayjs(date).format('DD MMM YYYY')
}

module.exports = { formatDate }
