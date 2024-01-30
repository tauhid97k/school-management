const path = require('node:path')

module.exports = (filePath) => {
  const baseUrl = process.env.DOMAIN_NAME

  // Generate the direct link to the original file
  const fileUrl = path.join(baseUrl, filePath)

  return fileUrl
}
