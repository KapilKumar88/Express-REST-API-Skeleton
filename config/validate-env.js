const crypto = require("node:crypto");

const errors = [];

const require32Chars = (name) => {
  const val = process.env[name];
  if (!val) {
    errors.push(`${name} is required`);
  } else if (val.length < 32) {
    errors.push(`${name} must be at least 32 characters (got ${val.length})`);
  }
};

const requirePresent = (name) => {
  if (!process.env[name]) errors.push(`${name} is required`);
};

// Database
requirePresent("MONGO_CONNECTION_STRING");

// JWT signing keys — each must be ≥ 32 chars and must differ from each other
require32Chars("JWT_SECRET");
require32Chars("JWT_REFRESH_TOKEN_SECRET");

if (
  process.env.JWT_SECRET &&
  process.env.JWT_REFRESH_TOKEN_SECRET &&
  process.env.JWT_SECRET === process.env.JWT_REFRESH_TOKEN_SECRET
) {
  errors.push(
    "JWT_SECRET and JWT_REFRESH_TOKEN_SECRET must be different values"
  );
}

// Encryption
const encSecret = process.env.ENCRYPTION_SECRET;
if (!encSecret) {
  errors.push("ENCRYPTION_SECRET is required");
} else if (!/^[0-9a-fA-F]{64}$/.test(encSecret)) {
  errors.push("ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)");
}

const encAlgorithm = process.env.ENCRYPTION_ALGORITHM;
if (!encAlgorithm) {
  errors.push("ENCRYPTION_ALGORITHM is required");
} else if (!crypto.getCiphers().includes(encAlgorithm.toLowerCase())) {
  errors.push(
    `ENCRYPTION_ALGORITHM "${encAlgorithm}" is not a supported cipher — run \`node -e "require('crypto').getCiphers().forEach(c=>console.log(c))"\` to list valid values`
  );
}

// Mail — all required so the app can send verification and reset emails
requirePresent("MAIL_HOST");
requirePresent("MAIL_PORT");
requirePresent("MAIL_USERNAME");
requirePresent("MAIL_PASSWORD");
requirePresent("MAIL_FROM_ADDRESS");

if (errors.length > 0) {
  throw new Error(
    `\nApp startup aborted — missing or invalid environment variables:\n` +
      errors.map((e) => `  • ${e}`).join("\n") +
      `\n\nCopy .env.example to .env and fill in all required values.\n`
  );
}
