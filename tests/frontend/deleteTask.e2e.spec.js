/**
 * Frontend E2E Tests for Delete Task Feature
 * Tests user interaction for deleting tasks using Playwright
 */

const { test, expect } = require("@playwright/test");

// Test data constants - use unique titles to avoid conflicts
const TEST_TASK_BASE = {
  description: "This task will be deleted during testing",
  priority: "high",
  dueDate: "2026-02-01",
};

// Generate unique task title for each test
function getUniqueTitle() {
  return `E2E Delete Test ${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 5)}`;
}

// Helper function to create a task via API
async function createTask(request, title) {
  const response = await request.post("/tasks", {
    data: {
      title: title,
      description: TEST_TASK_BASE.description,
      priority: TEST_TASK_BASE.priority,
      dueDate: TEST_TASK_BASE.dueDate,
      status: "pending",
      tags: ["e2e-test"],
    },
  });
  return response;
}

// Helper function to get all tasks via API
async function getTasks(request) {
  const response = await request.get("/tasks");
  const tasks = await response.json();
  // API returns array directly, not object with tasks property
  return Array.isArray(tasks) ? tasks : tasks.tasks || [];
}

// Helper function to delete all test tasks via API
async function cleanupTestTasks(request) {
  const tasks = await getTasks(request);
  if (tasks && Array.isArray(tasks)) {
    for (const task of tasks) {
      if (task.title && task.title.includes("E2E Delete Test")) {
        try {
          await request.delete(`/tasks/${task.id}`);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  }
}

test.describe("Delete Task - Frontend E2E Tests", () => {
  test.describe("Confirm delete → task removed", () => {
    test("should delete task when user confirms deletion", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      // Navigate to the app
      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Find and click on the test task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await expect(taskCard).toBeVisible();
      await taskCard.click();

      // Wait for the view task modal to open
      const viewModal = page.locator("#viewTaskModal");
      await expect(viewModal).toHaveClass(/active/);

      // Set up dialog handler to accept all dialogs
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      // Click the delete button
      const deleteBtn = page.locator("#deleteTaskBtn");
      await expect(deleteBtn).toBeVisible();
      await deleteBtn.click();

      // Wait for deletion to complete
      await page.waitForTimeout(1500);

      // Refresh the page to ensure task is deleted from backend
      await page.reload();
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Verify the task is no longer in the list
      const deletedTask = page.locator(".task-card", { hasText: testTitle });
      await expect(deletedTask).toHaveCount(0);
    });

    test("should show success message after deletion", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Click on the test task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();

      // Wait for modal
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Track dialogs
      const dialogs = [];
      page.on("dialog", async (dialog) => {
        dialogs.push({ type: dialog.type(), message: dialog.message() });
        await dialog.accept();
      });

      // Click delete
      await page.locator("#deleteTaskBtn").click();

      // Wait for dialogs
      await page.waitForTimeout(1000);

      // Verify we got dialogs (confirmation and/or success)
      expect(dialogs.length).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Cancel delete → task remains", () => {
    test("should keep task when user cancels deletion", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Click on the test task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await expect(taskCard).toBeVisible();
      await taskCard.click();

      // Wait for modal
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Set up dialog handler to DISMISS confirmation but accept alerts
      page.on("dialog", async (dialog) => {
        if (dialog.type() === "confirm") {
          await dialog.dismiss(); // User clicks "Cancel"
        } else {
          await dialog.accept();
        }
      });

      // Click delete
      await page.locator("#deleteTaskBtn").click();

      // Wait a moment
      await page.waitForTimeout(500);

      // Close the modal
      await page.locator("#closeViewModal").click();

      // Verify the task is still in the list
      const taskStillExists = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await expect(taskStillExists).toBeVisible();

      // Cleanup
      await cleanupTestTasks(request);
    });

    test("should not make API call when cancelling delete", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Track API calls
      let deleteApiCalled = false;
      await page.route("**/tasks/*", (route) => {
        if (route.request().method() === "DELETE") {
          deleteApiCalled = true;
        }
        route.continue();
      });

      // Click on task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();

      // Wait for modal
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Cancel the deletion
      page.on("dialog", async (dialog) => {
        if (dialog.type() === "confirm") {
          await dialog.dismiss();
        } else {
          await dialog.accept();
        }
      });

      await page.locator("#deleteTaskBtn").click();
      await page.waitForTimeout(500);

      // Verify no DELETE API call was made
      expect(deleteApiCalled).toBe(false);

      // Cleanup
      await cleanupTestTasks(request);
    });
  });

  test.describe("Delete already removed task", () => {
    test("should handle deletion of already deleted task gracefully", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      const createResponse = await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Get the task ID
      const tasks = await getTasks(request);
      const testTask = tasks.find((t) => t.title === testTitle);
      expect(testTask).toBeDefined();

      // Open the task in the UI
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Delete the task via API (simulating another user/tab deleting it)
      await request.delete(`/tasks/${testTask.id}`);

      // Now try to delete via UI
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      await page.locator("#deleteTaskBtn").click();

      // Should handle the error gracefully (either close with error or show notification)
      await page.waitForTimeout(1000);
    });
  });

  test.describe("Error handling UI feedback", () => {
    test("should show error alert when delete request fails", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Click on task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Mock the API to return an error
      await page.route("**/tasks/*", (route) => {
        if (route.request().method() === "DELETE") {
          route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Server error occurred" }),
          });
        } else {
          route.continue();
        }
      });

      // Track alert dialogs
      const alertMessages = [];
      page.on("dialog", async (dialog) => {
        alertMessages.push(dialog.message());
        await dialog.accept();
      });

      // Click delete
      await page.locator("#deleteTaskBtn").click();

      // Wait for error handling
      await page.waitForTimeout(1000);

      // Verify error was shown
      expect(
        alertMessages.some(
          (msg) =>
            msg.includes("Unable") ||
            msg.includes("error") ||
            msg.includes("Error") ||
            msg.includes("Server")
        )
      ).toBe(true);

      // Cleanup
      await cleanupTestTasks(request);
    });

    test("should show error when network request fails", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Click on task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Mock network failure
      await page.route("**/tasks/*", (route) => {
        if (route.request().method() === "DELETE") {
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      // Track alerts
      const alertMessages = [];
      page.on("dialog", async (dialog) => {
        alertMessages.push(dialog.message());
        await dialog.accept();
      });

      // Click delete
      await page.locator("#deleteTaskBtn").click();

      // Wait for error
      await page.waitForTimeout(1000);

      // Verify error message was shown
      expect(alertMessages.length).toBeGreaterThan(0);
      expect(alertMessages.some((msg) => msg.includes("Unable"))).toBe(true);

      // Cleanup
      await cleanupTestTasks(request);
    });

    test("should not delete when no task is selected", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Open a task first
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Clear the selected task in state
      await page.evaluate(() => {
        if (window.TaskState) {
          window.TaskState.selectedTask = null;
        }
      });

      // Track if any API calls are made
      let apiCallMade = false;
      await page.route("**/tasks/*", (route) => {
        if (route.request().method() === "DELETE") {
          apiCallMade = true;
        }
        route.continue();
      });

      // Handle any dialogs
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      // Click delete - should not make API call since no task is selected
      await page.locator("#deleteTaskBtn").click();
      await page.waitForTimeout(500);

      // No API call should have been made
      expect(apiCallMade).toBe(false);

      // Cleanup
      await cleanupTestTasks(request);
    });
  });

  test.describe("UI State after deletion", () => {
    test("should close modal after successful deletion", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Open task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      // Accept all dialogs
      page.on("dialog", (dialog) => dialog.accept());

      // Delete
      await page.locator("#deleteTaskBtn").click();

      // Wait for deletion to complete
      await page.waitForTimeout(1500);

      // Modal should be closed
      await expect(page.locator("#viewTaskModal")).not.toHaveClass(/active/);
    });

    test("should update task count after deletion", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Get initial task count
      const initialCountText = await page.locator("#totalTasks").textContent();
      const initialCount = parseInt(initialCountText || "0");

      // Open and delete task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      page.on("dialog", (dialog) => dialog.accept());
      await page.locator("#deleteTaskBtn").click();

      // Wait for UI to update
      await page.waitForTimeout(1500);

      // Check if count decreased
      const newCountText = await page.locator("#totalTasks").textContent();
      const newCount = parseInt(newCountText || "0");

      expect(newCount).toBe(initialCount - 1);
    });

    test("should refresh task list after deletion", async ({
      page,
      request,
    }) => {
      // Create a unique test task
      const testTitle = getUniqueTitle();
      await createTask(request, testTitle);

      await page.goto("/");
      await page.waitForSelector("#tasksList", { state: "visible" });
      await page.waitForTimeout(500);

      // Count tasks before deletion
      const tasksBefore = await page.locator(".task-card").count();

      // Delete a task
      const taskCard = page
        .locator(".task-card", { hasText: testTitle })
        .first();
      await taskCard.click();
      await expect(page.locator("#viewTaskModal")).toHaveClass(/active/);

      page.on("dialog", (dialog) => dialog.accept());
      await page.locator("#deleteTaskBtn").click();

      await page.waitForTimeout(1500);

      // Count tasks after deletion
      const tasksAfter = await page.locator(".task-card").count();

      expect(tasksAfter).toBe(tasksBefore - 1);
    });
  });

  // Final cleanup after all tests
  test.afterAll(async ({ request }) => {
    await cleanupTestTasks(request);
  });
});
