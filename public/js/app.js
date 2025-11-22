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
  stats: {
    total: document.getElementById("totalTasks"),
    completed: document.getElementById("completedTasks"),
    pending: document.getElementById("pendingTasks"),
  },
};

let state = { tasks: [], tags: [] };

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
    const t = await res.json();
    const d = document.getElementById("taskDetails");

    d.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <label>Title</label>
          <div>${esc(t.title)}</div>
        </div>
        <div class="detail-item">
          <label>Priority</label>
          <span class="task-priority ${t.priority || "medium"}">${
      t.priority || "medium"
    }</span>
        </div>
        <div class="detail-item full-width">
          <label>Description</label>
          <div>${esc(t.description || "-")}</div>
        </div>
        <div class="detail-item">
          <label>Due Date</label>
          <div>${
            t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"
          }</div>
        </div>
        <div class="detail-item">
          <label>Created</label>
          <div>${
            t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"
          }</div>
        </div>
        ${
          (t.tags || []).length
            ? `
          <div class="detail-item full-width">
            <label>Tags</label>
            <div class="task-tags">
              ${t.tags
                .map((tag) => {
                  const c = getTagColor(tag);
                  return `<span class="task-tag" style="background-color:${
                    c.bg
                  };color:${c.text};border-color:${c.border}">${esc(
                    tag
                  )}</span>`;
                })
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
    
    const deleteBtn = document.getElementById("deleteTaskBtn");
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        els.viewModal.classList.remove("active");

        const confirmModal = document.getElementById("confirmDeleteModal");
        if (confirmModal) {
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
          

          const closeBtn = document.getElementById("closeConfirmModal");
          if (closeBtn) {
            closeBtn.onclick = () => {
              confirmModal.classList.remove("active");
              els.viewModal.classList.add("active");
            };
          }
        }
      };
    }

    els.viewModal.classList.add("active");
  } catch (err) {
    alert("Failed to load task");
  }
};

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
