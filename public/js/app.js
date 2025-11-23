const API_URL = "/tasks";

// DOM Elements
const els = {
  createBtn: document.getElementById("createTaskBtn"),
  createModal: document.getElementById("createTaskModal"),
  viewModal: document.getElementById("viewTaskModal"),
  createForm: document.getElementById("createTaskForm"),
  tasksList: document.getElementById("tasksList"),
  emptyState: document.getElementById("emptyState"),
  tagContainer: document.getElementById("tagInputContainer"),
  tagInput: document.getElementById("taskTagsInput"),
  taskDetails: document.getElementById("taskDetails"),
  editBtn: document.getElementById("editTaskActionBtn"),
  closeDetailsBtn: document.getElementById("closeDetailsBtn"),
  deleteBtn: document.getElementById("deleteTaskBtn"),
  stats: {
    total: document.getElementById("totalTasks"),
    completed: document.getElementById("completedTasks"),
    pending: document.getElementById("pendingTasks"),
  },
};

let state = {
  tasks: [],
  tags: [],
  editTags: [],
  currentTask: null,
  isEditing: false,
  editRefs: null,
};

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  setupListeners();
  document.getElementById("taskDueDate").min = new Date()
    .toISOString()
    .split("T")[0];
});

function setupListeners() {
  // Modals
  const toggleModal = (modal, show) => {
    modal.classList.toggle("active", show);
    document.body.style.overflow = show ? "hidden" : "";
    if (!show && modal === els.createModal) {
      els.createForm.reset();
      state.tags = [];
      renderTags();
    }
  };

  els.createBtn.onclick = () => toggleModal(els.createModal, true);

  document
    .querySelectorAll(".modal-close, .btn-secondary, .modal-overlay")
    .forEach((el) => {
      el.onclick = (e) => {
        if (e.target === el) toggleModal(el.closest(".modal"), false);
      };
    });

  // Form
  els.createForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(els.createForm));
    data.tags = state.tags;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      await loadTasks();
      toggleModal(els.createModal, false);
      alert("Task created!");
    } catch (err) {
      alert("Failed to create task");
    }
  };

  // Tags
  els.tagInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = els.tagInput.value.trim();
      if (val && !state.tags.includes(val)) {
        state.tags.push(val);
        renderTags();
        els.tagInput.value = "";
      }
    } else if (
      e.key === "Backspace" &&
      !els.tagInput.value &&
      state.tags.length
    ) {
      state.tags.pop();
      renderTags();
    }
  };

  els.tagContainer.onclick = (e) => {
    if (e.target === els.tagContainer) els.tagInput.focus();
  };

  if (els.editBtn) {
    els.editBtn.onclick = () => {
      if (!state.currentTask || !state.editRefs || !state.editRefs.form) return;
      if (!state.isEditing) {
        setEditMode(true);
        if (state.editRefs.title) {
          state.editRefs.title.focus();
        }
      } else {
        state.editRefs.form.requestSubmit();
      }
    };
  }

  if (els.closeDetailsBtn) {
    els.closeDetailsBtn.onclick = (e) => {
      e.preventDefault();
      resetViewState();
      toggleModal(els.viewModal, false);
    };
  }

  const viewCloseIcon = els.viewModal
    ? els.viewModal.querySelector(".modal-close")
    : null;
  if (viewCloseIcon) {
    viewCloseIcon.onclick = (e) => {
      e.preventDefault();
      resetViewState();
      toggleModal(els.viewModal, false);
    };
  }

  const viewOverlay = els.viewModal
    ? els.viewModal.querySelector(".modal-overlay")
    : null;
  if (viewOverlay) {
    viewOverlay.onclick = (e) => {
      if (e.target === viewOverlay) {
        resetViewState();
        toggleModal(els.viewModal, false);
      }
    };
  }
}

