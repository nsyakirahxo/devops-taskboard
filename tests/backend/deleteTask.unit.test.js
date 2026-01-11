/**
 * Backend Unit Tests for Delete Task Feature
 * Tests the deletedTask function in syakirahUtil.js
 */

const fs = require("fs").promises;
const path = require("path");

// Mock fs module before requiring the module under test
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

const { deletedTask } = require("../../utils/syakirahUtil");

describe("Delete Task - Backend Unit Tests", () => {
  let mockReq;
  let mockRes;
  let mockJson;
  let mockStatus;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe("Successful deletion with valid task ID", () => {
    it("should delete a task and return 200 status", async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
          { id: 3, title: "Task 3" },
        ],
      };

      mockReq = { params: { id: "2" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));
      fs.writeFile.mockResolvedValue(undefined);

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Task deleted successfully!",
      });
      expect(fs.writeFile).toHaveBeenCalled();

      // Verify the written data no longer contains the deleted task
      const writtenData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenData.tasks).toHaveLength(2);
      expect(writtenData.tasks.find((t) => t.id === 2)).toBeUndefined();
    });

    it("should delete the first task in the list", async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
        ],
      };

      mockReq = { params: { id: "1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));
      fs.writeFile.mockResolvedValue(undefined);

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Task deleted successfully!",
      });
    });

    it("should delete the last task in the list", async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
        ],
      };

      mockReq = { params: { id: "2" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));
      fs.writeFile.mockResolvedValue(undefined);

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe("Deletion with non-existent task ID", () => {
    it("should return 404 when task ID does not exist", async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
        ],
      };

      mockReq = { params: { id: "999" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Task not found." });
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it("should return 404 for negative task ID", async () => {
      const tasksData = {
        tasks: [{ id: 1, title: "Task 1" }],
      };

      mockReq = { params: { id: "-1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Task not found." });
    });
  });

  describe("Invalid input handling", () => {
    it("should handle string task ID that does not match any task", async () => {
      const tasksData = {
        tasks: [{ id: 1, title: "Task 1" }],
      };

      mockReq = { params: { id: "invalid" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Task not found." });
    });
  });

  describe("File read/write error handling", () => {
    it("should return 404 when tasks file does not exist (ENOENT)", async () => {
      mockReq = { params: { id: "1" } };

      const enoentError = new Error("File not found");
      enoentError.code = "ENOENT";
      fs.readFile.mockRejectedValue(enoentError);

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No tasks found to delete.",
      });
    });

    it("should return 500 when file read fails with other error", async () => {
      mockReq = { params: { id: "1" } };

      const readError = new Error("Permission denied");
      readError.code = "EACCES";
      fs.readFile.mockRejectedValue(readError);

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Permission denied" });
    });

    it("should return 500 when file write fails", async () => {
      const tasksData = {
        tasks: [{ id: 1, title: "Task 1" }],
      };

      mockReq = { params: { id: "1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));
      fs.writeFile.mockRejectedValue(new Error("Disk full"));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Disk full" });
    });
  });

  describe("Edge case: empty task list", () => {
    it("should return 404 when tasks array is empty", async () => {
      const tasksData = { tasks: [] };

      mockReq = { params: { id: "1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Task not found." });
    });

    it("should return 404 when tasks property is missing", async () => {
      const tasksData = {};

      mockReq = { params: { id: "1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No tasks found to delete.",
      });
    });

    it("should return 404 when tasks is not an array", async () => {
      const tasksData = { tasks: "not an array" };

      mockReq = { params: { id: "1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No tasks found to delete.",
      });
    });

    it("should return 404 when tasks is null", async () => {
      const tasksData = { tasks: null };

      mockReq = { params: { id: "1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No tasks found to delete.",
      });
    });
  });

  describe("Task ID type coercion", () => {
    it("should handle numeric string matching numeric ID", async () => {
      const tasksData = {
        tasks: [{ id: 1, title: "Task 1" }],
      };

      mockReq = { params: { id: "1" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));
      fs.writeFile.mockResolvedValue(undefined);

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle string ID matching string ID in task", async () => {
      const tasksData = {
        tasks: [{ id: "abc123", title: "Task 1" }],
      };

      mockReq = { params: { id: "abc123" } };

      fs.readFile.mockResolvedValue(JSON.stringify(tasksData));
      fs.writeFile.mockResolvedValue(undefined);

      await deletedTask(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});
