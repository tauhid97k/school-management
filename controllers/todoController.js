const prisma = require('../utils/prisma')
const createError = require('../utils/errorHandler')
const asyncHandler = require('express-async-handler')
const { todoValidator } = require('../validators/todoValidator')

/*
  @route    GET: /todos
  @access   private
  @desc     Get all todos
*/
const getTodos = asyncHandler(async (req, res, next) => {
  const todos = await prisma.todos.findMany()
  if (!todos.length) new createError(404, 'No todos found')
  res.json(todos)
})

/*
  @route    GET: /todos/id
  @access   private
  @desc     Get single todo
*/
const getTodo = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  const todo = await prisma.todos.findUnique({
    where: {
      id: Number(id),
    },
  })

  if (!todo) return res.status(404).json({ message: 'No todo found' })

  res.json(todo)
})

/*
  @route    POST: /todos
  @access   private
  @desc     Create a todo
*/
const createTodo = asyncHandler(async (req, res, next) => {
  const data = await todoValidator.validate(req.body, {
    abortEarly: false,
  })

  await prisma.todos.create({ data })

  res.status(201).json({ message: 'Todo created' })
})

const updateTodo = asyncHandler(async (req, res, next) => {
  const data = await todoValidator.validate(req.body, { abortEarly: false })

  const { id } = req.params

  await prisma.todos.update({
    where: {
      id: Number(id),
    },
    data,
  })

  res.json({ message: 'Todo updated' })
})

const deleteTodo = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  await prisma.todos.delete({
    where: {
      id: Number(id),
    },
  })

  res.json({ message: 'Todo Deleted' })
})

module.exports = { getTodos, getTodo, createTodo, updateTodo, deleteTodo }