function renderTags() {
  els.tagContainer.querySelectorAll(".tag-pill").forEach((el) => el.remove());
  state.tags.forEach((tag, i) => {
    const pill = document.createElement("div");
    pill.className = "tag-pill";
    const color = getTagColor(tag);
    Object.assign(pill.style, {
      backgroundColor: color.bg,
      color: color.text,
      borderColor: color.border,
    });
    pill.innerHTML = `<span>${esc(
      tag
    )}</span><span class="tag-remove" onclick="removeTag(${i})">&times;</span>`;
    els.tagContainer.insertBefore(pill, els.tagInput);
  });
}

window.removeTag = (i) => {
  state.tags.splice(i, 1);
  renderTags();
};

async function loadTasks() {
  try {
    const res = await fetch(API_URL);
    state.tasks = await res.json();
    renderTasks();
    updateStats();
  } catch (err) {
    console.error(err);
  }
}

function renderTasks() {
  if (!state.tasks.length) {
    els.tasksList.innerHTML = "";
    els.emptyState.style.display = "block";
    return;
  }

  els.emptyState.style.display = "none";
  els.tasksList.innerHTML = state.tasks
    .map(
      (t) => `
    <div class="task-card priority-${
      t.priority || "medium"
    }" onclick="viewTask('${t.id}')">
      <div class="task-header">
        <h3 class="task-title">${esc(t.title)}</h3>
        <span class="task-priority ${t.priority || "medium"}">${
        t.priority || "medium"
      }</span>
      </div>
      <p class="task-description">${esc(t.description || "")}</p>
      <div class="task-meta">
        <span class="task-date">Due: ${
          t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"
        }</span>
      </div>
      <div class="task-tags">
        ${(t.tags || [])
          .map((tag) => {
            const c = getTagColor(tag);
            return `<span class="task-tag" style="background-color:${
              c.bg
            };color:${c.text};border-color:${c.border}">${esc(tag)}</span>`;
          })
          .join("")}
      </div>
    </div>
  `
    )
    .join("");
}

window.viewTask = async (id) => {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error();
    const task = await res.json();

    state.currentTask = task;
    state.editTags = [...(task.tags || [])];
    state.isEditing = false;
    state.editRefs = null;

    if (els.taskDetails) {
      els.taskDetails.innerHTML = buildTaskDetailsMarkup(task);
      setupEditForm(task);
      setEditMode(false);
    }

    setupDeleteHandler(id);

    els.viewModal.classList.add("active");
  } catch (err) {
    console.error(err);
    alert("Failed to load task");
  }
};

function buildTaskDetailsMarkup(task) {
  const statusLabel = formatStatusLabel(task.status || "pending");
  const tags = task.tags || [];
  return `
    <div class="detail-grid" id="taskDetailView">
      <div class="detail-item">
        <label>Title</label>
        <div>${esc(task.title)}</div>
      </div>
      <div class="detail-item">
        <label>Priority</label>
        <span class="task-priority ${task.priority || "medium"}">${
    task.priority || "medium"
  }</span>
      </div>
      <div class="detail-item">
        <label>Status</label>
        <div>${esc(statusLabel)}</div>
      </div>
      <div class="detail-item full-width">
        <label>Description</label>
        <div>${esc(task.description || "-")}</div>
      </div>
      <div class="detail-item">
        <label>Due Date</label>
        <div>${
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"
        }</div>
      </div>
      <div class="detail-item">
        <label>Created</label>
        <div>${
          task.createdAt ? new Date(task.createdAt).toLocaleString() : "-"
        }</div>
      </div>
      ${
        tags.length
          ? `
        <div class="detail-item full-width">
          <label>Tags</label>
          <div class="task-tags">
            ${tags
              .map((tag) => {
                const c = getTagColor(tag);
                return `<span class="task-tag" style="background-color:${
                  c.bg
                };color:${c.text};border-color:${c.border}">${esc(tag)}</span>`;
              })
              .join("")}
          </div>
        </div>
      `
          : ""
      }
    </div>
    <form id="editTaskForm" class="task-details edit-task-form" style="display:none">
      <div class="form-group">
        <label for="editTitle">Title <span class="required">*</span></label>
        <input type="text" id="editTitle" name="title" placeholder="Enter task title" required />
      </div>
      <div class="form-group">
        <label for="editDescription">Description</label>
        <textarea id="editDescription" name="description" rows="4" placeholder="Enter task description"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="editPriority">Priority</label>
          <select id="editPriority" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-group">
          <label for="editStatus">Status</label>
          <select id="editStatus" name="status">
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="editDueDate">Due Date</label>
        <input type="date" id="editDueDate" name="dueDate" />
      </div>
      <div class="form-group">
        <label for="editTagsInput">Tags</label>
        <div class="tag-input-container" id="editTagInputContainer">
          <input type="text" id="editTagsInput" placeholder="Type tag & press Enter" />
        </div>
      </div>
    </form>
  `;
}

