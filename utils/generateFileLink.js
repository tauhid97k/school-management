module.exports = (filePath) => {
  const domain = process.env.DOMAIN_NAME || 'http://localhost:5000'

  // Construct the full file URL
  return `${domain}/uploads/${filePath}`
}
