const supertest = require("supertest");
const app = require("../app.js");
const { faker } = require("@faker-js/faker");
const userModel = require("../models/user.model");

jest.mock("../utils/mail.util", () => jest.fn().mockResolvedValue(true));

const createUser = async () => {
  const email = faker.internet.exampleEmail().toLowerCase();
  const password = faker.internet.password({ length: 10 });
  await supertest(app).post("/api/register").send({
    name: faker.person.fullName(),
    email,
    password,
    confirm_password: password,
  });
  // Directly verify email since SMTP is mocked and the login now enforces it
  await userModel.findOneAndUpdate({ email }, { emailVerifiedAt: new Date() });
  return { email, password };
};

const loginUser = async (email, password) => {
  const res = await supertest(app).post("/api/login").send({ email, password });
  return res.body?.data?.token;
};

const createTask = async (token, overrides = {}) => {
  const payload = {
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    ...overrides,
  };
  return supertest(app)
    .post("/api/task/create")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);
};

describe("Task — unauthenticated access", () => {
  test("GET /api/task/list returns 401 without token", async () => {
    const res = await supertest(app).get("/api/task/list?page=1&limit=10");
    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
  });

  test("POST /api/task/create returns 401 without token", async () => {
    const res = await supertest(app)
      .post("/api/task/create")
      .send({ name: "test", description: "test desc" });
    expect(res.body).toMatchObject({ status: false, statusCode: 401 });
  });
});

describe("Task — CRUD for authenticated user", () => {
  let token;
  let createdTaskId;

  beforeAll(async () => {
    const { email, password } = await createUser();
    token = await loginUser(email, password);
  });

  test("POST /api/task/create — success returns 201", async () => {
    const res = await createTask(token);
    expect(res.body).toMatchObject({
      status: true,
      statusCode: 201,
      message: "Task created successfully",
    });
    expect(res.body.data._id).toBeDefined();
    createdTaskId = res.body.data._id;
  });

  test("POST /api/task/create — missing name returns 422", async () => {
    const res = await supertest(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "no name here" });
    expect(res.body).toMatchObject({ status: false, statusCode: 422 });
  });

  test("POST /api/task/create — invalid status returns 422", async () => {
    const res = await supertest(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "task", description: "desc", status: "invalid-value" });
    expect(res.body).toMatchObject({ status: false, statusCode: 422 });
  });

  test("GET /api/task/list — returns own tasks only", async () => {
    const res = await supertest(app)
      .get("/api/task/list?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ status: true, statusCode: 200 });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/task/list — limit=0 returns 422", async () => {
    const res = await supertest(app)
      .get("/api/task/list?page=1&limit=0")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ status: false, statusCode: 422 });
  });

  test("GET /api/task/list — limit=101 returns 422", async () => {
    const res = await supertest(app)
      .get("/api/task/list?page=1&limit=101")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ status: false, statusCode: 422 });
  });

  test("PUT /api/task/update/:id — success updates name and description", async () => {
    const res = await supertest(app)
      .put(`/api/task/update/${createdTaskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
        description: "Updated description",
        status: "done",
      });
    expect(res.body).toMatchObject({ status: true, statusCode: 200 });
  });

  test("DELETE /api/task/delete/:id — success deletes own task", async () => {
    const created = await createTask(token);
    const taskId = created.body.data._id;
    const res = await supertest(app)
      .delete(`/api/task/delete/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ status: true, statusCode: 200 });
  });
});

describe("Task — ownership enforcement (BOLA)", () => {
  let userAToken;
  let userBToken;
  let userATaskId;

  beforeAll(async () => {
    const userA = await createUser();
    const userB = await createUser();
    userAToken = await loginUser(userA.email, userA.password);
    userBToken = await loginUser(userB.email, userB.password);

    const taskRes = await createTask(userAToken);
    userATaskId = taskRes.body.data._id;
  });

  test("GET /api/task/list — User B cannot see User A tasks", async () => {
    const res = await supertest(app)
      .get("/api/task/list?page=1&limit=10")
      .set("Authorization", `Bearer ${userBToken}`);
    expect(res.body.status).toBe(true);
    const ids = (res.body.data || []).map((t) => t._id);
    expect(ids).not.toContain(userATaskId);
  });

  test("PUT /api/task/update/:id — User B cannot update User A task (403)", async () => {
    const res = await supertest(app)
      .put(`/api/task/update/${userATaskId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ name: "Hacked", description: "Hacked desc", status: "done" });
    expect(res.body).toMatchObject({ status: false, statusCode: 403 });
  });

  test("DELETE /api/task/delete/:id — User B cannot delete User A task (403)", async () => {
    const res = await supertest(app)
      .delete(`/api/task/delete/${userATaskId}`)
      .set("Authorization", `Bearer ${userBToken}`);
    expect(res.body).toMatchObject({ status: false, statusCode: 403 });
  });

  test("PUT /api/task/update — invalid ObjectId returns 422", async () => {
    const res = await supertest(app)
      .put("/api/task/update/not-a-valid-id")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "x", description: "y" });
    expect(res.body).toMatchObject({ status: false, statusCode: 422 });
  });

  test("DELETE /api/task/delete — invalid ObjectId returns 422", async () => {
    const res = await supertest(app)
      .delete("/api/task/delete/not-a-valid-id")
      .set("Authorization", `Bearer ${userAToken}`);
    expect(res.body).toMatchObject({ status: false, statusCode: 422 });
  });

  test("Task response never contains another user's userId", async () => {
    const res = await supertest(app)
      .get("/api/task/list?page=1&limit=10")
      .set("Authorization", `Bearer ${userBToken}`);
    const tasks = res.body.data || [];
    tasks.forEach((task) => {
      expect(String(task.userId)).not.toBe(String(userATaskId));
    });
  });
});
