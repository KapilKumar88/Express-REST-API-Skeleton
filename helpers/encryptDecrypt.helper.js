const crypto = require("node:crypto");
const appConfig = require("../config/app.config");

const algorithm = appConfig.APP_ENCRYPTION_ALGORITHM;
const secret = appConfig.APP_ENCRYPTION_SECRET;

const getKey = () => {
  if (secret?.length !== 64) {
    throw new Error(
      "ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)"
    );
  }
  return Buffer.from(secret, "hex");
};

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decrypt(text) {
  const [ivHex, authTagHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};
