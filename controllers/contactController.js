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

  // Create or update about
  await prisma.$transaction(async (tx) => {
    const findContact = await tx.contact.findFirst()

    if (findContact) {
      await tx.contact.update({
        where: {
          id: findContact.id,
        },
        data,
      })

      return res.json({
        message: 'Saved',
      })
    } else {
      await tx.contact.create({
        data,
      })

      res.json({
        message: 'Saved',
      })
    }
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
