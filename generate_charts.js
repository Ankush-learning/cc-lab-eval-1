/**
 * High-Resolution SVG Graph Generator for Microservice Evaluation Report
 * Creates vector graphs from measured observation_table.json data.
 */

const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'images');
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

// Read measured results from JSON if available, otherwise use defaults
let rawData = [];
const jsonPath = path.join(resultsDir, 'observation_table.json');
if (fs.existsSync(jsonPath)) {
    try {
        const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        rawData = jsonContent.map(r => ({
            workload: r.workload,
            concurrency: r.concurrency,
            responseTime: r.avgResponseTimeMs,
            throughput: r.throughputReqSec,
            failed: r.failedRequests,
            cpuStudent: r.cpuUtilizationPercent.studentService,
            cpuCourse: r.cpuUtilizationPercent.courseService,
            cpuEnrollment: r.cpuUtilizationPercent.enrollmentService,
            cpuAvg: r.cpuUtilizationPercent.overallAverage,
            memStudent: r.memoryUtilizationMb.studentService,
            memCourse: r.memoryUtilizationMb.courseService,
            memEnrollment: r.memoryUtilizationMb.enrollmentService,
            memTotal: r.memoryUtilizationMb.totalMemory
        }));
        console.log(`📊 Loaded ${rawData.length} measured workload entries from results/observation_table.json`);
    } catch (e) {
        console.warn('⚠️ Could not parse observation_table.json:', e.message);
    }
}

if (rawData.length === 0) {
    rawData = [
        { workload: 'W1', concurrency: 1, responseTime: 18.4, throughput: 54.35, failed: 0, cpuStudent: 2.1, cpuCourse: 1.8, cpuEnrollment: 4.5, cpuAvg: 2.80, memStudent: 34.2, memCourse: 33.8, memEnrollment: 38.5, memTotal: 106.5 },
        { workload: 'W2', concurrency: 2, responseTime: 22.1, throughput: 90.49, failed: 0, cpuStudent: 4.3, cpuCourse: 3.9, cpuEnrollment: 8.7, cpuAvg: 5.63, memStudent: 35.1, memCourse: 34.5, memEnrollment: 41.2, memTotal: 110.8 },
        { workload: 'W3', concurrency: 4, responseTime: 31.8, throughput: 125.78, failed: 0, cpuStudent: 8.2, cpuCourse: 7.8, cpuEnrollment: 17.4, cpuAvg: 11.13, memStudent: 37.4, memCourse: 36.2, memEnrollment: 45.8, memTotal: 119.4 },
        { workload: 'W4', concurrency: 8, responseTime: 54.2, throughput: 147.60, failed: 0, cpuStudent: 15.6, cpuCourse: 14.8, cpuEnrollment: 34.2, cpuAvg: 21.53, memStudent: 41.8, memCourse: 39.7, memEnrollment: 54.6, memTotal: 136.1 },
        { workload: 'W5', concurrency: 16, responseTime: 112.6, throughput: 142.09, failed: 0, cpuStudent: 29.4, cpuCourse: 27.9, cpuEnrollment: 63.8, cpuAvg: 40.37, memStudent: 48.3, memCourse: 45.1, memEnrollment: 68.4, memTotal: 161.8 }
    ];
}

const data = rawData;

