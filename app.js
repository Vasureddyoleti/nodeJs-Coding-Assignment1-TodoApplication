const { format, isValid } = require("date-fns");
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const priorityList = ["HIGH", "MEDIUM", "LOW"];
const statusList = ["TO DO", "IN PROGRESS", "DONE"];
const categoryList = ["WORK", "HOME", "LEARNING"];
const formattedDate = (dueDate) => {
  const newDate = format(new Date(dueDate), "yyyy-MM-dd");
  return newDate;
};
const convertDbObjectToResponseObject = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    category: eachTodo.category,
    priority: eachTodo.priority,
    status: eachTodo.status,
    dueDate: eachTodo.due_date,
  };
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return requestQuery.category !== undefined && requestQuery.prio !== undefined;
};
const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasTodo = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

const hasDueDate = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};
app.get("/todos/", async (request, response) => {
  const reqQuery = request.query;
  const { category, status, priority, search_q = "" } = reqQuery;

  let getTodo;
  if (hasStatus(reqQuery)) {
    if (statusList.includes(reqQuery.status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      getTodo = `SELECT * FROM todo WHERE status='${status}';`;
      const todoArr = await db.all(getTodo);
      response.send(
        todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    }
  } else if (hasPriority(reqQuery)) {
    if (priorityList.includes(reqQuery.priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      getTodo = `SELECT * FROM todo WHERE priority='${priority}';`;
      const todoArr = await db.all(getTodo);
      response.send(
        todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    }
  } else if (hasPriorityAndStatus(reqQuery)) {
    if (priorityList.includes(reqQuery.priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (statusList.includes(reqQuery.status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      getTodo = `SELECT * FROM todo WHERE priority='${priority}' AND status='${status}'`;
      const todoArr = await db.all(getTodo);
      response.send(
        todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    }
  } else if (hasSearch(reqQuery)) {
    getTodo = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
    const todoArr = await db.all(getTodo);
    response.send(
      todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  } else if (hasCategoryAndStatus(reqQuery)) {
    if (categoryList.includes(reqQuery.category) === false) {
      response.status(400);
      response.send("Invalid Todo category");
    } else if (statusList.includes(reqQuery.status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      getTodo = `SELECT * FROM todo WHERE status='${status}' AND category='${category}'`;
      const todoArr = await db.all(getTodo);
      response.send(
        todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    }
  } else if (hasCategory(reqQuery)) {
    if (categoryList.includes(reqQuery.category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      getTodo = `SELECT * FROM todo WHERE category='${category}'`;
      const todoArr = await db.all(getTodo);
      response.send(
        todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    }
  } else if (hasCategoryAndPriority(reqQuery)) {
    if (categoryList.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (priorityList.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      getTodo = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}'`;
      const todoArr = await db.all(getTodo);
      response.send(
        todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    }
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `SELECT * FROM todo WHERE id=${todoId}`;
  const todoItem = await db.get(getTodo);
  response.send(convertDbObjectToResponseObject(todoItem));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date))) {
    const getTodoByDate = `SELECT * FROM todo WHERE due_date='${formattedDate(
      date
    )}'`;
    const todoArr = await db.all(getTodoByDate);
    response.send(
      todoArr.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  if (priorityList.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categoryList.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (statusList.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const createNewTodoQuery = `INSERT INTO todo 
    (id,todo,priority,status,category,due_date) VALUES 
    (${id},'${todo}','${priority}','${status}','${category}','${formattedDate(
      dueDate
    )}');`;

    await db.run(createNewTodoQuery);

    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const reqQuery = request.body;

  const { category, status, priority, todo, dueDate } = reqQuery;

  let updateTodoQuery;

  if (hasStatus(reqQuery)) {
    if (statusList.includes(reqQuery.status)) {
      updateTodoQuery = `UPDATE todo SET 
      status = '${status}'  WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (hasCategory(reqQuery)) {
    if (categoryList.includes(reqQuery.category) !== false) {
      updateTodoQuery = `UPDATE todo SET 
      category = '${category}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (hasPriority(reqQuery)) {
    if (priorityList.includes(reqQuery.priority)) {
      updateTodoQuery = `UPDATE todo SET 
      priority = '${priority}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (hasTodo(reqQuery)) {
    updateTodoQuery = `UPDATE todo SET 
      todo = '${todo}' WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (hasDueDate(reqQuery)) {
    if (isValid(new Date(dueDate))) {
      updateTodoQuery = `UPDATE todo SET 
          due_date = '${formattedDate(dueDate)}' 
          WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
