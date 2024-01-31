module.exports = (filePath) => {
  const baseUrl = process.env.DOMAIN_NAME

  // Generate the direct link to the original file
  const fileUrl = `${baseUrl}/uploads/${filePath}`

  return fileUrl
}
