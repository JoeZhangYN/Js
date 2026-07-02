import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/dom/http.js");
const ownerTest = path.normalize("src/dom/http.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const violations = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function rel(file) {
  return path.normalize(file).replaceAll("\\", "/");
}

const ownerText = read(owner);
for (const required of [
  "HTTP_REQUEST_FAILURE_KEY",
  "HVAA:lastHttpRequestFailure",
  "recordHttpRequestFailure",
  'capability: HTTP_CAPABILITY',
  'recordHttpRequestFailure("retryScheduled"',
  'recordHttpRequestFailure("finalFailure"',
  "attempts: retries + 1",
  "maxAttempts: MAX_RETRIES + 1",
  "retryDelayMs",
  "onFailure(",
  "[HVAA] HTTP request failed",
  "HTTP retry/failure handling must not depend on diagnostic storage.",
  "Console hooks must not block HTTP failure callbacks.",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own HTTP failure evidence ${required}`);
  }
}

if (/onFailure\(\{\s*kind:\s*"networkError"/.test(ownerText)) {
  violations.push(`${rel(owner)} must not call network failure handlers with raw objects`);
}
if (/onFailure\(\{\s*kind:\s*"httpStatus"/.test(ownerText)) {
  violations.push(`${rel(owner)} must not call HTTP status failure handlers with raw objects`);
}

const ownerTestText = read(ownerTest);
for (const required of [
  "HTTP_REQUEST_FAILURE_KEY",
  "reports non-success HTTP status instead of silently dropping the request",
  "reports final network failure after retry attempts are exhausted",
  "records retry evidence before the final network failure",
  "records final failures even when no caller failure handler exists",
  "keeps failure callbacks working when diagnostics are blocked",
  "storage blocked",
  "console blocked",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(`${rel(ownerTest)} must cover HTTP failure evidence ${required}`);
  }
}

const diagnosticKeysText = read(diagnosticKeys);
for (const required of [
  "HTTP_REQUEST_FAILURE: \"HVAA:lastHttpRequestFailure\"",
  'source("httpRequestFailure", DiagnosticEvidenceKey.HTTP_REQUEST_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${rel(diagnosticKeys)} must expose HTTP request failure ${required}`);
  }
}

const diagnosticTestText = read(diagnosticTest);
for (const required of [
  "HVAA:lastHttpRequestFailure",
  "httpRequestFailure",
  'capability: "httpRequest"',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${rel(diagnosticTest)} must read HTTP request evidence ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-http-request-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-http-request-boundary] OK - HTTP failures persist diagnostic evidence");