function setupEditForm(task) {
  const form = document.getElementById("editTaskForm");
  if (!form) return;

  state.editRefs = {
    form,
    title: document.getElementById("editTitle"),
    description: document.getElementById("editDescription"),
    priority: document.getElementById("editPriority"),
    status: document.getElementById("editStatus"),
    dueDate: document.getElementById("editDueDate"),
    tagContainer: document.getElementById("editTagInputContainer"),
    tagInput: document.getElementById("editTagsInput"),
  };

  fillEditForm(task);

  form.onsubmit = handleEditSubmit;

  if (state.editRefs.tagInput) {
    state.editRefs.tagInput.onkeydown = handleEditTagKeydown;
  }

  if (state.editRefs.tagContainer) {
    state.editRefs.tagContainer.onclick = (event) => {
      if (
        event.target === state.editRefs.tagContainer &&
        state.editRefs.tagInput
      ) {
        state.editRefs.tagInput.focus();
      }
    };
  }
}

function fillEditForm(task) {
  if (!state.editRefs) return;
  const titleField = state.editRefs.title;
  const descField = state.editRefs.description;
  const priorityField = state.editRefs.priority;
  const statusField = state.editRefs.status;
  const dueDateField = state.editRefs.dueDate;

  if (titleField) titleField.value = task.title || "";
  if (descField) descField.value = task.description || "";
  if (priorityField)
    priorityField.value = (task.priority || "medium").toLowerCase();
  if (statusField)
    statusField.value = (task.status || "pending").toLowerCase();
  if (dueDateField) dueDateField.value = formatDateForInput(task.dueDate);
  if (state.editRefs.tagInput) state.editRefs.tagInput.value = "";

  state.editTags = [...(task.tags || [])];
  renderEditTags();
}

function setEditMode(isEditing) {
  state.isEditing = Boolean(isEditing);
  const detailView = document.getElementById("taskDetailView");
  const form = state.editRefs ? state.editRefs.form : null;

  if (form) {
    form.style.display = state.isEditing ? "block" : "none";
  }

  if (detailView) {
    detailView.style.display = state.isEditing ? "none" : "";
  }

  if (els.editBtn) {
    els.editBtn.textContent = state.isEditing ? "Save Changes" : "Edit Task";
    els.editBtn.disabled = false;
  }

  if (!state.isEditing && state.currentTask) {
    fillEditForm(state.currentTask);
  }
}

function resetViewState() {
  setEditMode(false);
  state.currentTask = null;
  state.editRefs = null;
  state.editTags = [];
}

