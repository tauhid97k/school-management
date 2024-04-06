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
const createContact = asyncHandler(async (req, res, next) => {
  const data = await contactValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check if contact already exist
  await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.count()
    if (contact > 0)
      return res.status(400).json({
        message: 'Contact already exist',
      })

    await tx.contact.create({
      data,
    })

    res.json({
      message: 'contact added',
    })
  })
})

/*
  @route    PUT: /contact
  @access   private
  @desc     Update contact
*/
const updateContact = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await contactValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findContact = await tx.contact.findUnique({
      where: {
        id,
      },
    })

    if (!findContact)
      return res.status(404).json({
        message: 'No contact found',
      })

    await tx.contact.update({
      where: { id: findContact.id },
      data,
    })

    res.json({
      message: 'Contact updated',
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
  createContact,
  updateContact,
  deleteContact,
}