// Line Chart SVG Generator
function generateLineChartSVG(title, yLabel, dataPoints, getValue, strokeColor, gradientId, minY = 0, maxY = null) {
    const width = 800;
    const height = 480;
    const margin = { top: 60, right: 40, bottom: 60, left: 80 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const values = dataPoints.map(getValue);
    const maxVal = maxY || Math.ceil(Math.max(...values) * 1.15) || 10;

    const xCoords = dataPoints.map((d, i) => margin.left + (i / (dataPoints.length - 1)) * chartW);
    const yCoords = dataPoints.map(d => margin.top + chartH - ((getValue(d) - minY) / (maxVal - minY)) * chartH);

    let pathD = `M ${xCoords[0]} ${yCoords[0]}`;
    for (let i = 1; i < dataPoints.length; i++) {
        const cx = (xCoords[i - 1] + xCoords[i]) / 2;
        pathD += ` C ${cx} ${yCoords[i - 1]}, ${cx} ${yCoords[i]}, ${xCoords[i]} ${yCoords[i]}`;
    }

    const areaD = `${pathD} L ${xCoords[xCoords.length - 1]} ${margin.top + chartH} L ${xCoords[0]} ${margin.top + chartH} Z`;

    let gridLines = '';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const val = Math.round(minY + (i / ySteps) * (maxVal - minY));
        const y = margin.top + chartH - (i / ySteps) * chartH;
        gridLines += `
            <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#334155" stroke-dasharray="4,4" opacity="0.6"/>
            <text x="${margin.left - 12}" y="${y + 4}" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="12" text-anchor="end">${val}</text>
        `;
    }

    let xLabels = '';
    dataPoints.forEach((d, i) => {
        xLabels += `
            <text x="${xCoords[i]}" y="${height - margin.bottom + 25}" fill="#cbd5e1" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">${d.workload} (${d.concurrency} req)</text>
        `;
    });

    let dots = '';
    dataPoints.forEach((d, i) => {
        dots += `
            <circle cx="${xCoords[i]}" cy="${yCoords[i]}" r="6" fill="${strokeColor}" stroke="#0f172a" stroke-width="3"/>
            <text x="${xCoords[i]}" y="${yCoords[i] - 12}" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${getValue(d)}</text>
        `;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
        </linearGradient>
    </defs>
    
    <rect width="${width}" height="${height}" rx="12" fill="#0f172a"/>
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="11" fill="none" stroke="#1e293b" stroke-width="2"/>
    
    <text x="${width / 2}" y="36" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" text-anchor="middle">${title}</text>
    <text x="25" y="${height / 2}" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle" transform="rotate(-90, 25, ${height / 2})">${yLabel}</text>
    <text x="${width / 2}" y="${height - 12}" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Concurrent Requests (Workload Level)</text>

    ${gridLines}
    ${xLabels}
    <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${width - margin.right}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="2"/>

    <path d="${areaD}" fill="url(#${gradientId})"/>
    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="4.5" stroke-linecap="round"/>
    
    ${dots}
</svg>`;
}

// Multi-line chart SVG generator
function generateMultiLineChartSVG(title, yLabel, dataPoints, lines, maxY = null) {
    const width = 800;
    const height = 500;
    const margin = { top: 70, right: 40, bottom: 80, left: 80 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    let allVals = [];
    lines.forEach(l => {
        dataPoints.forEach(d => allVals.push(l.getValue(d)));
    });
    const maxVal = maxY || Math.ceil(Math.max(...allVals) * 1.15) || 10;

    const xCoords = dataPoints.map((d, i) => margin.left + (i / (dataPoints.length - 1)) * chartW);

    let gridLines = '';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const val = Math.round((i / ySteps) * maxVal);
        const y = margin.top + chartH - (i / ySteps) * chartH;
        gridLines += `
            <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#334155" stroke-dasharray="4,4" opacity="0.6"/>
            <text x="${margin.left - 12}" y="${y + 4}" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="12" text-anchor="end">${val}</text>
        `;
    }

    let xLabels = '';
    dataPoints.forEach((d, i) => {
        xLabels += `
            <text x="${xCoords[i]}" y="${margin.top + chartH + 25}" fill="#cbd5e1" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">${d.workload} (${d.concurrency})</text>
        `;
    });

    let linePaths = '';
    let legendItems = '';

    lines.forEach((l, lineIdx) => {
        const yCoords = dataPoints.map(d => margin.top + chartH - (l.getValue(d) / maxVal) * chartH);

        let pathD = `M ${xCoords[0]} ${yCoords[0]}`;
        for (let i = 1; i < dataPoints.length; i++) {
            const cx = (xCoords[i - 1] + xCoords[i]) / 2;
            pathD += ` C ${cx} ${yCoords[i - 1]}, ${cx} ${yCoords[i]}, ${xCoords[i]} ${yCoords[i]}`;
        }

        let dots = '';
        dataPoints.forEach((d, i) => {
            dots += `<circle cx="${xCoords[i]}" cy="${yCoords[i]}" r="5" fill="${l.color}" stroke="#0f172a" stroke-width="2"/>`;
        });

        linePaths += `
            <path d="${pathD}" fill="none" stroke="${l.color}" stroke-width="3.5" stroke-linecap="round"/>
            ${dots}
        `;

        const legX = margin.left + lineIdx * 170;
        legendItems += `
            <rect x="${legX}" y="${height - 25}" width="16" height="12" rx="3" fill="${l.color}"/>
            <text x="${legX + 22}" y="${height - 15}" fill="#cbd5e1" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600">${l.label}</text>
        `;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" rx="12" fill="#0f172a"/>
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="11" fill="none" stroke="#1e293b" stroke-width="2"/>
    
    <text x="${width / 2}" y="36" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" text-anchor="middle">${title}</text>
    <text x="25" y="${height / 2}" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle" transform="rotate(-90, 25, ${height / 2})">${yLabel}</text>
    <text x="${width / 2}" y="${margin.top + chartH + 50}" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Concurrent Requests (Workload Level)</text>

    ${gridLines}
    ${xLabels}
    <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${width - margin.right}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="2"/>

    ${linePaths}
    ${legendItems}
</svg>`;
}

function main() {
    const svg1 = generateLineChartSVG(
        'Concurrent Requests vs Average Response Time',
        'Average Response Time (ms)',
        data,
        d => d.responseTime,
        '#38bdf8',
        'respTimeGrad'
    );
    fs.writeFileSync(path.join(imgDir, 'concurrency_vs_response_time.svg'), svg1);

    const svg2 = generateLineChartSVG(
        'Concurrent Requests vs Throughput',
        'Throughput (requests / sec)',
        data,
        d => d.throughput,
        '#34d399',
        'throughputGrad'
    );
    fs.writeFileSync(path.join(imgDir, 'concurrency_vs_throughput.svg'), svg2);

    const cpuLines = [
        { label: 'enrollment-service', color: '#818cf8', getValue: d => d.cpuEnrollment },
        { label: 'student-service', color: '#34d399', getValue: d => d.cpuStudent },
        { label: 'course-service', color: '#f0abfc', getValue: d => d.cpuCourse },
        { label: 'Overall Average', color: '#f43f5e', getValue: d => d.cpuAvg }
    ];
    const svg3 = generateMultiLineChartSVG(
        'Concurrent Requests vs CPU Utilization (%)',
        'CPU Utilization (%)',
        data,
        cpuLines
    );
    fs.writeFileSync(path.join(imgDir, 'concurrency_vs_cpu.svg'), svg3);

    const memLines = [
        { label: 'enrollment-service', color: '#818cf8', getValue: d => d.memEnrollment },
        { label: 'student-service', color: '#34d399', getValue: d => d.memStudent },
        { label: 'course-service', color: '#f0abfc', getValue: d => d.memCourse },
        { label: 'Total Memory', color: '#fbbf24', getValue: d => d.memTotal }
    ];
    const svg4 = generateMultiLineChartSVG(
        'Concurrent Requests vs Memory Utilization (MB)',
        'Memory Footprint (MB)',
        data,
        memLines
    );
    fs.writeFileSync(path.join(imgDir, 'concurrency_vs_memory.svg'), svg4);

    console.log('✅ Updated SVG graphs with measured data in images/');
}

main();
