const express = require("express");

const app = express();

app.use(express.json());

const courses = [
    {
        id: 101,
        name: "Machine Learning",
        credits: 4,
        code: "CS401"
    },
    {
        id: 102,
        name: "Computer Networks",
        credits: 3,
        code: "CS302"
    },
    {
        id: 103,
        name: "Database Management Systems",
        credits: 4,
        code: "CS203"
    },
    {
        id: 104,
        name: "Cloud Computing",
        credits: 3,
        code: "CS504"
    }
];

// Response timing middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        res.setHeader("X-Response-Time", `${duration}ms`);
    });
    next();
});

// GET all courses
app.get("/courses", (req, res) => {
    res.json(courses);
});

// GET course by ID
app.get("/courses/:id", (req, res) => {
    const course = courses.find(
        c => c.id === parseInt(req.params.id)
    );

    if (!course) {
        return res.status(404).json({
            error: "Course not found",
            requestedId: parseInt(req.params.id)
        });
    }

    res.json(course);
});

// POST new course
app.post("/courses", (req, res) => {
    const { name, credits, code } = req.body;
    if (!name || !credits) {
        return res.status(400).json({ error: "Name and credits are required" });
    }

    const newCourse = {
        id: 100 + courses.length + 1,
        name,
        credits,
        code: code || `CS${100 + courses.length + 1}`
    };

    courses.push(newCourse);
    res.status(201).json(newCourse);
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        service: "course-service",
        status: "healthy",
        count: courses.length,
        timestamp: new Date().toISOString()
    });
});

const PORT = 3002;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`[course-service] Running on port ${PORT}`);
});