# 📄 INSTRUCTIONS.md  
## DevOps Project – Part 2: Automated Testing

### Audience
This document provides **step-by-step, non-ambiguous instructions** for an AI agent to complete **Project Part 2 (Automated Testing)** of the DevOps Essentials module.

The AI agent **must only implement testing and coverage**, not modify the core application logic beyond what is allowed.

---

## 1. Project Context

### Application
**Task Management Web Application**

### Feature Under Test (ONLY)
**Delete Task**

- Backend file: `utils/<StudentName>Util.js`
- Frontend file: `public/js/<student-name>.js`
- Database: JSON file in `utils/`

⚠️ The AI agent must **NOT** write tests for any other feature (e.g. Create Task, Edit Task).

---

## 2. Rules & Constraints (CRITICAL)

1. **Forked Repository Only**
   - Repository is forked from Part 1.
   - All work is done **independently**.

2. **Scope Limitation**
   - Tests and coverage **must only target the Delete Task feature**.
   - Do NOT inflate coverage by testing unrelated code.

3. **Allowed Modifications**
   - ✅ Add test files
   - ✅ Add test configuration
   - ✅ Add coverage scripts
   - ⚠️ Minor feature tweaks allowed **only** to improve testability
   - ❌ Do NOT change core behaviour

4. **Mandatory Testing Tools**
   - Backend unit testing: **Jest**
   - API testing: **Jest + Supertest**
   - Frontend testing: **Playwright**
   - Frontend coverage: **Playwright + Istanbul**

5. **Coverage Metrics**
   - Lines
   - Statements
   - Functions
   - Branches

---

## 3. Expected Folder Structure

```
project-root/
│
├── utils/
│   ├── <StudentName>Util.js
│   └── tasks.json
│
├── public/
│   └── js/
│       └── <student-name>.js
│
├── tests/
│   ├── backend/
│   │   └── deleteTask.unit.test.js
│   ├── api/
│   │   └── deleteTask.api.test.js
│   └── frontend/
│       └── deleteTask.e2e.spec.js
│
├── coverage/
│   ├── backend/
│   └── frontend/
│
├── generate-coverage.js
├── jest.config.js
├── playwright.config.js
└── package.json
```

---

## 4. Backend Unit Testing (Jest)

### Objective
Validate Delete Task backend logic in isolation.

### Required Test Coverage
- Successful deletion with valid task ID
- Deletion with non-existent task ID
- Invalid input (null / undefined ID)
- File read/write error handling
- Edge case: empty task list

### Deliverables
- `tests/backend/deleteTask.unit.test.js`
- Coverage output in `coverage/backend`

---

## 5. API Testing (Jest + Supertest)

### Objective
Verify HTTP behaviour of Delete Task endpoint.

### Required Test Cases
- DELETE success → 200
- Task not found → 404
- Invalid ID → 400
- Internal error → 500

### Deliverables
- `tests/api/deleteTask.api.test.js`
- Database reset between tests

---

## 6. Frontend Testing (Playwright)

### Objective
Test user interaction for Delete Task.

### Required Scenarios
- Confirm delete → task removed
- Cancel delete → task remains
- Delete already removed task
- Error handling UI feedback

### Deliverables
- `tests/frontend/deleteTask.e2e.spec.js`

---

## 7. Frontend Code Coverage (MANDATORY ADDITIONAL FEATURE)

### Requirement
Implement **frontend code coverage threshold enforcement**.

### Minimum Thresholds
```js
const thresholds = {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 80
};
```

### Behaviour
- If threshold fails → print errors and exit with non-zero code
- If passed → print success message

---

## 8. Required NPM Commands

```bash
npm run test-backend
npm run test-api
npm run test-frontend
npm run test-frontend:coverage
```

---

## 9. Evidence Generation (For Report)

Ensure availability of:
- Backend coverage report
- Frontend HTML coverage report
- Terminal output screenshots
- Clear mapping between test files and Delete Task feature

---

## 10. What NOT To Do

- ❌ Do NOT test teammates’ features
- ❌ Do NOT inflate coverage artificially
- ❌ Do NOT remove existing logic
- ❌ Do NOT bypass thresholds

---

## 11. Completion Checklist

- [ ] All tests passing
- [ ] Coverage generated
- [ ] Threshold enforced
- [ ] Scope strictly limited
- [ ] Ready for ZIP submission

---

**END OF INSTRUCTIONS**
