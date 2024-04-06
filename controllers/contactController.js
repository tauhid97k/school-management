const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const { contactValidator } = require('../validators/contactValidator')

/*
  @route    GET: /contact
  @access   public
  @desc     Get contact
*/
const getContact = asyncHandler(async (req, res, next) => {
  const contact = await prisma.contact.findFirst()

  res.json(contact)
})

/*
  @route    POST: /contact
  @access   private
  @desc     Create contact
*/
const createOrUpdateContact = asyncHandler(async (req, res, next) => {
  const data = await contactValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check if contact already exist
  await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.findFirst()

    await tx.contact.upsert({
      where: {
        id: contact.id,
      },
      update: data,
      create: data,
    })

    res.json({
      message: 'Contact saved',
    })
  })
})

/*
  @route    DELETE: /contact
  @access   private
  @desc     Delete contact
*/
const deleteContact = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findContact = await tx.contact.findUnique({
      where: {
        id,
      },
    })

    if (!findContact)
      return res.status(404).json({
        message: 'No section',
      })

    await tx.contact.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'contact deleted',
    })
  })
})

module.exports = {
  getContact,
  createOrUpdateContact,
  deleteContact,
}
