function addTask() {
  var response = "";
  var jsonData = new Object();
  jsonData.title = document.getElementById("title").value;
  jsonData.description = document.getElementById("description").value;
  jsonData.priority = document.getElementById("priority").value;
  jsonData.dueDate = document.getElementById("dueDate").value;
  jsonData.tags = document.getElementById("tags").value;
  if (
    jsonData.title == "" ||
    jsonData.description == "" ||
    jsonData.priority == "" ||
    jsonData.dueDate == ""
  ) {
    alert("All fields are required!");
    return;
  }
  var request = new XMLHttpRequest();
  request.open("POST", "/tasks", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.onload = function () {
    response = JSON.parse(request.responseText);
    console.log(response);
    if (response.message == undefined) {
      alert("Added Task: " + jsonData.title + "!");
      document.getElementById("title").value = "";
      document.getElementById("description").value = "";
      document.getElementById("priority").value = "";
      document.getElementById("dueDate").value = "";
      document.getElementById("tags").value = "";
      $("#taskModal").modal("hide");
    } else {
      alert("Unable to add task!");
    }
  };
  request.send(JSON.stringify(jsonData));
}
