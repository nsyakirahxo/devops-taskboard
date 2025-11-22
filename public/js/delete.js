function deleteTask(id) {
    var request = new XMLHttpRequest();
    request.open("DELETE", "/tasks/" + id, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.onload = function () {
        if (request.status === 200) {
            const confirmModal = document.getElementById("confirmDeleteModal");
            if (confirmModal) {
                confirmModal.classList.remove("active");
            }

            if (typeof loadTasks === 'function') { 
                loadTasks();
            } else {
                window.location.reload();
            }
        } else {
            var response = JSON.parse(request.responseText);
            alert(response.message || "Unable to delete resource.");
        }
    };
    request.send();
}