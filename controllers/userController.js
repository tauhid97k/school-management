const asyncHandler = require('express-async-handler')

/*
  @route    GET: /user
  @access   private
  @desc     Auth user
*/
const getUser = asyncHandler(async (req, res, next) => {
  res.json(req.user)
})

module.exports = {
  getUser,
}
