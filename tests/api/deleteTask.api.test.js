/**
 * API Tests for Delete Task Feature
 * Tests the DELETE /tasks/:id endpoint using Jest + Supertest
 */

const request = require("supertest");
const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const TASKS_FILE = path.join(__dirname, "../../utils/taskboard.json");

// Create a test app with the delete route
const { deletedTask } = require("../../utils/syakirahUtil");

const app = express();
app.use(express.json());
app.delete("/tasks/:id", deletedTask);

// Helper function to reset database with test tasks
async function resetDatabase() {
  const testData = {
    tasks: [
      {
        id: "t1",
        title: "Test Task 1",
        description: "Description 1",
        priority: "high",
        status: "pending",
        dueDate: "2026-01-15",
        tags: ["test"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "t2",
        title: "Test Task 2",
        description: "Description 2",
        priority: "medium",
        status: "in-progress",
        dueDate: "2026-01-20",
        tags: ["api"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "t3",
        title: "Test Task 3",
        description: "Description 3",
        priority: "low",
        status: "completed",
        dueDate: "2026-01-25",
        tags: ["test", "api"],
        createdAt: new Date().toISOString(),
      },
    ],
  };
  await fs.writeFile(TASKS_FILE, JSON.stringify(testData, null, 2), "utf8");
}

// Helper function to get current tasks
async function getTasks() {
  const data = await fs.readFile(TASKS_FILE, "utf8");
  return JSON.parse(data);
}

// Helper function to clear all tasks
async function clearTasks() {
  await fs.writeFile(
    TASKS_FILE,
    JSON.stringify({ tasks: [] }, null, 2),
    "utf8"
  );
}

// Helper function to delete tasks file
async function deleteTasksFile() {
  try {
    await fs.unlink(TASKS_FILE);
  } catch (err) {
    // Ignore if file doesn't exist
  }
}

// Helper function to write invalid data structure
async function writeInvalidTasksStructure(data) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(data, null, 2), "utf8");
}

