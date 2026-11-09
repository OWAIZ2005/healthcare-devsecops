process.env.API_KEY = "test-healthcare-api-key";

const request = require("supertest");
const { app, patients } = require("./server");

describe("Healthcare Patient API", () => {

    beforeEach(() => {
        patients.length = 0;

        patients.push(
            {
                id: 1,
                name: "Demo Patient One",
                age: 30,
                condition: "General Checkup"
            },
            {
                id: 2,
                name: "Demo Patient Two",
                age: 45,
                condition: "Routine Consultation"
            }
        );
    });

    // Test 1: Public health endpoint
    test("GET /health should return healthy status", async () => {
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("healthy");
    });

    // Test 2: Reject missing API key
    test("GET /api/patients should reject missing API key", async () => {
        const response = await request(app).get("/api/patients");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized access");
    });

    // Test 3: Reject incorrect API key
    test("GET /api/patients should reject invalid API key", async () => {
        const response = await request(app)
            .get("/api/patients")
            .set("x-api-key", "wrong-key");

        expect(response.status).toBe(401);
    });

    // Test 4: Allow authenticated access
    test("GET /api/patients should return patients with valid API key", async () => {
        const response = await request(app)
            .get("/api/patients")
            .set("x-api-key", process.env.API_KEY);

        expect(response.status).toBe(200);
        expect(response.body.patients).toHaveLength(2);
    });

    // Test 5: Reject invalid patient data
    test("POST /api/patients should reject invalid patient data", async () => {
        const response = await request(app)
            .post("/api/patients")
            .set("x-api-key", process.env.API_KEY)
            .send({
                name: "A",
                age: 150,
                condition: "X"
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Invalid patient data");
    });

    // Test 6: Register a valid patient
    test("POST /api/patients should register a valid patient", async () => {
        const response = await request(app)
            .post("/api/patients")
            .set("x-api-key", process.env.API_KEY)
            .send({
                name: "Test Patient",
                age: 25,
                condition: "Routine Checkup"
            });

        expect(response.status).toBe(201);
        expect(response.body.patient.name).toBe("Test Patient");
        expect(response.body.patient.id).toBe(3);
    });

});