# Part 3 Demo Day - Step-by-Step Guide

## Overview

- **Time Limit:** 10 minutes, ONE attempt only
- **No slides required** - this is a live demo
- **Goal:** Make a minor code change, commit and push it, then show the full CI/CD pipeline (Build, Test, Deploy) running automatically via Jenkins

---

## Prerequisites

You need the following installed on your machine:

- **Git** (to commit and push code)
- **Node.js 18+** (the app runtime)
- **Docker Desktop** (to build container images)
- **Minikube** (local Kubernetes cluster)
- **kubectl** (Kubernetes CLI, bundled with Minikube)
- **Jenkins** (CI/CD server, running locally)
- **Blue Ocean plugin** installed in Jenkins (additional feature)
- **Email Extension plugin** installed in Jenkins (additional feature)

---

## Part A: Setup (Do This BEFORE Demo Day)

### A1. Start Docker Desktop

Open Docker Desktop and wait until the engine is running. You can verify with:

```bash
docker info
```

You should see system info without errors.

### A2. Start Minikube

```bash
minikube start
```

Wait for the output: `Done! kubectl is now configured to use "minikube" cluster`.

Verify it is running:

```bash
minikube status
```

Expected output:

```
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

### A3. Start Jenkins

If Jenkins is installed as a service, it may already be running. Otherwise start it:

- **Windows:** Open Services and start "Jenkins", or run `jenkins.exe` from the install directory
- **Default URL:** http://localhost:8080

Log in with your Jenkins credentials.

### A4. Verify the Jenkins Job is Configured

1. Open Jenkins at http://localhost:8080
2. You should see a pipeline job (e.g., `devops-taskboard`) already configured
3. Click on the job and verify:
   - **Pipeline source:** Pipeline script from SCM
   - **SCM:** Git
   - **Repository URL:** Your GitHub repo URL (https://github.com/jafarnz/devops-taskboard.git)
   - **Branch:** `*/main`
   - **Script Path:** `Jenkinsfile`
   - **Build Triggers:** Poll SCM is checked with schedule `* * * * *` (every minute)

If the job does not exist, create it:

1. Click **New Item**
2. Enter name: `devops-taskboard`
3. Select **Pipeline**, click OK
4. Under **Build Triggers**, check **Poll SCM** and enter: `* * * * *`
5. Under **Pipeline**, select **Pipeline script from SCM**
6. Set SCM to **Git**, enter your repo URL and credentials
7. Set branch to `*/main` and script path to `Jenkinsfile`
8. Click **Save**

### A5. Do a Test Run (Important!)

Run the pipeline once before demo day to make sure everything works:

1. In Jenkins, click **Build Now** on your pipeline job
2. Watch all 3 stages complete: Build, Test, Deploy
3. If all stages pass (green), you are ready

If any stage fails, troubleshoot and fix it before demo day.

### A6. Verify the App is Deployed

After the test run, get the Minikube IP and access the app:

```bash
minikube service devops-taskboard-service --url
```

This will output a URL like `http://192.168.49.2:30080`. Open it in your browser and confirm the Task Manager app loads.

Alternatively:

```bash
minikube ip
```

Then open `http://<minikube-ip>:30080` in your browser.

### A7. Open Blue Ocean

1. In Jenkins, click **Open Blue Ocean** in the left sidebar
2. Verify your pipeline appears and shows the previous successful run
3. Keep this tab open for the demo

---

## Part B: The Live Demo

### Step 1: Show the Current State (~1 minute)

**What to say:** "This is our Task Manager web application, currently deployed on a Kubernetes cluster via Minikube. It was built using Node.js and Express with a JSON file database."

