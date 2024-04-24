const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const toDate = require('date-fns/toDate')
const isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at localhost:3000')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBandServer()

const checkRequestQueries = async (request, response, next) => {
  const {search_q, priority, status, category, date} = request.query
  const {todoId} = request.params
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )

      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (error) {
      console.log(`Error: ${error.message}`)
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q

  next()
}

const checkRequestBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(new Date(formatedDate))

      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')
      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (error) {
      console.log(`Error: ${error.message}`)
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.todo = todo
  request.id = id

  next()
}

//Get ToDo Items
app.get('/todos/', checkRequestQueries, async (request, response) => {
  const {
    search_q = '',
    priority = '',
    status = '',
    category = '',
    date = '',
  } = request
  console.log(search_q, priority, status, category, date)
  const selectTodosQuery = `
  SELECT
  id, todo, priority, status, category,
  due_date AS dueDate
  FROM
  todo
  WHERE todo LIKE '%${search_q}%' 
  AND priority LIKE '%${priority}%'
  AND status LIKE '%${status}%'
  AND category LIKE '%${category}%' 
  `
  const todoItems = await db.all(selectTodosQuery)
  response.send(todoItems)
})

//Get Todo
app.get('/todos/:todoId/', checkRequestQueries, async (request, response) => {
  const {todoId} = request
  const selectTodoQuery = `
  SELECT
  id, todo, priority, status, category,
  due_date AS dueDate
  FROM
  todo
  WHERE
  id = ${todoId};
  `
  const todoItem = await db.get(selectTodoQuery)
  response.send(todoItem)
})

//Get Agenda
app.get('/agenda/', checkRequestQueries, async (request, response) => {
  const {date} = request
  console.log(date, 'a')
  const selectDateQuery = `
  SELECT 
  id,
  todo,
  priority,
  status,
  category,
  due_date AS dueDate
  FROM
  todo
  WHERE
  due_date = '${date}';
  `
  const todoItem = await db.all(selectDateQuery)

  if (todoItem === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(todoItem)
  }
})

//Add Todo
app.post('/todos/', checkRequestBody, async (request, response) => {
  const {id, todo, category, priority, status, dueDate} = request
  const addTodoQuery = `
  INSERT INTO
  todo (id, todo, category, priority, status, due_date)
  VALUES (
    ${id},
    '${todo}',
    '${category}',
    '${priority}',
    '${status}',
    '${dueDate}'
  );
  `
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

//Update Todo
app.put('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {todoId} = request
  const {status, priority, todo, category, dueDate} = request
  switch (true) {
    case status !== undefined:
      const updateStatusQuery = `
        UPDATE
        todo
        SET
        status = '${status}'
        WHERE
        id = ${todoId};
        `
      await db.run(updateStatusQuery)
      response.send('Status Updated')
      break
    case priority !== undefined:
      const updatePriorityQuery = `
        UPDATE
        todo
        SET
        priority = '${priority}'
        WHERE
        id = ${todoId};
        `
      await db.run(updatePriorityQuery)
      response.send('Priority Updated')
      break
    case todo !== undefined:
      const updateTodoQuery = `
        UPDATE
        todo
        SET
        todo = '${todo}'
        WHERE
        id = ${todoId};
        `
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case category !== undefined:
      const updateCategoryQuery = `
        UPDATE
        todo
        SET
        category = '${category}'
        WHERE
        id = ${todoId};
        `
      await db.run(updateCategoryQuery)
      response.send('Category Updated')
      break
    case dueDate !== undefined:
      const updateDueDateQuery = `
        UPDATE
        todo
        SET
        due_date = '${dueDate}'
        WHERE
        id = ${todoId};
        `
      await db.run(updateDueDateQuery)
      response.send('Due Date Updated')
      break
  }
})

//Delete Todo
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId}`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
