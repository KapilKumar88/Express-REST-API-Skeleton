#!/usr/bin/env node

"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env");
const ENV_EXAMPLE = path.join(ROOT, ".env.example");

// bytes: entropy source size; minLength: minimum acceptable length to be
// considered "already set" (catches placeholders like <...> or short stubs).
// ENCRYPTION_SECRET must be exactly 32 bytes → 64 hex chars (AES-256 key).
const SECRET_CONFIGS = [
  { key: "JWT_SECRET", bytes: 64, minLength: 32 },
  { key: "JWT_REFRESH_TOKEN_SECRET", bytes: 64, minLength: 32 },
  { key: "ENCRYPTION_SECRET", bytes: 32, minLength: 64 },
];

function generateSecret(bytes) {
  return crypto.randomBytes(bytes).toString("hex");
}

function parseEnvFile(content) {
  const lines = content.split("\n");
  const result = { lines, map: new Map() };

  lines.forEach((line, idx) => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)/);
    if (match) result.map.set(match[1], idx);
  });

  return result;
}

function applySecrets(parsed, secrets) {
  const updated = [...parsed.lines];

  for (const [key, value] of Object.entries(secrets)) {
    const idx = parsed.map.get(key);
    if (idx === undefined) {
      updated.push(`${key}=${value}`);
    } else {
      updated[idx] = `${key}=${value}`;
    }
  }

  return updated.join("\n");
}

async function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function ensureEnvExists() {
  if (fs.existsSync(ENV_FILE)) return;
  if (!fs.existsSync(ENV_EXAMPLE)) {
    console.error("Error: neither .env nor .env.example found.");
    process.exit(1);
  }
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
  console.info("Created .env from .env.example");
}

function isPlaceholder(value, minLength) {
  return (
    !value ||
    value.startsWith("<") ||
    value.startsWith("change_me") ||
    value.length < minLength
  );
}

function classifyKeys(parsed) {
  const keysToGenerate = [];
  const keysToSkip = [];

  for (const { key, minLength } of SECRET_CONFIGS) {
    const idx = parsed.map.get(key);
    const currentValue =
      idx === undefined ? "" : parsed.lines[idx].split("=").slice(1).join("=");

    if (isPlaceholder(currentValue, minLength)) {
      keysToGenerate.push(key);
    } else {
      keysToSkip.push(key);
    }
  }

  return { keysToGenerate, keysToSkip };
}

async function confirmForce(keysToSkip) {
  const answer = await confirm(
    `--force will overwrite existing secrets for: ${keysToSkip.join(", ")}.\nThis will invalidate active sessions. Continue? [y/N] `
  );
  if (answer !== "y" && answer !== "yes") {
    console.info("Aborted.");
    process.exit(0);
  }
}

function resolveCurrentValue(parsed, key) {
  const idx = parsed.map.get(key);
  return idx === undefined
    ? ""
    : parsed.lines[idx].split("=").slice(1).join("=");
}

async function main() {
  const forceFlag =
    process.argv.includes("--force") || process.argv.includes("-f");

  ensureEnvExists();

  const content = fs.readFileSync(ENV_FILE, "utf8");
  const parsed = parseEnvFile(content);
  const { keysToGenerate, keysToSkip } = classifyKeys(parsed);

  if (keysToSkip.length > 0 && !forceFlag) {
    console.info(
      "\nThe following keys already have values and will be skipped:"
    );
    keysToSkip.forEach((k) => console.info(`  - ${k}`));
    console.info(
      "\nUse --force to regenerate all secrets (this will overwrite existing values).\n"
    );
  }

  const targetKeys = forceFlag
    ? SECRET_CONFIGS.map((c) => c.key)
    : keysToGenerate;

  if (targetKeys.length === 0) {
    console.info("All secret keys are already set. Nothing to do.");
    return;
  }

  if (forceFlag && keysToSkip.length > 0) {
    await confirmForce(keysToSkip);
  }

  const configByKey = Object.fromEntries(SECRET_CONFIGS.map((c) => [c.key, c]));
  const secrets = {};
  for (const key of targetKeys) {
    secrets[key] = generateSecret(configByKey[key].bytes);
  }

  // JWT_SECRET and JWT_REFRESH_TOKEN_SECRET must differ (validate-env.js enforces this at boot).
  // Use the newly generated value if being regenerated, otherwise the existing value.
  const jwtSecret =
    secrets["JWT_SECRET"] ?? resolveCurrentValue(parsed, "JWT_SECRET");
  const jwtRefresh =
    secrets["JWT_REFRESH_TOKEN_SECRET"] ??
    resolveCurrentValue(parsed, "JWT_REFRESH_TOKEN_SECRET");

  if (jwtSecret && jwtRefresh && jwtSecret === jwtRefresh) {
    console.error(
      "Error: JWT_SECRET and JWT_REFRESH_TOKEN_SECRET must differ. Re-run the script."
    );
    process.exit(1);
  }

  const newContent = applySecrets(parsed, secrets);
  fs.writeFileSync(ENV_FILE, newContent, "utf8");

  console.info("\nGenerated and written to .env:");
  for (const [key, value] of Object.entries(secrets)) {
    console.info(`  ${key}=${value.slice(0, 8)}...(${value.length} chars)`);
  }
  console.info("\nDone. Keep .env out of version control.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
