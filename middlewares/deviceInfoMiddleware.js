const DeviceDetector = require('node-device-detector')
const ClientHints = require('node-device-detector/client-hints')

const deviceDetector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
})
const clientHints = new ClientHints()

module.exports = (req, res, next) => {
  const userAgent = req.headers['user-agent']
  const clientHintsData = clientHints.parse(res.headers)

  req.device = deviceDetector.detect(userAgent, clientHintsData)
  next()
}