**What to show:**
- Open the app in the browser (http://<minikube-ip>:30080)
- Briefly click around to show it works (view tasks, etc.)
- Point out the current page title/heading: **"Task Manager"**

### Step 2: Show the Pipeline Configuration (~1 minute)

**What to say:** "Let me show you our CI/CD pipeline configuration."

**What to show:**
- Open the `Jenkinsfile` in your code editor
- Walk through the 3 stages:
  - **Build:** Runs `npm install` to install dependencies
  - **Test:** Runs backend unit tests and API tests using Jest, with JUnit XML reporting for Blue Ocean
  - **Deploy:** Builds a Docker image, loads it into Minikube, applies Kubernetes manifests, and restarts the deployment
- Point out `pollSCM('* * * * *')` — "The pipeline polls our GitHub repo every 1 minute for changes"
- Point out `emailext` — "On success or failure, an email notification is sent"

### Step 3: Make a Minor Code Change (~1 minute)

**What to say:** "Now I will make a small code change to trigger the pipeline."

Open `public/index.html` in your code editor and change the page heading on line 21:

**Before:**
```html
<h1 class="logo">Task Manager</h1>
```

**After:**
```html
<h1 class="logo">Task Manager v2</h1>
```

Save the file.

### Step 4: Commit and Push (~1 minute)

**What to say:** "I will now commit this change and push it to GitHub, which will trigger our CI/CD pipeline."

Run these commands in the terminal:

```bash
git add public/index.html
git commit -m "Update app heading for demo"
git push
```

**What to say after pushing:** "The pipeline is configured to poll the SCM every minute, so Jenkins will automatically detect this change and start a new build shortly."

### Step 5: Wait for Jenkins to Trigger (~1 minute)

**While waiting, explain:**
- "Our Jenkinsfile uses `pollSCM('* * * * *')` which checks for new commits every minute"
- "Once Jenkins detects the new commit, it will automatically start the pipeline"

**What to show:**
- Switch to the Blue Ocean dashboard in your browser
- Wait for a new build to appear (the row will show as "running" with a blue spinner)

### Step 6: Watch the BUILD Stage (~1 minute)

**What to say:** "The Build stage is now running. It executes `npm install` to install all project dependencies."

**What to show:**
- In Blue Ocean, click on the running build to see the stage view
- Click on the **Build** stage to expand its logs
- Point out that `npm install` is running and completing

### Step 7: Watch the TEST Stage (~2 minutes)

**What to say:** "The Test stage runs our backend unit tests and API tests using Jest."

**What to show:**
- Watch the **Test** stage execute in Blue Ocean
- Click on the Test stage to see the logs
- Point out two test commands running:
  - Backend unit tests (`deleteTask.unit.test.js`)
  - API tests (`deleteTask.api.test.js`)
- After the stage completes, click the **Tests** tab in Blue Ocean
  - This shows individual test results in a visual format (JUnit reporting)
  - **This is one of our additional features: Blue Ocean with JUnit test result visualisation**

### Step 8: Watch the DEPLOY Stage (~2 minutes)

**What to say:** "The Deploy stage builds a Docker image, loads it into Minikube, and deploys to Kubernetes."

**What to show:**
- Watch the **Deploy** stage in Blue Ocean
- Point out each step in the logs:
  1. `docker build` — builds the container image from our Dockerfile
  2. `docker tag` — tags the image as `latest`
  3. `minikube image load` — loads the image into Minikube's container runtime
  4. `kubectl apply -f deployment.yaml` — creates/updates the Kubernetes Deployment
  5. `kubectl apply -f service.yaml` — creates/updates the Kubernetes Service (NodePort on 30080)
  6. `kubectl rollout restart` — restarts pods to use the new image
  7. `kubectl rollout status` — waits and confirms the deployment is ready

### Step 9: Verify the Deployment (~1 minute)

**What to say:** "The pipeline has completed successfully. Let me verify the change is live."

**What to show:**
- Switch to the browser tab with the app
- **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
- The heading should now show **"Task Manager v2"** instead of "Task Manager"
- **This confirms the full CI/CD pipeline works end-to-end: code change, automatic build, test, and deployment**

### Step 10: Show the Email Notification (~30 seconds)

**What to say:** "As an additional feature, our pipeline sends email notifications on build success or failure."

**What to show:**
- Open your email client or show the `emailext` section in the Jenkinsfile
- Show the success email (subject: "Build SUCCESS: devops-taskboard #<number>")
- **This is our second additional feature: Jenkins Email Notification**

### Step 11: Show Final Pipeline Status (~30 seconds)

**What to show:**
- Switch back to Blue Ocean
- The pipeline should show all 3 stages as green (passed)
- Optionally run in terminal to show Kubernetes status:

```bash
kubectl get pods
kubectl get services
```

---

## Part C: Common Q&A Questions (Prepare Answers)

### Pipeline Questions

**Q: What does `pollSCM('* * * * *')` do?**
A: It tells Jenkins to check the Git repository for new commits every minute. The five asterisks represent minute, hour, day of month, month, and day of week — all set to wildcard means "every minute."

**Q: Why do you use `npm install` in the Build stage and not in the Dockerfile?**
A: The Build stage in Jenkins installs all dependencies (including devDependencies like Jest) because the Test stage needs them. The Dockerfile uses `npm install --production` which only installs production dependencies, keeping the container image small.

**Q: Why are Playwright (frontend) tests not in the pipeline?**
A: Playwright tests require a browser environment (Chromium) which adds complexity and size to the CI environment. The backend unit tests and API tests provide sufficient coverage for the CI pipeline. Frontend tests are run separately during development.

### Docker Questions

**Q: What does `docker build -t devops-taskboard:<BUILD_NUMBER> .` do?**
A: It builds a Docker image from the Dockerfile in the current directory. The `-t` flag tags it with the image name and the Jenkins build number as the version.

**Q: Why do you tag the image twice (with build number and latest)?**
A: The build number tag provides a unique version for each build (useful for rollback). The `latest` tag is what the Kubernetes deployment references, so it always pulls the most recent image.

**Q: What does `minikube image load` do?**
A: Minikube runs its own container runtime, separate from the host's Docker. This command transfers the Docker image from the host into Minikube so that Kubernetes pods can use it.

**Q: Explain the Dockerfile.**
A: It uses Node 18 Alpine (a lightweight Linux image) as the base. It copies `package.json` first and runs `npm install --production` to take advantage of Docker layer caching. Then it copies the application files, exposes port 3000, and starts the app with `node index.js`.

### Kubernetes Questions

**Q: What does `deployment.yaml` do?**
A: It defines a Kubernetes Deployment that runs one replica (pod) of our app container. It uses the `devops-taskboard:latest` image with `imagePullPolicy: Never` so Kubernetes uses the locally loaded image instead of trying to pull from a remote registry.

**Q: What does `service.yaml` do?**
A: It creates a Kubernetes Service of type NodePort that exposes the app externally. It maps the container's port 3000 to NodePort 30080, so the app is accessible at `http://<minikube-ip>:30080`.

**Q: What does `kubectl rollout restart` do?**
A: It restarts all pods in the deployment, forcing them to pull the latest image. Without this, Kubernetes might keep running the old container since the image tag (`latest`) hasn't technically changed.

### Additional Features Questions

**Q: What is Blue Ocean?**
A: Blue Ocean is a Jenkins plugin that provides a modern, visual interface for viewing pipeline runs. It shows each stage graphically and can display JUnit test results in a visual format, making it easier to identify which tests passed or failed.

**Q: How does JUnit reporting work in your pipeline?**
A: The Jest tests are run with the `jest-junit` reporter, which outputs XML files to the `test-results/` directory. The `junit 'test-results/*.xml'` post-step in the Jenkinsfile tells Jenkins to parse these XML files and display the results in Blue Ocean's Tests tab.

**Q: How does Email Notification work?**
A: The Jenkinsfile uses the `emailext` function (from the Email Extension plugin) in the `post` block. On success or failure, it sends an email with the job name, build number, and build URL. This requires the SMTP server to be configured in Jenkins system settings.

---

## Troubleshooting

### Minikube won't start
```bash
minikube delete
minikube start
```

### Jenkins can't connect to GitHub
- Check your Git credentials in Jenkins (Manage Jenkins > Credentials)
- Ensure the repo URL is correct
- Try cloning the repo manually to test: `git clone <repo-url>`

### Docker build fails
- Make sure Docker Desktop is running
- Check if the Dockerfile exists in the project root
- Run `docker build -t devops-taskboard:test .` manually to see the error

### kubectl commands fail
- Make sure Minikube is running: `minikube status`
- Reset kubectl context: `kubectl config use-context minikube`

### App not accessible after deploy
- Get the correct URL: `minikube service devops-taskboard-service --url`
- Check pod status: `kubectl get pods` (should show Running, not CrashLoopBackOff)
- Check pod logs: `kubectl logs deployment/devops-taskboard`

### Pipeline passes but app shows old version
- Hard refresh the browser (Ctrl+Shift+R)
- Check that `kubectl rollout restart` ran successfully in the deploy logs
- Verify the pod restarted: `kubectl get pods` (AGE should be recent)
