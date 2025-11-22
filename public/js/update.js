function editTask(data) {
  var selectedTask = JSON.parse(data);

  document.getElementById("editTitle").value = selectedTask.title;
  document.getElementById("editDescription").value = selectedTask.description;
  document.getElementById("editPriority").value = selectedTask.priority;
  document.getElementById("editDueDate").value = selectedTask.dueDate;
  document.getElementById("editTags").value = selectedTask.tags;
  document.getElementById("editStatus").value = selectedTask.status;

  document
    .getElementById("updateButton")
    .setAttribute("onclick", 'updateTask("' + selectedTask.id + '")');
  $("#editTaskModal").modal("show");
}

function updateTask(id) {
  var response = "";

  var jsonData = {
    title: document.getElementById("editTitle").value,
    description: document.getElementById("editDescription").value,
    priority: document.getElementById("editPriority").value,
    dueDate: document.getElementById("editDueDate").value,
    tags: document.getElementById("editTags").value,
    status: document.getElementById("editStatus").value,
  };

  if (
    jsonData.title == "" ||
    jsonData.description == "" ||
    jsonData.priority == "" ||
    jsonData.dueDate == "" ||
    jsonData.tags == "" ||
    jsonData.status == ""
  ) {
    alert("All fields are required!");
    return;
  }

  var request = new XMLHttpRequest();
  request.open("PUT", "/edit-task/" + id, true);
  request.setRequestHeader("Content-Type", "application/json");

  request.onload = function () {
    response = JSON.parse(request.responseText);

    if (response.message == "Task updated successfully!") {
      alert("Edited Task: " + jsonData.title + "!");
      $("#editTaskModal").modal("hide");
      viewTasks();
    } else {
      alert("Unable to edit task!");
    }
  };

  request.send(JSON.stringify(jsonData));
}
