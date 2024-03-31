const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  chairmanSectionValidator,
  chairmanSectionImageValidator,
} = require('../validators/chairmanSectionValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /chairman-section
  @access   private
  @desc     Get chairman section
*/
const getChairmanSection = asyncHandler(async (req, res, next) => {
  const chairmanSection = await prisma.chairman_section.findFirst()

  chairmanSection.image = chairmanSection.image
    ? generateFileLink(`website/chairman/${chairmanSection.image}`)
    : null

  res.json(chairmanSection)
})

/*
  @route    POST: /chairman-section
  @access   private
  @desc     Create chairman section
*/
const createChairmanSection = asyncHandler(async (req, res, next) => {
  const data = await chairmanSectionValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check if chairman section already exist
  await prisma.$transaction(async (tx) => {
    const checkChairmanSection = await tx.chairman_text.count()
    if (checkChairmanSection > 0)
      return res.status(400).json({
        message: 'Chairman section already exist',
      })

    if (req.files) {
      const { image } = await chairmanSectionImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Profile Img
      const uniqueFolder = `chairman_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/chairman/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving Banner',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.chairman_text.create({
      data,
    })

    res.json({
      message: 'Chairman section created',
    })
  })
})

/*
  @route    PUT: /chairman-section/:id
  @access   private
  @desc     Update chairman section
*/
const updateChairmanSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await chairmanSectionValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findChairmanSection = await tx.chairman_text.findUnique({
      where: {
        id,
      },
    })

    if (!findChairmanSection)
      return res.status(404).json({
        message: 'No chairman section found',
      })

    if (req.files) {
      const { image } = await chairmanSectionImageValidator().validate(
        req.files,
        {
          abortEarly: false,
        }
      )

      // Delete Previous Image (If Exist)
      if (findChairmanSection.image) {
        try {
          const photoDir = `uploads/website/chairman/${
            findChairmanSection.image.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous image',
          })
        }
      }

      // New Image
      const uniqueFolder = `chairman_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/chairman/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving image',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.chairman_text.update({
      where: { id: findChairmanSection.id },
      data,
    })

    res.json({
      message: 'Chairman section updated',
    })
  })
})

/*
  @route    DELETE: /chairman-section
  @access   private
  @desc     Delete chairman section
*/
const deleteChairmanSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findChairmanSection = await tx.chairman_section.findUnique({
      where: {
        id,
      },
    })

    if (!findChairmanSection)
      return res.status(404).json({
        message: 'No chairman section found',
      })

    // Delete Image (If Exist)
    if (findChairmanSection.image) {
      try {
        const photoDir = `uploads/website/chairman/${
          findChairmanSection.image.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting image',
        })
      }
    }

    await tx.chairman_section.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Chairman section deleted',
    })
  })
})

module.exports = {
  getChairmanSection,
  createChairmanSection,
  updateChairmanSection,
  deleteChairmanSection,
}
