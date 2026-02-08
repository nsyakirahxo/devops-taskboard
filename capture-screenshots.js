const { chromium } = require('@playwright/test');
const path = require('path');

const JENKINS_URL = 'http://localhost:8080';
const USER = 'admin';
const PASS = 'c99a85de195c45569b9dfd0d1668371c';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

(async () => {
  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    httpCredentials: { username: USER, password: PASS }
  });
  const page = await context.newPage();

  // 1. Login to Jenkins
  await page.goto(`${JENKINS_URL}/login`);
  await page.fill('#j_username', USER);
  await page.fill('input[name="j_password"]', PASS);
  await page.click('button[name="Submit"]');
  await page.waitForURL('**/');
  await page.waitForTimeout(2000);

  // 2. Jenkins Dashboard
  await page.goto(`${JENKINS_URL}/`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-jenkins-dashboard.png'), fullPage: true });
  console.log('Captured: Jenkins Dashboard');

  // 3. Pipeline Job Page
  await page.goto(`${JENKINS_URL}/job/devops-taskboard/`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-pipeline-job.png'), fullPage: true });
  console.log('Captured: Pipeline Job Page');

  // 4. Latest Build Console Output
  await page.goto(`${JENKINS_URL}/job/devops-taskboard/lastSuccessfulBuild/console`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-console-output.png'), fullPage: true });
  console.log('Captured: Console Output');

  // 5. Blue Ocean Dashboard
  await page.goto(`${JENKINS_URL}/blue/organizations/jenkins/pipelines/`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-blueocean-dashboard.png'), fullPage: true });
  console.log('Captured: Blue Ocean Dashboard');

  // 6. Blue Ocean Pipeline Activity
  await page.goto(`${JENKINS_URL}/blue/organizations/jenkins/devops-taskboard/activity`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-blueocean-activity.png'), fullPage: true });
  console.log('Captured: Blue Ocean Activity');

  // 7. Blue Ocean Pipeline Run Detail (latest successful)
  await page.goto(`${JENKINS_URL}/blue/organizations/jenkins/devops-taskboard/detail/main/6/pipeline`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-blueocean-pipeline-run.png'), fullPage: true });
  console.log('Captured: Blue Ocean Pipeline Run');

  // 8-10. Click each stage node in the pipeline graph using direct URL navigation
  const stageNames = ['Build', 'Test', 'Deploy'];
  // Get stage node IDs from Blue Ocean API
  try {
    const nodesResp = await page.evaluate(async (url) => {
      const r = await fetch(url, { credentials: 'include' });
      return r.json();
    }, `${JENKINS_URL}/blue/rest/organizations/jenkins/pipelines/devops-taskboard/runs/6/nodes/`);
    for (let i = 0; i < nodesResp.length && i < stageNames.length; i++) {
      const nodeId = nodesResp[i].id;
      await page.goto(`${JENKINS_URL}/blue/organizations/jenkins/devops-taskboard/detail/main/6/pipeline/${nodeId}`);
      await page.waitForTimeout(3000);
      const num = String(i + 7).padStart(2, '0');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${num}-blueocean-${stageNames[i].toLowerCase()}-stage.png`), fullPage: true });
      console.log(`Captured: Blue Ocean ${stageNames[i]} Stage Detail`);
    }
  } catch (e) { console.log('Skipped stage screenshots:', e.message); }

  // 11. Blue Ocean Test Results
  await page.goto(`${JENKINS_URL}/blue/organizations/jenkins/devops-taskboard/detail/main/6/tests`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-blueocean-test-results.png'), fullPage: true });
  console.log('Captured: Blue Ocean Test Results');

  await browser.close();
  console.log(`\nAll screenshots saved to: ${SCREENSHOTS_DIR}`);
})();
