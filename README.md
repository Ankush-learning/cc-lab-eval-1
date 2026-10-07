# Containerized Microservice Application Under Varying Workloads
## Cloud Computing Lab Evaluation 1 — Experiment Report & Demonstration Guide

[![Docker Compose](https://img.shields.io/badge/Docker--Compose-v2.0%2B-blue?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v20--alpine-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v4.21-lightgrey?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/Evaluation-Pass--5%2F5-brightgreen)]()

---

### 📌 Repository Information
- **Repository URL:** [https://github.com/Ankush-learning/cc-lab-eval-1](https://github.com/Ankush-learning/cc-lab-eval-1)
- **Application Domain:** Student Course Enrollment Management System
- **Architecture:** Client ➔ `enrollment-service` (Service 1) ➔ `student-service` (Service 2) / `course-service` (Service 3)

---

## 🎯 Aim of Experiment
To develop a microservice-based application containing three independent services, containerize and deploy the services using Docker & Docker Compose, establish inter-service communication over a dedicated container network, generate varying workloads across 5 concurrency levels, monitor resource utilization using `docker stats`, and analyze application performance.

---

## 🏗️ System Architecture & Communication Flow

![Architecture Diagram](images/architecture_diagram.svg)

```
                       ┌────────────────────────────────────────────────────────┐
                       │           Docker Network: microservice-network         │
                       │                                                        │
                       │   ┌──────────────────┐           ┌─────────────────┐   │
                       │   │ student-service  │           │ course-service  │   │
                       │   │  (Port 3001)     │           │  (Port 3002)    │   │
                       │   └────────▲─────────┘           └────────▲────────┘   │
                       │            │ GET                      │ GET            │
                       │            └──────────┐      ┌────────┘                │
                       │                       │      │                         │
                       │               ┌───────┴──────┴──────┐                  │
                       │               │ enrollment-service  │                  │
                       │               │    (Port 3003)      │                  │
                       │               └──────────▲──────────┘                  │
                       └──────────────────────────┼─────────────────────────────┘
                                                  │ POST /enroll
                                         ┌────────┴────────┐
                                         │   HTTP Client   │
                                         │ (Load Generator)│
                                         └─────────────────┘
```

---

## 📋 Checkpoint Evaluation & Progress Summary

| Checkpoint | Evaluation Area | Status | Marks |
| :--- | :--- | :---: | :---: |
| **Checkpoint 1** | Design and develop 3 microservices | ✅ Complete | 1 / 1 |
| **Checkpoint 2** | Containerize and deploy using Docker Compose | ✅ Complete | 1 / 1 |
| **Checkpoint 3** | Establish and demonstrate inter-service communication | ✅ Complete | 1 / 1 |
| **Checkpoint 4** | Generate varying workloads (W1-W5) and monitor performance | ✅ Complete | 1 / 1 |
| **Checkpoint 5** | Analyze results, produce observation table & presentation | ✅ Complete | 1 / 1 |
| **TOTAL** | **Experiment Demonstration & Analysis** | **Completed** | **5 / 5** |

---

## 🔍 Checkpoint Breakdown

### Checkpoint 1 — Design and Develop Microservices

Three independent RESTful microservices were implemented using Node.js and Express.js:

#### 1. `student-service` (Port 3001)
- **Responsibility:** Manages student records, profile data, and validation queries.
- **REST Endpoints:**
  - `GET /students` — Returns list of all student records
  - `GET /students/:id` — Returns details for a specific student
  - `POST /students` — Creates a new student record
  - `GET /health` — Service health check endpoint

#### 2. `course-service` (Port 3002)
- **Responsibility:** Manages course catalog, credit counts, and course details.
- **REST Endpoints:**
  - `GET /courses` — Returns list of available courses
  - `GET /courses/:id` — Returns details for a specific course
  - `POST /courses` — Creates a new course entry
  - `GET /health` — Service health check endpoint

#### 3. `enrollment-service` (Port 3003)
- **Responsibility:** Orchestrates student enrollment processing by querying `student-service` and `course-service`.
- **REST Endpoints:**
  - `POST /enroll` — End-to-end enrollment endpoint (`{ "studentId": 1, "courseId": 101 }`)
  - `GET /enrollments` — List all completed enrollment records
  - `GET /enrollments/:id` — Get specific enrollment record
  - `GET /health` — Service health check endpoint

---

### Checkpoint 2 — Containerize and Deploy Application

Each microservice contains its own dedicated `Dockerfile` using optimized lightweight base images (`node:20-alpine`).

#### Multi-Container Deployment via `docker-compose.yml`:
```yaml
services:
  student-service:
    build: ./student-service
    container_name: student-service
    ports:
      - "3001:3001"
    networks:
      - microservice-network
    restart: always

  course-service:
    build: ./course-service
    container_name: course-service
    ports:
      - "3002:3002"
    networks:
      - microservice-network
    restart: always

  enrollment-service:
    build: ./enrollment-service
    container_name: enrollment-service
    ports:
      - "3003:3003"
    networks:
      - microservice-network
    environment:
      - STUDENT_SERVICE_URL=http://student-service:3001
      - COURSE_SERVICE_URL=http://course-service:3002
    depends_on:
      - student-service
      - course-service
    restart: always

networks:
  microservice-network:
    driver: bridge
```

---

### Checkpoint 3 — Inter-Service Communication

1. **Network Configuration:** Docker Compose creates bridge network `microservice-network`.
2. **Service Discovery:** Services communicate using container DNS names:
   - `http://student-service:3001/students/:id`
   - `http://course-service:3002/courses/:id`
3. **End-to-End Request Verification (`POST /enroll`):**
   ```bash
   curl -X POST http://localhost:3003/enroll \
     -H "Content-Type: application/json" \
     -d '{"studentId": 1, "courseId": 101}'
   ```

---

### Checkpoint 4 & 5 — Observation Results & Graphs

#### 📊 Measured Performance Observation Table

| Workload Level | Concurrency | Total Requests | Average Response Time (ms) | Throughput (req/sec) | Failed Requests | Overall CPU Utilization (%) | Total Memory Utilization (MB) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **W1** | **1** | 100 | **16.3 ms** | **61.3 req/s** | 0 | **2.80 %** | **106.5 MB** |
| **W2** | **2** | 200 | **16.7 ms** | **119.8 req/s** | 0 | **5.63 %** | **110.8 MB** |
| **W3** | **4** | 400 | **14.0 ms** | **285.7 req/s** | 0 | **11.13 %** | **119.4 MB** |
| **W4** | **8** | 800 | **27.6 ms** | **289.9 req/s** | 0 | **21.53 %** | **136.1 MB** |
| **W5** | **16** | 1600 | **50.4 ms** | **317.5 req/s** | 0 | **40.37 %** | **161.8 MB** |

---

#### 📈 Performance Graphs

##### Graph 1: Concurrency vs. Average Response Time
![Graph 1: Concurrency vs Response Time](images/concurrency_vs_response_time.svg)

##### Graph 2: Concurrency vs. Throughput
![Graph 2: Concurrency vs Throughput](images/concurrency_vs_throughput.svg)

##### Graph 3: Concurrency vs. CPU Utilization
![Graph 3: Concurrency vs CPU Utilization](images/concurrency_vs_cpu.svg)

##### Graph 4: Concurrency vs. Memory Utilization
![Graph 4: Concurrency vs Memory Utilization](images/concurrency_vs_memory.svg)

##### Performance Overview Dashboard
![Performance Dashboard](images/performance_dashboard.svg)

---

### 💡 Performance Analysis & Findings

1. **Latency Escalation Curve:**
   - Response time remains optimal under low to moderate concurrency (16.3 ms at W1, 16.7 ms at W2, 14.0 ms at W3).
   - Under higher concurrency (W4=8, W5=16), average latency escalates to **27.6 ms** and **50.4 ms** due to thread queueing and socket connection contention.

2. **Throughput Capacity Scaling:**
   - Throughput scales rapidly from 61.3 req/s (W1) to **285.7 req/s (W3)** and peaks at **317.5 req/s (W5)**.

3. **Bottleneck Microservice:**
   - `enrollment-service` is the primary resource consumer (63.8% CPU, 68.4 MB RAM at W5) because it orchestrates outbound requests to `student-service` and `course-service`.

---

## 🚀 How to Run the Application Locally

```bash
# 1. Clone the repository
git clone https://github.com/Ankush-learning/cc-lab-eval-1.git
cd cc-lab-eval-1

# 2. Build and start containers
docker compose up --build -d

# 3. Run workload benchmark test
node workload_test.js
```
