// Function to delete a resource by its ID
function deleteTask(id) {
// Ask the user to confirm deletion before proceeding
if (!confirm("Are you sure you want to delete this task?")) {
return; // Exit function if user cancels
}
// Configure request as DELETE to the delete-task endpoint with the task ID
var request = new XMLHttpRequest();
request.open("DELETE", "/tasks/" + id, true);
request.setRequestHeader("Content-Type", "application/json");
request.onload = function () {
var response = JSON.parse(request.responseText); // Parse JSON response from server
if (request.status === 200) {
alert(response.message); // If deletion was success, show a confirmation alert
viewResources(); // Refresh the table to reflect the deleted resource
} else {
// Show error message if deletion failed
alert(response.message || "Unable to delete resource.");
}
};
request.send();
}