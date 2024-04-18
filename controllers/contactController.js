const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const { contactValidator } = require('../validators/contactValidator')
const emailEventEmitter = require('../event/sendEmailEvent')

/*
  @route    POST: /contact
  @access   private
  @desc     Contact via school email
*/
const contact = asyncHandler(async (req, res, next) => {
  const data = await contactValidator().validate(req.body, {
    abortEarly: false,
  })

  // Save to database
  await prisma.contact.create({
    data,
  })

  // Send email to school
  emailEventEmitter.emit('contactEmail', {
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    message: data.message,
  })

  res.json({
    message: 'Thank you for contacting us, We will get in touch shortly',
  })
})

module.exports = { contact }
