import csv
import os
import statistics
import matplotlib.pyplot as plt

RAW_DIR = "results/raw"
OUT_DIR = "results"

os.makedirs(OUT_DIR, exist_ok=True)

# --------------------------------------------------
# Benchmark results from Autocannon
# --------------------------------------------------

benchmark = [
    [1, 0.23, 1285.8, 0, 26],
    [2, 0.19, 2634.2, 0, 17],
    [4, 0.40, 3971.9, 0, 34],
    [8, 1.00, 5376.91, 0, 17],
    [16, 2.73, 4955.5, 0, 94],
]

# --------------------------------------------------
# Read Docker resource data
# --------------------------------------------------

workloads = {
    1: "w1_stats.csv",
    2: "w2_stats.csv",
    4: "w4_stats.csv",
    8: "w8_stats.csv",
    16: "w16_stats.csv",
}

services = [
    "student-service",
    "course-service",
    "enrollment-service"
]

resource_data = {}

for concurrency, filename in workloads.items():

    path = os.path.join(RAW_DIR, filename)

    rows = []

    with open(path, newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            rows.append({
                "service": row["service"],
                "cpu": float(row["cpu_percent"]),
                "memory": float(row["memory_mib"])
            })

    resource_data[concurrency] = rows


def service_average(concurrency, service, metric):

    values = [
        row[metric]
        for row in resource_data[concurrency]
        if row["service"] == service
    ]

    if not values:
        return 0

    return statistics.mean(values)


# --------------------------------------------------
# Save processed resource data
# --------------------------------------------------

with open(
    os.path.join(OUT_DIR, "resource_analysis.csv"),
    "w",
    newline=""
) as f:

    writer = csv.writer(f)

    writer.writerow([
        "concurrency",
        "student_cpu",
        "course_cpu",
        "enrollment_cpu",
        "total_cpu",
        "student_memory_mib",
        "course_memory_mib",
        "enrollment_memory_mib",
        "total_memory_mib"
    ])

    for concurrency in workloads:

        student_cpu = service_average(
            concurrency, "student-service", "cpu"
        )

        course_cpu = service_average(
            concurrency, "course-service", "cpu"
        )

        enrollment_cpu = service_average(
            concurrency, "enrollment-service", "cpu"
        )

        student_memory = service_average(
            concurrency, "student-service", "memory"
        )

        course_memory = service_average(
            concurrency, "course-service", "memory"
        )

        enrollment_memory = service_average(
            concurrency, "enrollment-service", "memory"
        )

        total_cpu = (
            student_cpu
            + course_cpu
            + enrollment_cpu
        )

        total_memory = (
            student_memory
            + course_memory
            + enrollment_memory
        )

        writer.writerow([
            concurrency,
            round(student_cpu, 3),
            round(course_cpu, 3),
            round(enrollment_cpu, 3),
            round(total_cpu, 3),
            round(student_memory, 3),
            round(course_memory, 3),
            round(enrollment_memory, 3),
            round(total_memory, 3)
        ])


# --------------------------------------------------
# Graph 1
# --------------------------------------------------

x = [row[0] for row in benchmark]
response = [row[1] for row in benchmark]

plt.figure(figsize=(8, 5))
plt.plot(x, response, marker="o")
plt.xlabel("Concurrent Requests")
plt.ylabel("Average Response Time (ms)")
plt.title("Graph 1: Concurrency vs. Average Response Time")
plt.grid(True, alpha=0.3)

for a, b in zip(x, response):
    plt.annotate(
        f"{b:.2f}",
        (a, b),
        textcoords="offset points",
        xytext=(0, 8),
        ha="center"
    )

plt.tight_layout()
plt.savefig(
    os.path.join(OUT_DIR, "graph1_response_time.png"),
    dpi=200
)
plt.close()


# --------------------------------------------------
# Graph 2
# --------------------------------------------------

throughput = [row[2] for row in benchmark]

plt.figure(figsize=(8, 5))
plt.plot(x, throughput, marker="o")
plt.xlabel("Concurrent Requests")
plt.ylabel("System Throughput (req/s)")
plt.title("Graph 2: Concurrency vs. System Throughput")
plt.grid(True, alpha=0.3)

for a, b in zip(x, throughput):
    plt.annotate(
        f"{b:.1f}",
        (a, b),
        textcoords="offset points",
        xytext=(0, 8),
        ha="center"
    )

plt.tight_layout()
plt.savefig(
    os.path.join(OUT_DIR, "graph2_throughput.png"),
    dpi=200
)
plt.close()


# --------------------------------------------------
# Load resource analysis
# --------------------------------------------------

resource_rows = []

with open(
    os.path.join(OUT_DIR, "resource_analysis.csv")
) as f:

    reader = csv.DictReader(f)

    for row in reader:
        resource_rows.append(row)


# --------------------------------------------------
# Graph 3 — Total CPU
# --------------------------------------------------

total_cpu = [
    float(row["total_cpu"])
    for row in resource_rows
]

plt.figure(figsize=(8, 5))
plt.plot(x, total_cpu, marker="o")
plt.xlabel("Concurrent Requests")
plt.ylabel("Total CPU Utilization (%)")
plt.title("Graph 3: Concurrency vs. Total CPU Utilization")
plt.grid(True, alpha=0.3)

for a, b in zip(x, total_cpu):
    plt.annotate(
        f"{b:.2f}%",
        (a, b),
        textcoords="offset points",
        xytext=(0, 8),
        ha="center"
    )

plt.tight_layout()
plt.savefig(
    os.path.join(OUT_DIR, "graph3_total_cpu.png"),
    dpi=200
)
plt.close()


# --------------------------------------------------
# Graph 4 — Total Memory
# --------------------------------------------------

total_memory = [
    float(row["total_memory_mib"])
    for row in resource_rows
]

plt.figure(figsize=(8, 5))
plt.plot(x, total_memory, marker="o")
plt.xlabel("Concurrent Requests")
plt.ylabel("Total Memory Usage (MiB)")
plt.title("Graph 4: Concurrency vs. Total Memory Usage")
plt.grid(True, alpha=0.3)

for a, b in zip(x, total_memory):
    plt.annotate(
        f"{b:.1f}",
        (a, b),
        textcoords="offset points",
        xytext=(0, 8),
        ha="center"
    )

plt.tight_layout()
plt.savefig(
    os.path.join(OUT_DIR, "graph4_total_memory.png"),
    dpi=200
)
plt.close()


# --------------------------------------------------
# Graph 5 — Service CPU Breakdown
# --------------------------------------------------

student_cpu = [
    float(row["student_cpu"])
    for row in resource_rows
]

course_cpu = [
    float(row["course_cpu"])
    for row in resource_rows
]

enrollment_cpu = [
    float(row["enrollment_cpu"])
    for row in resource_rows
]

width = 0.25

positions = range(len(x))

plt.figure(figsize=(10, 6))

plt.bar(
    [p - width for p in positions],
    student_cpu,
    width,
    label="Student Service"
)

plt.bar(
    positions,
    course_cpu,
    width,
    label="Course Service"
)

plt.bar(
    [p + width for p in positions],
    enrollment_cpu,
    width,
    label="Enrollment Service"
)

plt.xticks(list(positions), x)
plt.xlabel("Concurrent Requests")
plt.ylabel("CPU Utilization (%)")
plt.title("Graph 5: Service-Level CPU Breakdown")
plt.legend()
plt.grid(axis="y", alpha=0.3)

plt.tight_layout()
plt.savefig(
    os.path.join(OUT_DIR, "graph5_service_cpu.png"),
    dpi=200
)
plt.close()


# --------------------------------------------------
# Graph 6 — Service Memory Breakdown
# --------------------------------------------------

student_memory = [
    float(row["student_memory_mib"])
    for row in resource_rows
]

course_memory = [
    float(row["course_memory_mib"])
    for row in resource_rows
]

enrollment_memory = [
    float(row["enrollment_memory_mib"])
    for row in resource_rows
]

plt.figure(figsize=(10, 6))

plt.bar(
    [p - width for p in positions],
    student_memory,
    width,
    label="Student Service"
)

plt.bar(
    positions,
    course_memory,
    width,
    label="Course Service"
)

plt.bar(
    [p + width for p in positions],
    enrollment_memory,
    width,
    label="Enrollment Service"
)

plt.xticks(list(positions), x)
plt.xlabel("Concurrent Requests")
plt.ylabel("Memory Usage (MiB)")
plt.title("Graph 6: Service-Level Memory Breakdown")
plt.legend()
plt.grid(axis="y", alpha=0.3)

plt.tight_layout()
plt.savefig(
    os.path.join(OUT_DIR, "graph6_service_memory.png"),
    dpi=200
)
plt.close()


print("\nAll 6 graphs generated successfully.")
print(f"Saved in: {OUT_DIR}")
print("\nGenerated files:")
print("graph1_response_time.png")
print("graph2_throughput.png")
print("graph3_total_cpu.png")
print("graph4_total_memory.png")
print("graph5_service_cpu.png")
print("graph6_service_memory.png")
print("resource_analysis.csv")