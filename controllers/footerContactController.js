const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  footerContactValidator,
} = require('../validators/footerContactValidator')

/*
  @route    GET: /footer-contact
  @access   public
  @desc     Get footer contact
*/
const getFooterContact = asyncHandler(async (req, res, next) => {
  const contact = await prisma.footer_contact.findFirst()

  res.json(contact)
})

/*
  @route    POST: /footer-contact
  @access   private
  @desc     Create contact
*/
const createOrUpdateFooterContact = asyncHandler(async (req, res, next) => {
  const data = await footerContactValidator().validate(req.body, {
    abortEarly: false,
  })

  // Create or update about
  await prisma.$transaction(async (tx) => {
    const findContact = await tx.footer_contact.findFirst()

    if (findContact) {
      await tx.footer_contact.update({
        where: {
          id: findContact.id,
        },
        data,
      })

      return res.json({
        message: 'Saved',
      })
    } else {
      await tx.footer_contact.create({
        data,
      })

      res.json({
        message: 'Saved',
      })
    }
  })
})

/*
  @route    DELETE: /footer-contact
  @access   private
  @desc     Delete contact
*/
const deleteFooterContact = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findContact = await tx.footer_contact.findUnique({
      where: {
        id,
      },
    })

    if (!findContact)
      return res.status(404).json({
        message: 'No section',
      })

    await tx.footer_contact.delete({
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
  getFooterContact,
  createOrUpdateFooterContact,
  deleteFooterContact,
}
