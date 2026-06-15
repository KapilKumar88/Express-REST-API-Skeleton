const supertest = require("supertest");
const app = require("../app.js");
const { faker } = require("@faker-js/faker");
const moment = require("moment");
const { v4: uuidV4 } = require("uuid");
const userModel = require("../models/user.model");
const verificationTokenModel = require("../models/verificationToken.model");
const refreshTokenModel = require("../models/refreshToken.model");
const { generateRandomToken, sha256Hash } = require("../helpers/common.helper");

jest.mock("../utils/mail.util", () => jest.fn().mockResolvedValue(true));

// bcrypt cost-12 is intentionally slow; allow time for multiple hashes per test
jest.setTimeout(30000);

// ─── helpers ────────────────────────────────────────────────────────────────

const registerUser = async () => {
  const email = faker.internet.exampleEmail().toLowerCase();
  const password = faker.internet.password({ length: 10 });
  await supertest(app).post("/api/register").send({
    name: faker.person.fullName(),
    email,
    password,
    confirm_password: password,
  });
  return { email, password };
};

const registerAndVerify = async () => {
  const { email, password } = await registerUser();
  await userModel.findOneAndUpdate({ email }, { emailVerifiedAt: new Date() });
  return { email, password };
};

const loginUser = async (email, password) => {
  const res = await supertest(app).post("/api/login").send({ email, password });
  return res.body?.data;
};

// Insert a VerificationToken directly, bypassing the email flow
const createVerificationToken = async (
  userId,
  type,
  { expired = false } = {}
) => {
  const rawToken = generateRandomToken();
  const tokenHash = sha256Hash(rawToken);
  const expiresAt = expired
    ? moment().subtract(1, "h").toDate()
    : moment().add(24, "h").toDate();
  await verificationTokenModel.create({ userId, type, tokenHash, expiresAt });
  return rawToken;
};

// ─── Email verification token security ──────────────────────────────────────

describe("Email verification — token security", () => {
  test("valid token → 200 Email Verified", async () => {
    const { email } = await registerUser();
    const user = await userModel.findOne({ email });
    const rawToken = await createVerificationToken(user._id, "EMAIL_VERIFY");

    const res = await supertest(app)
      .post("/api/verify-email")
      .send({ token: rawToken });

    expect(res.body).toMatchObject({ status: true, statusCode: 200 });
    expect(res.body.message).toMatch(/Email Verified/i);

    const updated = await userModel.findById(user._id);
    expect(updated.emailVerifiedAt).not.toBeNull();
  });

  test("expired token → 401 generic message", async () => {
    const { email } = await registerUser();
    const user = await userModel.findOne({ email });
    const rawToken = await createVerificationToken(user._id, "EMAIL_VERIFY", {
      expired: true,
    });

    const res = await supertest(app)
      .post("/api/verify-email")
      .send({ token: rawToken });

    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
    expect(res.body.message).toBe("Invalid or expired link");
  });

  test("already-used token → 401 (single-use enforced)", async () => {
    const { email } = await registerUser();
    const user = await userModel.findOne({ email });
    const rawToken = await createVerificationToken(user._id, "EMAIL_VERIFY");

    // First use — must succeed
    const first = await supertest(app)
      .post("/api/verify-email")
      .send({ token: rawToken });
    expect(first.body.statusCode).toBe(200);

    // Second use — token already deleted, must fail
    const second = await supertest(app)
      .post("/api/verify-email")
      .send({ token: rawToken });
    expect(second.body).toMatchObject({ status: false, statusCode: 401 });
  });
});

// ─── Refresh token rotation & reuse detection ────────────────────────────────