describe("Delete Task - API Tests", () => {
  beforeEach(async () => {
    // Reset database before each test
    await resetDatabase();
  });

  afterAll(async () => {
    // Clean up after all tests
    await resetDatabase();
  });

  describe("DELETE /tasks/:id - Success (200)", () => {
    it("should successfully delete an existing task and return 200", async () => {
      const response = await request(app)
        .delete("/tasks/t1")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual({ message: "Task deleted successfully!" });

      // Verify task is actually deleted
      const tasksData = await getTasks();
      expect(tasksData.tasks.find((t) => t.id === "t1")).toBeUndefined();
      expect(tasksData.tasks).toHaveLength(2);
    });

    it("should delete middle task from list", async () => {
      const response = await request(app).delete("/tasks/t2").expect(200);

      expect(response.body.message).toBe("Task deleted successfully!");

      const tasksData = await getTasks();
      expect(tasksData.tasks).toHaveLength(2);
      expect(tasksData.tasks.map((t) => t.id)).toEqual(["t1", "t3"]);
    });

    it("should delete last task from list", async () => {
      const response = await request(app).delete("/tasks/t3").expect(200);

      expect(response.body.message).toBe("Task deleted successfully!");

      const tasksData = await getTasks();
      expect(tasksData.tasks).toHaveLength(2);
    });

    it("should be able to delete all tasks one by one", async () => {
      await request(app).delete("/tasks/t1").expect(200);
      await request(app).delete("/tasks/t2").expect(200);
      await request(app).delete("/tasks/t3").expect(200);

      const tasksData = await getTasks();
      expect(tasksData.tasks).toHaveLength(0);
    });
  });

  describe("DELETE /tasks/:id - Not Found (404)", () => {
    it("should return 404 when task ID does not exist", async () => {
      const response = await request(app)
        .delete("/tasks/999")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toEqual({ message: "Task not found." });
    });

    it("should return 404 for negative task ID", async () => {
      const response = await request(app).delete("/tasks/-1").expect(404);

      expect(response.body.message).toBe("Task not found.");
    });

    it("should return 404 when deleting from empty task list", async () => {
      await clearTasks();

      const response = await request(app).delete("/tasks/t1").expect(404);

      expect(response.body.message).toBe("Task not found.");
    });

    it("should return 404 when tasks file does not exist", async () => {
      await deleteTasksFile();

      const response = await request(app).delete("/tasks/t1").expect(404);

      expect(response.body.message).toBe("No tasks found to delete.");

      // Restore the file for subsequent tests
      await resetDatabase();
    });

    it("should return 404 when trying to delete same task twice", async () => {
      // First deletion should succeed
      await request(app).delete("/tasks/t1").expect(200);

      // Second deletion should fail
      const response = await request(app).delete("/tasks/t1").expect(404);

      expect(response.body.message).toBe("Task not found.");
    });

    it("should return 404 when tasks property is missing", async () => {
      await writeInvalidTasksStructure({});

      const response = await request(app).delete("/tasks/t1").expect(404);

      expect(response.body.message).toBe("No tasks found to delete.");
    });

    it("should return 404 when tasks is not an array", async () => {
      await writeInvalidTasksStructure({ tasks: "not an array" });

      const response = await request(app).delete("/tasks/t1").expect(404);

      expect(response.body.message).toBe("No tasks found to delete.");
    });

    it("should return 404 when tasks is null", async () => {
      await writeInvalidTasksStructure({ tasks: null });

      const response = await request(app).delete("/tasks/t1").expect(404);

      expect(response.body.message).toBe("No tasks found to delete.");
    });
  });

  describe("DELETE /tasks/:id - Invalid ID (400-like scenarios)", () => {
    it("should return 404 for non-numeric string ID that does not match", async () => {
      const response = await request(app)
        .delete("/tasks/invalid-id")
        .expect(404);

      expect(response.body.message).toBe("Task not found.");
    });

    it("should return 404 for zero ID", async () => {
      const response = await request(app).delete("/tasks/0").expect(404);

      expect(response.body.message).toBe("Task not found.");
    });

    it("should handle very large task ID", async () => {
      const response = await request(app)
        .delete("/tasks/99999999999")
        .expect(404);

      expect(response.body.message).toBe("Task not found.");
    });

    it("should handle special characters in ID", async () => {
      const response = await request(app).delete("/tasks/%20%20").expect(404);

      expect(response.body.message).toBe("Task not found.");
    });
  });

  describe("DELETE /tasks/:id - Data Integrity", () => {
    it("should preserve other tasks when deleting one", async () => {
      const beforeData = await getTasks();
      const task2Before = beforeData.tasks.find((t) => t.id === "t2");
      const task3Before = beforeData.tasks.find((t) => t.id === "t3");

      await request(app).delete("/tasks/t1").expect(200);

      const afterData = await getTasks();
      const task2After = afterData.tasks.find((t) => t.id === "t2");
      const task3After = afterData.tasks.find((t) => t.id === "t3");

      expect(task2After).toEqual(task2Before);
      expect(task3After).toEqual(task3Before);
    });

    it("should maintain JSON file format after deletion", async () => {
      await request(app).delete("/tasks/t1").expect(200);

      const fileContent = await fs.readFile(TASKS_FILE, "utf8");

      // Verify it's valid JSON
      expect(() => JSON.parse(fileContent)).not.toThrow();

      // Verify structure
      const parsed = JSON.parse(fileContent);
      expect(parsed).toHaveProperty("tasks");
      expect(Array.isArray(parsed.tasks)).toBe(true);
    });
  });

  describe("DELETE /tasks/:id - Concurrent Operations", () => {
    it("should handle multiple sequential delete requests", async () => {
      const responses = [];

      responses.push(await request(app).delete("/tasks/t1"));
      responses.push(await request(app).delete("/tasks/t2"));
      responses.push(await request(app).delete("/tasks/t3"));

      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(200);

      const tasksData = await getTasks();
      expect(tasksData.tasks).toHaveLength(0);
    });
  });
});
