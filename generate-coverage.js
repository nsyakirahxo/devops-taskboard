/**
 * Code Coverage Threshold Enforcement Script
 * Validates that code coverage meets minimum thresholds
 * Supports both backend (Jest) and frontend coverage analysis
 */

const fs = require("fs");
const path = require("path");

// Minimum coverage thresholds as per requirements
const thresholds = {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 80,
};

// Coverage report paths - check both backend and frontend
const BACKEND_COVERAGE_DIR = path.join(__dirname, "coverage", "backend");
const FRONTEND_COVERAGE_DIR = path.join(__dirname, "coverage", "frontend");
const BACKEND_SUMMARY_FILE = path.join(
  BACKEND_COVERAGE_DIR,
  "coverage-summary.json"
);
const FRONTEND_SUMMARY_FILE = path.join(
  FRONTEND_COVERAGE_DIR,
  "coverage-summary.json"
);

/**
 * Read and parse coverage summary from a file
 */
function readCoverageSummary(filePath, type) {
  if (!fs.existsSync(filePath)) {
    console.log(`\n⚠️  ${type} coverage summary file not found.`);
    console.log(`   Expected: ${filePath}`);
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(
      `\n❌ Failed to parse ${type} coverage summary:`,
      error.message
    );
    return null;
  }
}

/**
 * Extract coverage percentage for a specific metric
 */
function getCoveragePercentage(coverageData, metric) {
  if (coverageData && coverageData.total && coverageData.total[metric]) {
    return coverageData.total[metric].pct;
  }
  return 0;
}

/**
 * Format percentage for display
 */
function formatPercentage(value) {
  return value.toFixed(2) + "%";
}

/**
 * Get status icon based on pass/fail
 */
function getStatusIcon(passed) {
  return passed ? "✅" : "❌";
}

/**
 * Validate coverage for a specific type (backend or frontend)
 */
function validateCoverageType(type, coverageData) {
  console.log(`\n${type.toUpperCase()} Coverage:`);
  console.log("-".repeat(50));

  // Extract coverage percentages
  const coverage = {
    lines: getCoveragePercentage(coverageData, "lines"),
    statements: getCoveragePercentage(coverageData, "statements"),
    functions: getCoveragePercentage(coverageData, "functions"),
    branches: getCoveragePercentage(coverageData, "branches"),
  };

  // Check each metric against threshold
  const results = {
    lines: coverage.lines >= thresholds.lines,
    statements: coverage.statements >= thresholds.statements,
    functions: coverage.functions >= thresholds.functions,
    branches: coverage.branches >= thresholds.branches,
  };

  console.log(
    `  ${getStatusIcon(results.lines)} Lines:      ${formatPercentage(
      coverage.lines
    ).padEnd(8)} (threshold: ${thresholds.lines}%)`
  );
  console.log(
    `  ${getStatusIcon(results.statements)} Statements: ${formatPercentage(
      coverage.statements
    ).padEnd(8)} (threshold: ${thresholds.statements}%)`
  );
  console.log(
    `  ${getStatusIcon(results.functions)} Functions:  ${formatPercentage(
      coverage.functions
    ).padEnd(8)} (threshold: ${thresholds.functions}%)`
  );
  console.log(
    `  ${getStatusIcon(results.branches)} Branches:   ${formatPercentage(
      coverage.branches
    ).padEnd(8)} (threshold: ${thresholds.branches}%)`
  );

  return {
    coverage,
    results,
    allPassed: Object.values(results).every((r) => r === true),
  };
}

/**
 * Main coverage validation function
 */
function validateCoverage() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 CODE COVERAGE THRESHOLD VALIDATION");
  console.log("=".repeat(60));

  console.log("\nRequired thresholds:");
  console.log(`  • Lines:      ${thresholds.lines}%`);
  console.log(`  • Statements: ${thresholds.statements}%`);
  console.log(`  • Functions:  ${thresholds.functions}%`);
  console.log(`  • Branches:   ${thresholds.branches}%`);

  let overallSuccess = true;
  let hasAnyData = false;

  // Check backend coverage
  const backendData = readCoverageSummary(BACKEND_SUMMARY_FILE, "Backend");
  if (backendData) {
    hasAnyData = true;
    const backendResult = validateCoverageType("Backend", backendData);
    if (!backendResult.allPassed) {
      overallSuccess = false;
    }
  }

  // Check frontend coverage (if available)
  const frontendData = readCoverageSummary(FRONTEND_SUMMARY_FILE, "Frontend");
  if (frontendData) {
    hasAnyData = true;
    const frontendResult = validateCoverageType("Frontend", frontendData);
    if (!frontendResult.allPassed) {
      overallSuccess = false;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));

  if (!hasAnyData) {
    console.log("\n❌ No coverage data found!");
    console.log('   Run "npm run test-backend" or "npm run test-api" first.\n');
    process.exit(1);
  }

  if (overallSuccess) {
    console.log("\n🎉 SUCCESS! All coverage thresholds met.");
    console.log("=".repeat(60) + "\n");
    process.exit(0);
  } else {
    console.log("\n❌ FAILURE! Some coverage thresholds not met.");
    console.log("   Review the metrics above and improve test coverage.");
    console.log("=".repeat(60) + "\n");
    process.exit(1);
  }
}

// Run validation
validateCoverage();
