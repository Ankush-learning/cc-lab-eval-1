const express = require("express");

const app = express();

app.use(express.json());

const enrollments = [];

const STUDENT_SERVICE_URL =
    process.env.STUDENT_SERVICE_URL || "http://student-service:3001";

const COURSE_SERVICE_URL =
    process.env.COURSE_SERVICE_URL || "http://course-service:3002";

app.post("/enroll", async (req, res) => {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
        return res.status(400).json({
            error: "Invalid payload. Both studentId and courseId are required."
        });
    }

    try {
        const studentResponse = await fetch(
            `${STUDENT_SERVICE_URL}/students/${studentId}`
        );

        if (!studentResponse.ok) {
            return res.status(
                studentResponse.status === 404 ? 404 : 502
            ).json({
                error: "Student validation failed",
                details:
                    studentResponse.status === 404
                        ? "Student does not exist"
                        : "Student service error"
            });
        }

        const student = await studentResponse.json();

        const courseResponse = await fetch(
            `${COURSE_SERVICE_URL}/courses/${courseId}`
        );

        if (!courseResponse.ok) {
            return res.status(
                courseResponse.status === 404 ? 404 : 502
            ).json({
                error: "Course validation failed",
                details:
                    courseResponse.status === 404
                        ? "Course does not exist"
                        : "Course service error"
            });
        }

        const course = await courseResponse.json();

        const enrollment = {
            id: enrollments.length + 1,
            student,
            course,
            status: "ENROLLED",
            enrolledAt: new Date().toISOString()
        };

        enrollments.push(enrollment);

        res.status(201).json({
            message: "Enrollment successful",
            enrollment
        });

    } catch (error) {
        console.error(
            "[enrollment-service] Inter-service communication error:",
            error
        );

        res.status(500).json({
            error: "Unable to communicate with dependent microservices",
            message: error.message
        });
    }
});

app.get("/enrollments", (req, res) => {
    res.json(enrollments);
});

app.get("/enrollments/:id", (req, res) => {
    const enrollment = enrollments.find(
        e => e.id === parseInt(req.params.id)
    );

    if (!enrollment) {
        return res.status(404).json({
            error: "Enrollment record not found"
        });
    }

    res.json(enrollment);
});

app.get("/health", (req, res) => {
    res.json({
        service: "enrollment-service",
        status: "healthy",
        totalEnrollments: enrollments.length,
        timestamp: new Date().toISOString()
    });
});

const PORT = 3003;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[enrollment-service] Running on port ${PORT}`);
});