const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDBObjectToResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  }
}

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let getTodoQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `SELECT 
        * 
      FROM 
          todo
      wHERE
          todo LIKE '%${search_q}%'
      AND priority='${priority}'
      AND status='${status}';`
      break
    case hasPriorityProperty(request.query):
      getTodoQuery = `SELECT 
        * 
      FROM 
          todo
      wHERE
          todo LIKE '%${search_q}%'
      AND priority='${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodoQuery = `SELECT 
        * 
      FROM 
          todo
      wHERE
          todo LIKE '%${search_q}%'
      AND status='${status}';`
      break
    default:
      getTodoQuery = `SELECT 
        * 
      FROM 
          todo
      wHERE
          todo LIKE '%${search_q}%';`
      break
  }
  const getTodo = await db.all(getTodoQuery)
  response.send(
    getTodo.map(eachTodo => convertDBObjectToResponseObject(eachTodo)),
  )
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        id=${todoId}`
  const getTodo = await db.get(getTodoQuery)
  response.send(convertDBObjectToResponseObject(getTodo))
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const addTodoQuery = `
      INSERT INTO todo(id,todo,priority,status)
      VALUES (${id},'${todo}','${priority}','${status}');`
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body

  let updateResult = ''

  switch (true) {
    case requestBody.status !== undefined:
      updateResult = 'Status'
      break
    case requestBody.priority !== undefined:
      updateResult = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateResult = 'Todo'
      break
  }
  const previousTodoQuery = `
  SELECT * FROM todo
    WHERE id=${todoId};`

  console.log(previousTodoQuery)
  const previousTodo = await db.get(previousTodoQuery)
  console.log(previousTodo)
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body

  const updateTodoQuery = `
  UPDATE todo
  SET 
    todo='${todo}',
    priority='${priority}',
    status='${status}'
  WHERE
    id=${todoId};
    `
  await db.run(updateTodoQuery)
  response.send(`${updateResult} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id=${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
