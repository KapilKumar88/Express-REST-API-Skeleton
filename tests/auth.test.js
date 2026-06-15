const supertest = require("supertest");
const app = require("../app.js");
const { faker } = require("@faker-js/faker");
const userModel = require("../models/user.model");

jest.mock("../utils/mail.util", () => jest.fn().mockResolvedValue(true));

describe("Validation tests for the Authentication API's", () => {
  test.each([
    {
      testTitle: '"name" field required validation',
      name: "",
      email: "",
      password: "",
    },
    {
      testTitle: '"name" field max length validation',
      name: faker.lorem.words(50),
      email: "",
      password: "",
    },
    {
      testTitle: '"name" field string validation',
      name: faker.number.int(),
      email: "",
      password: "",
    },
    {
      testTitle: '"email" field required validation',
      name: faker.person.fullName(),
      email: "",
      password: "",
    },
    {
      testTitle: '"email" field string validation',
      name: faker.person.fullName(),
      email: faker.number.int(),
      password: "",
    },
    {
      testTitle: '"password" field required validation',
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: "",
    },
    {
      testTitle: '"password" field min length validation',
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: faker.internet.password({ length: 5 }),
    },
    {
      testTitle: '"confirm_password" field required validation',
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: faker.internet.password({ length: 8 }),
    },
    {
      testTitle: '"confirm_password" field mismatch validation',
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: faker.internet.password({ length: 8 }),
      confirm_password: faker.internet.password({ length: 8 }),
    },
  ])(
    `Validation test (Endpoint: /api/register): $testTitle`,
    async (params) => {
      const { _testTitle, ...payload } = params; // eslint-disable-line no-unused-vars
      const response = await supertest(app).post("/api/register").send(payload);
      expect(response.body).toMatchObject({
        status: false,
        statusCode: 422,
      });
    }
  );

  test.each([
    {
      testTitle: '"email" field required validation',
      email: "",
      password: "",
    },
    {
      testTitle: '"email" field string validation',
      email: faker.number.int(),
      password: "",
    },
    {
      testTitle: '"password" field required validation',
      email: faker.internet.exampleEmail(),
      password: "",
    },
  ])(`Validation test (Endpoint: /api/login): $testTitle`, async (params) => {
    const { _testTitle, ...payload } = params; // eslint-disable-line no-unused-vars
    const response = await supertest(app).post("/api/login").send(payload);
    expect(response.body).toMatchObject({
      status: false,
      statusCode: 422,
    });
  });
});

describe('Testing register API (Endpoint: "/api/register")', () => {
  test("200 success", async () => {
    const pwd = faker.internet.password({ length: 8 });
    const response = await supertest(app).post("/api/register").send({
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: pwd,
      confirm_password: pwd,
    });

    expect(response.body).toMatchObject({
      status: true,
      statusCode: 200,
    });
    expect(response.body.message).toMatch(/Registered Successfully/i);
  });

  test("duplicate email returns same 200 as new registration (enumeration-safe)", async () => {
    const pwd = faker.internet.password({ length: 8 });
    const email = faker.internet.exampleEmail();
    await supertest(app).post("/api/register").send({
      name: faker.person.fullName(),
      email,
      password: pwd,
      confirm_password: pwd,
    });
    const response = await supertest(app).post("/api/register").send({
      name: faker.person.fullName(),
      email,
      password: pwd,
      confirm_password: pwd,
    });
    // Must return 200 — not 409 or 422 — so attackers cannot enumerate registered emails
    expect(response.body).toMatchObject({
      status: true,
      statusCode: 200,
    });
    expect(response.body.message).toMatch(/Registered Successfully/i);
  });

  test("password never returned in response", async () => {
    const pwd = faker.internet.password({ length: 8 });
    const response = await supertest(app).post("/api/register").send({
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: pwd,
      confirm_password: pwd,
    });
    expect(JSON.stringify(response.body)).not.toContain(pwd);
    expect(response.body?.data?.password).toBeUndefined();
  });
});

describe('Testing login API (Endpoint: "/api/login")', () => {
  const email = faker.internet.exampleEmail().toLowerCase();
  const pwd = faker.internet.password({ length: 8 });

  beforeAll(async () => {
    await supertest(app).post("/api/register").send({
      name: faker.person.fullName(),
      email,
      password: pwd,
      confirm_password: pwd,
    });
    // Verify email directly since SMTP is mocked
    await userModel.findOneAndUpdate(
      { email },
      { emailVerifiedAt: new Date() }
    );
  });

  test("401 for wrong password", async () => {
    const response = await supertest(app)
      .post("/api/login")
      .send({
        email,
        password: faker.internet.password({ length: 9 }),
      });
    expect(response.body).toMatchObject({
      status: false,
      statusCode: 401,
    });
  });

  test("401 for unknown email", async () => {
    const response = await supertest(app).post("/api/login").send({
      email: faker.internet.exampleEmail(),
      password: faker.internet.password(),
    });
    expect(response.body).toMatchObject({
      status: false,
      statusCode: 401,
    });
  });

  test("200 with token on valid credentials", async () => {
    const response = await supertest(app).post("/api/login").send({
      email,
      password: pwd,
    });

    expect(response.body).toMatchObject({
      status: true,
      statusCode: 200,
      message: "Login Successfully",
      data: {
        token: expect.any(String),
        tokenExpireAt: expect.any(Number),
        refreshTokenExpireAt: expect.any(Number),
        refreshToken: expect.any(String),
      },
    });
  });

  test("password hash not returned in login response", async () => {
    const response = await supertest(app).post("/api/login").send({
      email,
      password: pwd,
    });
    expect(response.body?.data?.password).toBeUndefined();
  });
});

describe("Protected route access", () => {
  test("401 when Authorization header is missing", async () => {
    const response = await supertest(app).get("/api/task/list?page=1&limit=10");
    expect(response.body).toMatchObject({ status: false, statusCode: 401 });
  });

  test("401 when token is malformed", async () => {
    const response = await supertest(app)
      .get("/api/task/list?page=1&limit=10")
      .set("Authorization", "Bearer notavalidtoken");
    expect(response.statusCode).toBe(401);
  });
});