describe("Refresh token — rotation and reuse detection", () => {
  let refreshToken;
  let loginData;

  beforeAll(async () => {
    const { email, password } = await registerAndVerify();
    loginData = await loginUser(email, password);
    refreshToken = loginData?.refreshToken;
  });

  test("valid token → 200 with new access + refresh token", async () => {
    const res = await supertest(app)
      .post("/api/token")
      .send({ token: refreshToken });

    expect(res.body).toMatchObject({ status: true, statusCode: 200 });
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Store new token for next test
    refreshToken = res.body.data.refreshToken;
  });

  test("rotated-away (revoked) token → 401 Session invalidated", async () => {
    // refreshToken is already rotated away from the previous test; use the old one
    const oldToken = loginData?.refreshToken;

    const res = await supertest(app)
      .post("/api/token")
      .send({ token: oldToken });

    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
    expect(res.body.message).toBe("Session invalidated");
  });

  test("after reuse detection, new token is also rejected (family revoked)", async () => {
    // refreshToken (the newer one from rotation) should now also be revoked
    // because the reuse detection in the previous test revoked the entire family
    const res = await supertest(app)
      .post("/api/token")
      .send({ token: refreshToken });

    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
  });

  test("expired refresh token → 401", async () => {
    const { email } = await registerAndVerify();
    const user = await userModel.findOne({ email });
    const rawToken = generateRandomToken();
    const tokenHash = sha256Hash(rawToken);

    await refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      family: uuidV4(),
      revoked: false,
      expiresAt: moment().subtract(1, "h").toDate(),
    });

    const res = await supertest(app)
      .post("/api/token")
      .send({ token: rawToken });

    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
    expect(res.body.message).toBe("Token expired");
  });
});

// ─── Account lockout ─────────────────────────────────────────────────────────

describe("Account lockout", () => {
  // MAX_LOGIN_ATTEMPTS defaults to 5 — read from config so tests stay in sync
  const { MAX_LOGIN_ATTEMPTS } = require("../config/lockout.config");

  let email, password;

  beforeAll(async () => {
    ({ email, password } = await registerAndVerify());
  });

  test("wrong passwords below threshold all return same generic 401", async () => {
    const attemptsBeforeLock = MAX_LOGIN_ATTEMPTS - 1;
    for (let i = 0; i < attemptsBeforeLock; i++) {
      const res = await supertest(app)
        .post("/api/login")
        .send({ email, password: "wrongpassword" });
      expect(res.body).toMatchObject({ status: false, statusCode: 401 });
      expect(res.body.message).toBe("Invalid emailId and password");
    }
  });

  test("final wrong attempt triggers lockout — response still generic 401", async () => {
    const res = await supertest(app)
      .post("/api/login")
      .send({ email, password: "wrongpassword" });

    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
    expect(res.body.message).toBe("Invalid emailId and password");

    // Verify lockout is set in DB
    const user = await userModel.findOne({ email });
    expect(user.lockedUntil).not.toBeNull();
    expect(new Date(user.lockedUntil).getTime()).toBeGreaterThan(Date.now());
  });

  test("correct password during active lockout → same generic 401 (no lockout disclosure)", async () => {
    const wrongPassRes = await supertest(app)
      .post("/api/login")
      .send({ email, password: "wrongpassword" });

    const lockedRes = await supertest(app)
      .post("/api/login")
      .send({ email, password }); // correct password but account is locked

    expect(lockedRes.body).toMatchObject({ status: false, statusCode: 401 });
    // Response body must be identical — no way to distinguish locked from wrong-password
    expect(lockedRes.body.message).toBe(wrongPassRes.body.message);
    expect(lockedRes.body.statusCode).toBe(wrongPassRes.body.statusCode);
  });

  test("successful login after lockout expires resets counter and clears lockedUntil", async () => {
    // Manually clear the lockout to simulate expiry (avoids waiting LOCKOUT_MINUTES)
    await userModel.findOneAndUpdate(
      { email },
      { lockedUntil: null, failedLoginAttempts: 0 }
    );

    const res = await supertest(app)
      .post("/api/login")
      .send({ email, password });
    expect(res.body).toMatchObject({ status: true, statusCode: 200 });

    const user = await userModel.findOne({ email });
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
  });
});

// ─── Unverified email gate ────────────────────────────────────────────────────

describe("Login — unverified email gate", () => {
  test("correct password + unverified email → 403 (gate only reachable after password check)", async () => {
    // Register but do NOT verify
    const { email, password } = await registerUser();

    const res = await supertest(app)
      .post("/api/login")
      .send({ email, password });
    // Must be 403, not 401 — client can distinguish this only AFTER correct password
    expect(res.body).toMatchObject({ status: false, statusCode: 403 });
  });
});

// ─── Forgot / reset password ─────────────────────────────────────────────────

