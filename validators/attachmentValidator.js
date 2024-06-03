const yup = require("yup")

const attachmentValidator = () =>
  yup.object({
    attachment: yup
      .mixed()
      .test(
        "type",
        "Invalid file type. Only image or pdf is allowed",
        (file) => {
          const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/pdf",
          ]
          return allowedTypes.includes(file.mimetype)
        }
      )
      .test("size", "File size is too large; max 10mb is allowed", (file) => {
        const maxSize = 10 * 1024 * 1024
        return file.size <= maxSize
      }),
  })

module.exports = { attachmentValidator }
