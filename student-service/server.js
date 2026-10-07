const express = require("express");

const app = express();

app.use(express.json());

const students = [
    {
        id: 1,
        name: "Ankush",
        department: "CS-AI",
        email: "ankush@example.com"
    },
    {
        id: 2,
        name: "Rahul",
        department: "CSE",
        email: "rahul@example.com"
    },
    {
        id: 3,
        name: "Priya",
        department: "ISE",
        email: "priya@example.com"
    },
    {
        id: 4,
        name: "Sneha",
        department: "ECE",
        email: "sneha@example.com"
    }
];

app.get("/students", (req, res) => {
    res.json(students);
});

app.get("/students/:id", (req, res) => {
    const student = students.find(
        s => s.id === parseInt(req.params.id)
    );

    if (!student) {
        return res.status(404).json({
            error: "Student not found",
            requestedId: parseInt(req.params.id)
        });
    }

    res.json(student);
});

app.post("/students", (req, res) => {
    const { name, department, email } = req.body;

    if (!name || !department) {
        return res.status(400).json({
            error: "Name and department are required"
        });
    }

    const newStudent = {
        id: students.length + 1,
        name,
        department,
        email: email || `${name.toLowerCase()}@example.com`
    };

    students.push(newStudent);
    res.status(201).json(newStudent);
});

app.get("/health", (req, res) => {
    res.json({
        service: "student-service",
        status: "healthy",
        count: students.length,
        timestamp: new Date().toISOString()
    });
});

const PORT = 3001;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[student-service] Running on port ${PORT}`);
});