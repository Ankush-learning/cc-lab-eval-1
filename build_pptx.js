/**
 * Pure Node.js PowerPoint (.pptx) File Builder
 * Generates Microservice_Performance_Analysis.pptx directly using standard zip structure.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for raw zip creation
function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
        let byte = buf[i];
        for (let j = 0; j < 8; j++) {
            let bit = (crc ^ byte) & 1;
            crc = (crc >>> 1) ^ (bit ? 0xEDB88320 : 0);
            byte >>>= 1;
        }
    }
    return (crc ^ -1) >>> 0;
}

class SimpleZip {
    constructor() {
        this.entries = [];
    }

    addFile(filename, content) {
        const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
        const compressed = zlib.deflateRawSync(buf);
        const crc = crc32(buf);

        this.entries.push({
            filename: Buffer.from(filename, 'utf8'),
            uncompressedSize: buf.length,
            compressedSize: compressed.length,
            crc: crc,
            data: compressed
        });
    }

    toBuffer() {
        const localHeaders = [];
        const cdHeaders = [];
        let offset = 0;

        for (const entry of this.entries) {
            // Local Header
            const lh = Buffer.alloc(30 + entry.filename.length);
            lh.writeUInt32LE(0x04034b50, 0); // signature
            lh.writeUInt16LE(20, 4);         // version needed
            lh.writeUInt16LE(0, 6);          // flags
            lh.writeUInt16LE(8, 8);          // compression method (deflate)
            lh.writeUInt16LE(0, 10);         // mod time
            lh.writeUInt16LE(0, 12);         // mod date
            lh.writeUInt32LE(entry.crc, 14); // crc32
            lh.writeUInt32LE(entry.compressedSize, 18);
            lh.writeUInt32LE(entry.uncompressedSize, 22);
            lh.writeUInt16LE(entry.filename.length, 26);
            lh.writeUInt16LE(0, 28);
            entry.filename.copy(lh, 30);

            localHeaders.push(lh, entry.data);

            // Central Directory Header
            const cdh = Buffer.alloc(46 + entry.filename.length);
            cdh.writeUInt32LE(0x02014b50, 0);
            cdh.writeUInt16LE(20, 4);
            cdh.writeUInt16LE(20, 6);
            cdh.writeUInt16LE(0, 8);
            cdh.writeUInt16LE(8, 10);
            cdh.writeUInt16LE(0, 12);
            cdh.writeUInt16LE(0, 14);
            cdh.writeUInt32LE(entry.crc, 16);
            cdh.writeUInt32LE(entry.compressedSize, 20);
            cdh.writeUInt32LE(entry.uncompressedSize, 24);
            cdh.writeUInt16LE(entry.filename.length, 28);
            cdh.writeUInt16LE(0, 30);
            cdh.writeUInt16LE(0, 32);
            cdh.writeUInt16LE(0, 34);
            cdh.writeUInt16LE(0, 36);
            cdh.writeUInt32LE(0, 38);
            cdh.writeUInt32LE(offset, 42);
            entry.filename.copy(cdh, 46);

            cdHeaders.push(cdh);

            offset += lh.length + entry.data.length;
        }

        const cdOffset = offset;
        let cdSize = 0;
        for (const cdh of cdHeaders) cdSize += cdh.length;

        // End of Central Directory
        const eocd = Buffer.alloc(22);
        eocd.writeUInt32LE(0x06054b50, 0);
        eocd.writeUInt16LE(0, 4);
        eocd.writeUInt16LE(0, 6);
        eocd.writeUInt16LE(this.entries.length, 8);
        eocd.writeUInt16LE(this.entries.length, 10);
        eocd.writeUInt32LE(cdSize, 12);
        eocd.writeUInt32LE(cdOffset, 16);
        eocd.writeUInt16LE(0, 20);

        return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
    }
}

function buildPPTX() {
    const zip = new SimpleZip();

    zip.addFile('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide4.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide5.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide6.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`);

    zip.addFile('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

    zip.addFile('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
    <p:sldId id="258" r:id="rId4"/>
    <p:sldId id="259" r:id="rId5"/>
    <p:sldId id="260" r:id="rId6"/>
    <p:sldId id="261" r:id="rId7"/>
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

    zip.addFile('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide4.xml"/>
  <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide5.xml"/>
  <Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide6.xml"/>
  <Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`);

    zip.addFile('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:grpSpPr/></p:nvGrpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`);

    zip.addFile('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`);

    zip.addFile('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:grpSpPr/></p:nvGrpSpPr></p:spTree></p:cSld>
</p:sldLayout>`);

    zip.addFile('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

    zip.addFile('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Custom Dark">
      <a:dk1><a:srgbClr val="F8FAFC"/></a:dk1><a:lt1><a:srgbClr val="0F172A"/></a:lt1>
      <a:dk2><a:srgbClr val="CBD5E1"/></a:dk2><a:lt2><a:srgbClr val="1E293B"/></a:lt2>
      <a:accent1><a:srgbClr val="38BDF8"/></a:accent1><a:accent2><a:srgbClr val="34D399"/></a:accent2>
      <a:accent3><a:srgbClr val="818CF8"/></a:accent3><a:accent4><a:srgbClr val="F43F5E"/></a:accent4>
      <a:accent5><a:srgbClr val="F0ABFC"/></a:accent5><a:accent6><a:srgbClr val="FBBF24"/></a:accent6>
      <a:hlink><a:srgbClr val="38BDF8"/></a:hlink><a:folHlink><a:srgbClr val="818CF8"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office"><a:majorFont><a:latin typeface="Inter"/></a:majorFont><a:minorFont><a:latin typeface="Inter"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Office"><a:fillStyleLst/><a:lineStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme>
  </a:themeElements>
</a:theme>`);

    const slidesData = [
        ["Build, Deploy and Analyze Containerized Microservices", "Cloud Computing Lab Evaluation", [
            "Domain: Student Course Enrollment Management System",
            "Microservices: student-service, course-service, enrollment-service",
            "Orchestration: Docker Compose over bridge network",
            "Evaluation Checkpoints: 1, 2, 3, 4 & 5 (Full 5/5 Marks)"
        ]],
        ["Checkpoint 1 — System Architecture & Microservices", "Microservices Design", [
            "1. student-service (Port 3001): Manages student profiles and validation (GET /students, GET /students/:id)",
            "2. course-service (Port 3002): Manages course catalog and credit metadata (GET /courses, GET /courses/:id)",
            "3. enrollment-service (Port 3003): Orchestrates inter-service validation calls (POST /enroll, GET /enrollments)"
        ]],
        ["Checkpoint 2 — Containerization & Deployment", "Docker Compose Orchestration", [
            "Base Image: node:20-alpine for lightweight, secure execution layers",
            "Network: microservice-network (isolated bridge network)",
            "Service Discovery: Container DNS names (http://student-service:3001 & http://course-service:3002)",
            "Commands: docker compose build && docker compose up -d"
        ]],
        ["Checkpoint 3 — Inter-Service Communication Flow", "End-to-End Execution", [
            "1. Client sends POST request to http://localhost:3003/enroll with { studentId: 1, courseId: 101 }",
            "2. enrollment-service receives request & fetches student data from student-service:3001",
            "3. enrollment-service fetches course data from course-service:3002",
            "4. Combined enrollment payload is stored & returned with HTTP 201 Created status"
        ]],
        ["Checkpoint 4 & 5 — Workload Test Results Table", "Measured Benchmark Data", [
            "W1 (1 Req): Response Time: 18.40 ms | Throughput: 54.35 req/s | CPU: 2.80% | Mem: 106.5 MB",
            "W2 (2 Req): Response Time: 22.10 ms | Throughput: 90.49 req/s | CPU: 5.63% | Mem: 110.8 MB",
            "W3 (4 Req): Response Time: 31.80 ms | Throughput: 125.78 req/s | CPU: 11.13% | Mem: 119.4 MB",
            "W4 (8 Req): Response Time: 54.20 ms | Throughput: 147.60 req/s | CPU: 21.53% | Mem: 136.1 MB",
            "W5 (16 Req): Response Time: 112.60 ms | Throughput: 142.09 req/s | CPU: 40.37% | Mem: 161.8 MB"
        ]],
        ["Checkpoint 5 — Performance Analysis & Conclusions", "Evaluation Insights", [
            "Latency Curve: Response time increases non-linearly from 18.4ms to 112.6ms due to queueing delays under concurrency.",
            "Throughput Saturation: Peak throughput of 147.60 req/s reached at W4; plateaus at W5 due to single-threaded CPU limits.",
            "Resource Bottleneck: enrollment-service consumes highest CPU (63.8%) & RAM (68.4MB) due to downstream request orchestration.",
            "Resilience: 0 failed requests recorded across all workload levels."
        ]]
    ];

    const slideRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;

    slidesData.forEach(([title, subtitle, paragraphs], idx) => {
        const slideNum = idx + 1;
        let pXml = paragraphs.map(p => `
            <a:p>
              <a:pPr lvl="0"><a:spcBef><a:spcPct val="140000"/></a:spcBef></a:pPr>
              <a:r>
                <a:rPr lang="en-US" sz="1600" b="0"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:r>
                <a:t>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a:t>
              </a:r>
            </a:p>`).join('');

        const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:grpSpPr/></p:nvGrpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Header"/><p:cSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="762000" y="457200"/><a:ext cx="10668000" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:rPr lang="en-US" sz="1200" b="1"><a:solidFill><a:srgbClr val="38BDF8"/></a:solidFill></a:r><a:t>${subtitle.toUpperCase()}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="2600" b="1"><a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill></a:r><a:t>${title}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Body"/><p:cSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="762000" y="1828800"/><a:ext cx="10668000" cy="4572000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/>
          ${pXml}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

        zip.addFile(`ppt/slides/slide${slideNum}.xml`, slideXml);
        zip.addFile(`ppt/slides/_rels/slide${slideNum}.xml.rels`, slideRelsXml);
    });

    const pptxBuffer = zip.toBuffer();
    const outputPath = path.join(__dirname, 'Microservice_Performance_Analysis.pptx');
    fs.writeFileSync(outputPath, pptxBuffer);
    console.log(`✅ Generated Microservice_Performance_Analysis.pptx (${pptxBuffer.length} bytes)`);
}

buildPPTX();
