const express = require('express')
const router = express.Router()
const {
  getTest,
  createTest,
  updateTest,
  deleteTest,
} = require('../controllers/testController')

router.get('/get', getTest)
router.post('/create', createTest)
router.put('/update', updateTest)
router.delete('/delete', deleteTest)

module.exports = router
