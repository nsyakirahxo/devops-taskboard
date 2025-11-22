const express = require("express");
const path = require("path");

const { editTask } = require("./utils/updateUtils");

const { addTask } = require("./utils/createTaskUtil");

const { getAllTasks, getTaskById } = require("./utils/getTasksUtil");

const { deletedTask } = require("./utils/DeleteTaskUtil");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/tasks", getAllTasks);
app.get("/tasks/:id", getTaskById);
app.post("/tasks", addTask);
app.put("/tasks/:id", editTask);
app.delete("/tasks/:id", deletedTask);

app.use(express.static(path.join(__dirname, "public")));

console.log("Attempting to listen on port " + PORT);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
