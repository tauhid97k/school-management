const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
} = require('../controllers/todoController')

router.get('/', authMiddleware(), getTodos)
router.get('/:id', authMiddleware(), getTodo)
router.post('/', authMiddleware(), createTodo)
router.put('/:id', authMiddleware(), updateTodo)
router.patch('/:id/status', authMiddleware(), updateTodoStatus)
router.delete('/:id', authMiddleware(), deleteTodo)

module.exports = router
