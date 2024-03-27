const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  todoValidator,
  todoStatusValidator,
} = require('../validators/todoValidator')

/*
  @route    GET: /todos
  @access   private
  @desc     Get all todos
*/
const getTodos = asyncHandler(async (req, res, next) => {
  const userId = req.user.id
  const role = req.user.role

  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  // User role based query
  let WhereCondition = {}
  if (role === 'admin') {
    WhereCondition = {
      admin_id: userId,
    }
  } else if (role === 'teacher') {
    WhereCondition = {
      teacher_id: userId,
    }
  } else if (role === 'student') {
    WhereCondition = {
      student_id: userId,
    }
  }

  const [todos, total] = await prisma.$transaction([
    prisma.todo_list.findMany({
      where: WhereCondition,
      take,
      skip,
      orderBy,
    }),
    prisma.todo_list.count({
      where: WhereCondition,
    }),
  ])

  res.json({
    data: todos,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /todos/:id
  @access   private
  @desc     Get todo details
*/
const getTodo = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findTodo = await prisma.todo_list.findUnique({
    where: {
      id,
    },
  })

  if (!findTodo) {
    return res.status(404).json({ message: 'Todo not found' })
  }

  res.json(findTodo)
})

/*
  @route    POST: /todos
  @access   private
  @desc     Create todo
*/
const createTodo = asyncHandler(async (req, res, next) => {
  const data = await todoValidator().validate(req.body, { abortEarly: false })

  const role = data.role

  // User role based query
  let finalData
  if (role === 'admin') {
    finalData = {
      admin_id: data.user_id,
      role,
      title: data.title,
      description: data.description,
    }
  } else if (role === 'teacher') {
    finalData = {
      teacher_id: data.user_id,
      role,
      title: data.title,
      description: data.description,
    }
  } else if (role === 'student') {
    finalData = {
      student_id: data.user_id,
      role,
      title: data.title,
      description: data.description,
    }
  }

  await prisma.todo_list.create({
    data: finalData,
  })

  res.json({
    message: 'Todo created',
  })
})

/*
  @route    PUT: /todos/:id
  @access   private
  @desc     Update todo
*/
const updateTodo = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const role = req.user.role
  const userId = req.user.id

  const data = await todoValidator(id).validate(req.body, { abortEarly: false })

  // Check Authorization
  if (role !== data.role || userId !== data.user_id) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  await prisma.$transaction(async (tx) => {
    const findTodo = await tx.todo_list.findUnique({
      where: {
        id,
      },
    })

    if (!findTodo) {
      return res.status(404).json({ message: 'Todo not found' })
    }

    await tx.todo_list.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        description: data.description,
        is_completed: data.is_completed,
      },
    })

    res.json({
      message: 'Todo updated',
    })
  })
})

/*
  @route    DELETE: /todos
  @access   private
  @desc     Delete Todo
*/
const deleteTodo = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const todoToDelete = await prisma.todo_list.delete({
    where: {
      id,
    },
  })

  if (!todoToDelete) {
    return res.status(404).json({ message: 'Todo not found' })
  }

  res.json({
    message: 'Todo deleted',
  })
})

/*
  @route    PATCH: /todos
  @access   private
  @desc     Update Todo Status (is_completed)
*/
const updateTodoStatus = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await todoStatusValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findTodo = await tx.todo_list.findUnique({
      where: {
        id,
      },
    })

    if (!findTodo) {
      return res.status(404).json({ message: 'Todo not found' })
    }

    await tx.todo_list.update({
      where: {
        id,
      },
      data: {
        is_completed: data.is_completed,
      },
    })

    res.json({
      message: 'Todo status updated',
    })
  })
})

module.exports = {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
}
