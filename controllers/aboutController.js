const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const { aboutValidator } = require('../validators/aboutValidator')

/*
  @route    GET: /about
  @access   public
  @desc     Get about
*/
const getAbout = asyncHandler(async (req, res, next) => {
  const about = await prisma.about.findFirst()

  res.json(about)
})

/*
  @route    POST: /about
  @access   private
  @desc     Create about
*/
const createOrUpdateAbout = asyncHandler(async (req, res, next) => {
  const data = await aboutValidator().validate(req.body, {
    abortEarly: false,
  })

  // Create or update about
  await prisma.$transaction(async (tx) => {
    const findAbout = await tx.about.findFirst()

    if (findAbout) {
      await tx.about.update({
        where: {
          id: findAbout.id,
        },
        data,
      })

      return res.json({
        message: 'Saved',
      })
    } else {
      await tx.about.create({
        data,
      })

      res.json({
        message: 'Saved',
      })
    }
  })
})

/*
  @route    DELETE: /about
  @access   private
  @desc     Delete about
*/
const deleteAbout = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findAbout = await tx.about.findUnique({
      where: {
        id,
      },
    })

    if (!findAbout)
      return res.status(404).json({
        message: 'Not found',
      })

    await tx.about.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Deleted',
    })
  })
})

module.exports = {
  getAbout,
  createOrUpdateAbout,
  deleteAbout,
}
