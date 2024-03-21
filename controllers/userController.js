const asyncHandler = require('express-async-handler')

/*
  @route    GET: /user
  @access   private
  @desc     Auth user
*/
const getUser = asyncHandler(async (req, res, next) => {
  res.json(req.user)
})

/*
  @route    PUT: /user/:id
  @access   private
  @desc     Update user profile
*/
const updateUser = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await userValidator(id).validate(req.body, {
    abortEarly: false,
  })
})

module.exports = {
  getUser,
  updateUser,
}