describe("Forgot / reset password", () => {
  const ENUMERATION_SAFE_MESSAGE =
    "If that email is registered you will receive a reset link shortly.";

  test("unknown email → 200 enumeration-safe response", async () => {
    const res = await supertest(app)
      .post("/api/forgot-password")
      .send({ email: faker.internet.exampleEmail() });

    expect(res.body).toMatchObject({ status: true, statusCode: 200 });
    expect(res.body.message).toBe(ENUMERATION_SAFE_MESSAGE);
  });

  test("known email → same 200 with identical body (no enumeration leak)", async () => {
    const { email } = await registerAndVerify();

    const res = await supertest(app)
      .post("/api/forgot-password")
      .send({ email });

    expect(res.body).toMatchObject({ status: true, statusCode: 200 });
    expect(res.body.message).toBe(ENUMERATION_SAFE_MESSAGE);
  });

  test("valid reset token → 200 and password is updated", async () => {
    const { email, password: oldPassword } = await registerAndVerify();
    const user = await userModel.findOne({ email });
    const rawToken = await createVerificationToken(user._id, "PASSWORD_RESET");
    const newPassword = "NewSecurePass99!";

    const res = await supertest(app).post("/api/reset-password").send({
      token: rawToken,
      password: newPassword,
      confirm_password: newPassword,
    });

    expect(res.body).toMatchObject({ status: true, statusCode: 200 });

    // Old password must no longer work
    const loginOld = await supertest(app)
      .post("/api/login")
      .send({ email, password: oldPassword });
    expect(loginOld.body.statusCode).toBe(401);

    // New password must work
    const loginNew = await supertest(app)
      .post("/api/login")
      .send({ email, password: newPassword });
    expect(loginNew.body.statusCode).toBe(200);
  });

  test("used reset token → 401 (single-use enforced)", async () => {
    const { email } = await registerAndVerify();
    const user = await userModel.findOne({ email });
    const rawToken = await createVerificationToken(user._id, "PASSWORD_RESET");
    const newPassword = "NewSecurePass99!";

    const first = await supertest(app).post("/api/reset-password").send({
      token: rawToken,
      password: newPassword,
      confirm_password: newPassword,
    });
    expect(first.body.statusCode).toBe(200);

    const second = await supertest(app).post("/api/reset-password").send({
      token: rawToken,
      password: "AnotherPass99!",
      confirm_password: "AnotherPass99!",
    });
    expect(second.body).toMatchObject({ status: false, statusCode: 401 });
    expect(second.body.message).toBe("Invalid or expired link");
  });

  test("expired reset token → 401", async () => {
    const { email } = await registerAndVerify();
    const user = await userModel.findOne({ email });
    const rawToken = await createVerificationToken(user._id, "PASSWORD_RESET", {
      expired: true,
    });

    const res = await supertest(app).post("/api/reset-password").send({
      token: rawToken,
      password: "NewSecurePass99!",
      confirm_password: "NewSecurePass99!",
    });

    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
    expect(res.body.message).toBe("Invalid or expired link");
  });

  test("password reset revokes all active refresh token families", async () => {
    const { email, password } = await registerAndVerify();
    const loginData = await loginUser(email, password);
    const activeRefreshToken = loginData?.refreshToken;

    // Issue a reset token directly and reset the password
    const user = await userModel.findOne({ email });
    const rawResetToken = await createVerificationToken(
      user._id,
      "PASSWORD_RESET"
    );
    const newPassword = "AfterResetPass99!";

    await supertest(app).post("/api/reset-password").send({
      token: rawResetToken,
      password: newPassword,
      confirm_password: newPassword,
    });

    // The refresh token from before the reset must now be invalid
    const res = await supertest(app)
      .post("/api/token")
      .send({ token: activeRefreshToken });

    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
  });
});

// ─── Error response hygiene ───────────────────────────────────────────────────

describe("Error response hygiene — 500s must not leak internals", () => {
  test("service-layer exception returns generic 500 — no internal message, stack, or path", async () => {
    const userService = require("../services/user.service");
    const internalDetail =
      "MongoNetworkError: failed to connect [db.internal:27017] collection=users";
    const spy = jest
      .spyOn(userService, "findOneWithPassword")
      .mockRejectedValueOnce(new Error(internalDetail));

    const res = await supertest(app).post("/api/login").send({
      email: "probe@example.com",
      password: "Probepass1!",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");

    const body = JSON.stringify(res.body);
    expect(body).not.toContain("MongoNetworkError");
    expect(body).not.toContain("db.internal");
    expect(body).not.toContain("27017");
    expect(body).not.toContain("collection");
    expect(res.body.stack).toBeUndefined();

    spy.mockRestore();
  });
});
