const supertest = require('supertest');
const app = require('../app.js');
const faker = require('faker');

describe('Validation tests for the Authentication API\'s', () => {

    test.each([
        { testTitle: "\"name\" field required validation", name: '', email: '', password: '', expected: { status: false, statusCode: 422, statusMessage: '"name" is not allowed to be empty' } },
        { testTitle: "\"name\" field max length validation", name: faker.lorem.words(50), email: '', password: '', expected: { status: false, statusCode: 422, statusMessage: "\"name\" length must be less than or equal to 50 characters long" } },
        { testTitle: "\"name\" field string validation", name: faker.datatype.number(), email: '', password: '', expected: { status: false, statusCode: 422, statusMessage: "\"name\" must be a string" } },
        { testTitle: "\"email\" field required validation", name: faker.name.findName(), email: '', password: '', expected: { status: false, statusCode: 422, statusMessage: "\"email\" is not allowed to be empty" } },
        { testTitle: "\"email\" field string validation", name: faker.name.findName(), email: faker.datatype.number(), password: '', expected: { status: false, statusCode: 422, statusMessage: "\"email\" must be a string" } },
        { testTitle: "\"password\" field required validation", name: faker.name.findName(), email: faker.internet.exampleEmail(), password: '', expected: { status: false, statusCode: 422, statusMessage: '"password" is not allowed to be empty' } },
        { testTitle: "\"password\" field min length validation", name: faker.name.findName(), email: faker.internet.exampleEmail(), password: faker.internet.password(5), expected: { status: false, statusCode: 422, statusMessage: "\"password\" length must be at least 8 characters long" } },
        { testTitle: "\"repeat_password\" field required validation", name: faker.name.findName(), email: faker.internet.exampleEmail(), password: faker.internet.password(8), expected: { status: false, statusCode: 422, statusMessage: "\"password\" missing required peer \"repeat_password\"" } },
        { testTitle: "\"repeat_password\" field mismatch validation", name: faker.name.findName(), email: faker.internet.exampleEmail(), password: faker.internet.password(8), repeat_password: faker.internet.password(8), expected: { status: false, statusCode: 422, statusMessage: "\"repeat_password\" must be [ref:password]" } },
    ])(`Validation test (Endpoint: /register): $testTitle`, async (params) => {
        let { expected, testTitle, ...payload } = params;
        let response = await supertest(app).post('/register').send(payload);
        expect(response.body).toEqual(expected);
    });

    test.each([
        { testTitle: "\"email\" field required validation", email: '', password: '', expected: { status: false, statusCode: 422, statusMessage: "\"email\" is not allowed to be empty" } },
        { testTitle: "\"email\" field string validation", email: faker.datatype.number(), password: '', expected: { status: false, statusCode: 422, statusMessage: "\"email\" must be a string" } },
        { testTitle: "\"password\" field required validation", email: faker.internet.exampleEmail(), password: '', expected: { status: false, statusCode: 422, statusMessage: '"password" is not allowed to be empty' } },
    ])(`Validation test (Endpoint: /login): $testTitle`, async (params) => {
        let { expected, testTitle, ...payload } = params;
        let response = await supertest(app).post('/login').send(payload);
        expect(response.body).toEqual(expected);
    });
});

describe('Testing register API (Endpoint: "/register")', () => {
    test("200 test", async () => {
        let pwd = faker.internet.password(8);
        let response = await supertest(app).post('/register').send({
            name: faker.name.findName(),
            email: faker.internet.exampleEmail(),
            password: pwd,
            repeat_password: pwd
        });

        expect(response.body).toEqual({
            status: true,
            statusCode: 200,
            statusMessage: 'Registered Successfully'
        });

    });
});

describe('Testing login API (Endpoint: "/login")', () => {
    let email = faker.internet.exampleEmail();
    let pwd = faker.internet.password(8);

    beforeAll(async () => {
        await supertest(app).post('/register').send({
            name: faker.name.findName(),
            email: email,
            password: pwd,
            repeat_password: pwd
        });
    });

    test('test for the 401 code', async () => {
        let response = await supertest(app).post('/login').send({
            email: faker.internet.exampleEmail(),
            password: faker.internet.password(),
        });
        expect(response.body).toEqual({
            status: false,
            statusCode: 401,
            statusMessage: "Invalid emailId and password"
        });
    });

    test('test for the 200 code', async () => {
        let response = await supertest(app).post('/login').send({
            email: email,
            password: pwd,
        });

        expect(response.body).toEqual(
            expect.objectContaining({
                status: true,
                statusCode: 200,
                statusMessage: 'Login Successfully',
                data: {
                    token: expect.any(String)
                }
            })
        );
    });
});