const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false
}));

// Synthetic demonstration data only
const patients = [
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
];

const patientSchema = z.object({
    name: z.string().trim().min(2).max(100),
    age: z.number().int().min(0).max(120),
    condition: z.string().trim().min(2).max(100)
});

// Public health endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        application: "Healthcare Patient API"
    });
});

// API key authentication
function authenticate(req, res, next) {
    const suppliedKey = req.headers["x-api-key"];

    if (!API_KEY || !suppliedKey) {
        return res.status(401).json({
            error: "Unauthorized access"
        });
    }

    const supplied = Buffer.from(suppliedKey);
    const expected = Buffer.from(API_KEY);

    if (
        supplied.length !== expected.length ||
        !crypto.timingSafeEqual(supplied, expected)
    ) {
        return res.status(401).json({
            error: "Unauthorized access"
        });
    }

    next();
}

// Protected patient records endpoint
app.get("/api/patients", authenticate, (req, res) => {
    res.json({ patients });
});

// Register patient
app.post("/api/patients", authenticate, (req, res) => {
    const result = patientSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid patient data"
        });
    }

    const patient = {
        id: patients.length + 1,
        ...result.data
    };

    patients.push(patient);

    res.status(201).json({
        message: "Patient registered successfully",
        patient
    });
});

// Handle unexpected errors without exposing details
app.use((err, req, res, next) => {
    console.error("Internal application error");

    res.status(500).json({
        error: "Internal server error"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Healthcare API running on port ${PORT}`);
});