function setupDeleteHandler(id) {
  if (!els.deleteBtn) return;

  els.deleteBtn.onclick = () => {
    setEditMode(false);
    els.viewModal.classList.remove("active");

    const confirmModal = document.getElementById("confirmDeleteModal");
    if (!confirmModal) return;

    confirmModal.classList.add("active");

    const confirmBtn = document.getElementById("confirmDeleteBtn");
    if (confirmBtn) {
      confirmBtn.onclick = () => deleteTask(id);
    }

    const cancelBtn = document.getElementById("cancelDeleteBtn");
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        confirmModal.classList.remove("active");
        els.viewModal.classList.add("active");
      };
    }

    const closeBtn = confirmModal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.onclick = () => {
        confirmModal.classList.remove("active");
        els.viewModal.classList.add("active");
      };
    }

    const overlay = confirmModal.querySelector(".modal-overlay");
    if (overlay) {
      overlay.onclick = (event) => {
        if (event.target === overlay) {
          confirmModal.classList.remove("active");
          els.viewModal.classList.add("active");
        }
      };
    }
  };
}

function handleEditTagKeydown(e) {
  if (!state.editRefs || !state.editRefs.tagInput) return;

  if (e.key === "Enter") {
    e.preventDefault();
    const value = state.editRefs.tagInput.value.trim();
    if (value && !state.editTags.includes(value)) {
      state.editTags.push(value);
      renderEditTags();
    }
    state.editRefs.tagInput.value = "";
  } else if (e.key === "Backspace" && !state.editRefs.tagInput.value) {
    state.editTags.pop();
    renderEditTags();
  }
}

function renderEditTags() {
  if (!state.editRefs || !state.editRefs.tagContainer) return;

  state.editRefs.tagContainer
    .querySelectorAll(".tag-pill")
    .forEach((pill) => pill.remove());

  state.editTags.forEach((tag, index) => {
    const pill = document.createElement("div");
    pill.className = "tag-pill";
    const color = getTagColor(tag);
    Object.assign(pill.style, {
      backgroundColor: color.bg,
      color: color.text,
      borderColor: color.border,
    });
    pill.innerHTML = `<span>${esc(tag)}</span><span class="tag-remove" onclick="removeEditTag(${index})">&times;</span>`;
    state.editRefs.tagContainer.insertBefore(
      pill,
      state.editRefs.tagInput
    );
  });
}

window.removeEditTag = (index) => {
  state.editTags.splice(index, 1);
  renderEditTags();
};

async function handleEditSubmit(e) {
  e.preventDefault();
  if (!state.currentTask || !state.editRefs) return;

  const taskId = state.currentTask.id;
  const payload = {
    title: state.editRefs.title ? state.editRefs.title.value.trim() : "",
    description: state.editRefs.description
      ? state.editRefs.description.value.trim()
      : "",
    priority: state.editRefs.priority ? state.editRefs.priority.value : "medium",
    status: state.editRefs.status ? state.editRefs.status.value : "pending",
    dueDate: state.editRefs.dueDate ? state.editRefs.dueDate.value : "",
    tags: state.editTags,
  };

  if (!payload.title) {
    alert("Title is required");
    if (state.editRefs.title) {
      state.editRefs.title.focus();
    }
    return;
  }

  try {
    if (els.editBtn) {
      els.editBtn.disabled = true;
    }

    const res = await fetch(`${API_URL}/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error();

    await loadTasks();
    alert("Task updated!");
    await window.viewTask(taskId);
  } catch (error) {
    console.error(error);
    alert("Failed to update task");
  } finally {
    if (els.editBtn) {
      els.editBtn.disabled = false;
    }
  }
}

function formatStatusLabel(status) {
  if (!status) return "Pending";
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function updateStats() {
  els.stats.total.textContent = state.tasks.length;
  els.stats.completed.textContent = state.tasks.filter(
    (t) => t.status === "completed"
  ).length;
  els.stats.pending.textContent =
    state.tasks.length - els.stats.completed.textContent;
}

const esc = (txt) => {
  const d = document.createElement("div");
  d.textContent = txt;
  return d.innerHTML;
};

const getTagColor = (str) => {
  const colors = [
    { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
    { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
    { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
    { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" },
    { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};
