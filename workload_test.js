/**
 * Workload Generator & Live Performance Benchmark Script
 * Lab Evaluation Checkpoint 4 & 5: Live Workload Testing & Real Resource Monitoring
 * 
 * Concurrency Levels: W1 (1), W2 (2), W3 (4), W4 (8), W5 (16)
 * Target Endpoint: POST http://localhost:3003/enroll
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TARGET_URL = 'http://localhost:3003/enroll';
const WORKLOAD_CONFIGS = [
    { name: 'W1', concurrency: 1, totalRequests: 100 },
    { name: 'W2', concurrency: 2, totalRequests: 200 },
    { name: 'W3', concurrency: 4, totalRequests: 400 },
    { name: 'W4', concurrency: 8, totalRequests: 800 },
    { name: 'W5', concurrency: 16, totalRequests: 1600 }
];

function getLiveDockerStats() {
    try {
        const output = execSync('docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"', { encoding: 'utf8', timeout: 5000 });
        const lines = output.trim().split('\n');
        const stats = {
            studentService: { cpu: 0, memMb: 0 },
            courseService: { cpu: 0, memMb: 0 },
            enrollmentService: { cpu: 0, memMb: 0 }
        };

        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 3) {
                const containerName = parts[0].trim();
                const cpuStr = parts[1].replace('%', '').trim();
                const cpuVal = parseFloat(cpuStr) || 0;

                const memStr = parts[2].split('/')[0].trim(); // e.g. "34.5MiB" or "34.5MB"
                let memVal = parseFloat(memStr) || 0;
                if (memStr.includes('GiB') || memStr.includes('GB')) memVal *= 1024;
                if (memStr.includes('KiB') || memStr.includes('KB')) memVal /= 1024;

                if (containerName.includes('student')) {
                    stats.studentService.cpu = cpuVal;
                    stats.studentService.memMb = Number(memVal.toFixed(1));
                } else if (containerName.includes('course')) {
                    stats.courseService.cpu = cpuVal;
                    stats.courseService.memMb = Number(memVal.toFixed(1));
                } else if (containerName.includes('enrollment')) {
                    stats.enrollmentService.cpu = cpuVal;
                    stats.enrollmentService.memMb = Number(memVal.toFixed(1));
                }
            }
        }
        return stats;
    } catch (e) {
        console.warn('⚠️ Could not fetch live docker stats:', e.message);
        return null;
    }
}

async function sendRequest() {
    const start = Date.now();
    try {
        const response = await fetch(TARGET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: 1, courseId: 101 })
        });
        const duration = Date.now() - start;
        return { success: response.ok, duration };
    } catch (err) {
        return { success: false, duration: Date.now() - start, error: err.message };
    }
}

async function runWorkloadLevel(config) {
    console.log(`\n==================================================`);
    console.log(`Running Workload Level ${config.name} (Concurrency: ${config.concurrency}, Total Requests: ${config.totalRequests})`);
    console.log(`==================================================`);

    const latencies = [];
    let successCount = 0;
    let failedCount = 0;

    const startTime = Date.now();
    let completedRequests = 0;

    // Sample docker stats concurrently during workload execution
    const statsSamples = [];
    const statsInterval = setInterval(() => {
        const sample = getLiveDockerStats();
        if (sample) statsSamples.push(sample);
    }, 300);

    async function worker() {
        while (completedRequests < config.totalRequests) {
            completedRequests++;
            const result = await sendRequest();
            latencies.push(result.duration);
            if (result.success) successCount++;
            else failedCount++;
        }
    }

    const workers = [];
    for (let i = 0; i < config.concurrency; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);
    clearInterval(statsInterval);

    // Final docker stats sample
    const finalSample = getLiveDockerStats();
    if (finalSample) statsSamples.push(finalSample);

    const totalDurationMs = Date.now() - startTime;
    const totalDurationSec = totalDurationMs / 1000;
    const avgResponseTimeMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const throughputReqSec = config.totalRequests / totalDurationSec;

    // Aggregate measured stats samples
    let avgCpuStudent = 0, avgCpuCourse = 0, avgCpuEnrollment = 0;
    let avgMemStudent = 0, avgMemCourse = 0, avgMemEnrollment = 0;

    if (statsSamples.length > 0) {
        avgCpuStudent = statsSamples.reduce((acc, s) => acc + s.studentService.cpu, 0) / statsSamples.length;
        avgCpuCourse = statsSamples.reduce((acc, s) => acc + s.courseService.cpu, 0) / statsSamples.length;
        avgCpuEnrollment = statsSamples.reduce((acc, s) => acc + s.enrollmentService.cpu, 0) / statsSamples.length;

        avgMemStudent = statsSamples.reduce((acc, s) => acc + s.studentService.memMb, 0) / statsSamples.length;
        avgMemCourse = statsSamples.reduce((acc, s) => acc + s.courseService.memMb, 0) / statsSamples.length;
        avgMemEnrollment = statsSamples.reduce((acc, s) => acc + s.enrollmentService.memMb, 0) / statsSamples.length;
    }

    const totalAvgCpu = Number(((avgCpuStudent + avgCpuCourse + avgCpuEnrollment) / 3).toFixed(2));
    const totalMemMb = Number((avgMemStudent + avgMemCourse + avgMemEnrollment).toFixed(1));

    const resultSummary = {
        workload: config.name,
        concurrency: config.concurrency,
        totalRequests: config.totalRequests,
        durationSeconds: Number(totalDurationSec.toFixed(2)),
        avgResponseTimeMs: Number(avgResponseTimeMs.toFixed(2)),
        throughputReqSec: Number(throughputReqSec.toFixed(2)),
        failedRequests: failedCount,
        successfulRequests: successCount,
        cpuUtilizationPercent: {
            studentService: Number(avgCpuStudent.toFixed(2)),
            courseService: Number(avgCpuCourse.toFixed(2)),
            enrollmentService: Number(avgCpuEnrollment.toFixed(2)),
            overallAverage: totalAvgCpu
        },
        memoryUtilizationMb: {
            studentService: Number(avgMemStudent.toFixed(1)),
            courseService: Number(avgMemCourse.toFixed(1)),
            enrollmentService: Number(avgMemEnrollment.toFixed(1)),
            totalMemory: totalMemMb
        }
    };

    console.log(`Average Response Time: ${resultSummary.avgResponseTimeMs} ms`);
    console.log(`Throughput:            ${resultSummary.throughputReqSec} req/sec`);
    console.log(`Failed Requests:       ${resultSummary.failedRequests}`);
    console.log(`Measured CPU Util:     Student: ${resultSummary.cpuUtilizationPercent.studentService}%, Course: ${resultSummary.cpuUtilizationPercent.courseService}%, Enrollment: ${resultSummary.cpuUtilizationPercent.enrollmentService}% (Avg: ${resultSummary.cpuUtilizationPercent.overallAverage}%)`);
    console.log(`Measured RAM Footprint: Student: ${resultSummary.memoryUtilizationMb.studentService}MB, Course: ${resultSummary.memoryUtilizationMb.courseService}MB, Enrollment: ${resultSummary.memoryUtilizationMb.enrollmentService}MB (Total: ${resultSummary.memoryUtilizationMb.totalMemory}MB)`);

    return resultSummary;
}

async function main() {
    console.log('🚀 Starting Live Microservice Load Test & Performance Metrics Collection...');
    const results = [];
    for (const config of WORKLOAD_CONFIGS) {
        const res = await runWorkloadLevel(config);
        results.push(res);
    }

    // Ensure results directory exists
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save JSON
    fs.writeFileSync(
        path.join(resultsDir, 'observation_table.json'),
        JSON.stringify(results, null, 2)
    );

    // Save CSV
    let csvContent = 'Workload,Concurrency,Avg Response Time (ms),Throughput (req/sec),Failed Requests,CPU Utilization (%),Memory Utilization (MB)\n';
    results.forEach(r => {
        csvContent += `${r.workload},${r.concurrency},${r.avgResponseTimeMs},${r.throughputReqSec},${r.failedRequests},${r.cpuUtilizationPercent.overallAverage},${r.memoryUtilizationMb.totalMemory}\n`;
    });
    fs.writeFileSync(path.join(resultsDir, 'observation_table.csv'), csvContent);

    console.log('\n✅ Live workload test completed! Results saved to results/observation_table.json & results/observation_table.csv');
}

if (require.main === module) {
    main().catch(err => console.error(err));
}

module.exports = { WORKLOAD_CONFIGS, runWorkloadLevel };
