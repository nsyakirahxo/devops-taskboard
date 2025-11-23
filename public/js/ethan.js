(function () {
  var API_URL = "/tasks";
  var editBtn = document.getElementById("editTaskActionBtn");
  var editForm = document.getElementById("editTaskForm");
  var detailSection = document.getElementById("taskDetailSection");
  var viewModal = document.getElementById("viewTaskModal");
  var tagContainer = document.getElementById("editTagInputContainer");
  var tagInput = document.getElementById("editTagsInput");
  var isEditing = false;

  document.addEventListener("DOMContentLoaded", function () {
    if (editBtn) {
      editBtn.addEventListener("click", handleEditClick);
    }
    if (editForm) {
      editForm.addEventListener("submit", handleSubmit);
    }
    if (tagInput) {
      tagInput.addEventListener("keydown", handleTagKeydown);
    }
    if (tagContainer && tagInput) {
      tagContainer.addEventListener("click", function (event) {
        if (event.target === tagContainer) {
          tagInput.focus();
        }
      });
    }
  });

  window.prepareEditForm = function (task) {
    if (!editForm) {
      return;
    }
    editForm.title.value = task.title || "";
    editForm.description.value = task.description || "";
    editForm.priority.value = (task.priority || "medium").toLowerCase();
    editForm.status.value = (task.status || "pending").toLowerCase();
    editForm.dueDate.value = TaskHelpers.formatDateForInput(task.dueDate);
    TaskState.editTags = Array.isArray(task.tags) ? task.tags.slice() : [];
    renderEditTags();
    setEditMode(false);
  };

  window.exitEditMode = function () {
    setEditMode(false);
  };

  function handleEditClick(event) {
    event.preventDefault();
    if (!TaskState.selectedTask || !editForm) {
      return;
    }
    if (!isEditing) {
      setEditMode(true);
      editForm.title.focus();
    } else {
      editForm.requestSubmit();
    }
  }

  function setEditMode(value) {
    isEditing = Boolean(value);
    if (editForm) {
      editForm.style.display = isEditing ? "block" : "none";
    }
    if (detailSection) {
      detailSection.style.display = isEditing ? "none" : "";
    }
    if (editBtn) {
      editBtn.textContent = isEditing ? "Save Changes" : "Edit Task";
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!TaskState.selectedTask) {
      return;
    }
    var payload = {
      title: (editForm.title.value || "").trim(),
      description: (editForm.description.value || "").trim(),
      priority: (editForm.priority.value || "medium").toLowerCase(),
      status: (editForm.status.value || "pending").toLowerCase(),
      dueDate: editForm.dueDate.value,
      tags: TaskState.editTags.slice(),
    };

    var validation = validatePayload(payload);
    if (!validation.valid) {
      alert(validation.message);
      if (validation.field && typeof validation.field.focus === "function") {
        validation.field.focus();
      }
      return;
    }

    var request = new XMLHttpRequest();
    request.open("PUT", API_URL + "/" + TaskState.selectedTask.id, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.onload = function () {
      var response = parseResponse(request.responseText);
      if (request.status === 200) {
        alert(response.message || "Task updated!");
        setEditMode(false);
        if (typeof window.viewTasks === "function") {
          window.viewTasks();
        }
        if (typeof window.viewTask === "function") {
          window.viewTask(TaskState.selectedTask.id);
        }
      } else {
        alert(response.message || "Failed to update task.");
      }
    };
    request.onerror = function () {
      alert("Failed to update task.");
    };
    request.send(JSON.stringify(payload));
  }

  function validatePayload(payload) {
    if (!payload.title) {
      return { valid: false, message: "Title is required", field: editForm.title };
    }
    if (payload.title.length < 3) {
      return { valid: false, message: "Title must be at least 3 characters", field: editForm.title };
    }
    if (payload.title.length > 100) {
      return { valid: false, message: "Title must not exceed 100 characters", field: editForm.title };
    }
    if (payload.description && payload.description.length > 500) {
      return { valid: false, message: "Description must not exceed 500 characters", field: editForm.description };
    }
    var validPriorities = ["low", "medium", "high"];
    if (validPriorities.indexOf(payload.priority) === -1) {
      return { valid: false, message: "Select a valid priority", field: editForm.priority };
    }
    var validStatuses = ["pending", "in-progress", "completed"];
    if (validStatuses.indexOf(payload.status) === -1) {
      return { valid: false, message: "Select a valid status", field: editForm.status };
    }
    if (!payload.dueDate) {
      return { valid: false, message: "Due date is required", field: editForm.dueDate };
    }
    var dueDate = new Date(payload.dueDate);
    if (isNaN(dueDate.getTime())) {
      return { valid: false, message: "Due date is invalid", field: editForm.dueDate };
    }
    if (!payload.tags.length) {
      return { valid: false, message: "Please add at least one tag", field: tagInput };
    }
    if (payload.tags.length > 10) {
      return { valid: false, message: "Maximum 10 tags allowed", field: tagInput };
    }
    for (var i = 0; i < payload.tags.length; i += 1) {
      var tag = payload.tags[i];
      if (tag.length < 2 || tag.length > 20) {
        return { valid: false, message: "Tags must be 2-20 characters", field: tagInput };
      }
    }
    return { valid: true };
  }

  function handleTagKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      var value = tagInput.value.trim();
      if (value && TaskState.editTags.indexOf(value) === -1) {
        TaskState.editTags.push(value);
        renderEditTags();
      }
      tagInput.value = "";
    } else if (event.key === "Backspace" && !tagInput.value) {
      TaskState.editTags.pop();
      renderEditTags();
    }
  }

  function renderEditTags() {
    if (!tagContainer || !tagInput) {
      return;
    }
    Array.from(tagContainer.querySelectorAll(".tag-pill")).forEach(function (pill) {
      pill.remove();
    });
    TaskState.editTags.forEach(function (tag, index) {
      var pill = document.createElement("div");
      pill.className = "tag-pill";
      var color = TaskHelpers.getTagColor(tag);
      pill.style.backgroundColor = color.bg;
      pill.style.color = color.text;
      pill.style.borderColor = color.border;
      var textSpan = document.createElement("span");
      textSpan.textContent = tag;
      var removeSpan = document.createElement("span");
      removeSpan.className = "tag-remove";
      removeSpan.textContent = "\u00d7";
      removeSpan.addEventListener("click", function (event) {
        event.stopPropagation();
        TaskState.editTags.splice(index, 1);
        renderEditTags();
      });
      pill.appendChild(textSpan);
      pill.appendChild(removeSpan);
      tagContainer.insertBefore(pill, tagInput);
    });
  }

  function parseResponse(text) {
    try {
      return text ? JSON.parse(text) : {};
    } catch (error) {
      return {};
    }
  }
})();
