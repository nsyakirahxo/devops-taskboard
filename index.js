const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log("server running on http://localhost:" + PORT);
});
