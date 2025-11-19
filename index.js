const express = require("express");
const path = require("path");
const { addTask } = require("./utils/createTaskUtil");

//finalise createTasUtil

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.post("/tasks", addTask);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
