import csv
import subprocess
import time
import sys
from datetime import datetime

OUTPUT = sys.argv[1] if len(sys.argv) > 1 else "results/raw/current_stats.csv"

SERVICES = {
    "student-service",
    "course-service",
    "enrollment-service"
}

with open(OUTPUT, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        "timestamp",
        "service",
        "cpu_percent",
        "memory_mib",
        "memory_percent"
    ])

    print(f"Monitoring Docker containers...")
    print(f"Saving data to: {OUTPUT}")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            result = subprocess.run(
                [
                    "docker", "stats", "--no-stream",
                    "--format",
                    "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}"
                ],
                capture_output=True,
                text=True,
                check=True
            )

            timestamp = datetime.now().isoformat(timespec="milliseconds")

            for line in result.stdout.strip().splitlines():
                parts = line.split(",")

                if len(parts) != 4:
                    continue

                name, cpu, memory, memory_percent = parts

                if name not in SERVICES:
                    continue

                cpu_value = float(cpu.replace("%", ""))

                memory_value = memory.split("/")[0].strip()

                if memory_value.endswith("MiB"):
                    memory_mib = float(
                        memory_value.replace("MiB", "").strip()
                    )
                elif memory_value.endswith("GiB"):
                    memory_mib = float(
                        memory_value.replace("GiB", "").strip()
                    ) * 1024
                elif memory_value.endswith("KiB"):
                    memory_mib = float(
                        memory_value.replace("KiB", "").strip()
                    ) / 1024
                else:
                    memory_mib = 0

                memory_percent_value = float(
                    memory_percent.replace("%", "")
                )

                writer.writerow([
                    timestamp,
                    name,
                    cpu_value,
                    memory_mib,
                    memory_percent_value
                ])

            f.flush()
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")