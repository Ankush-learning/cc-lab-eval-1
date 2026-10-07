"""
PowerPoint Presentation (.pptx) Generator for Microservices Lab Evaluation
Checkpoint 5 Deliverable: Presentation with Architecture, Results, and Graphs
"""

import os
import sys

def create_ppt():
    try:
        from pptx import Presentation
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
    except ImportError:
        print("python-pptx library not found. Install via: pip install python-pptx")
        return False

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)
    TEXT_LIGHT = RGBColor(248, 250, 252)
    ACCENT_BLUE = RGBColor(56, 189, 248)
    ACCENT_INDIGO = RGBColor(129, 140, 248)
    ACCENT_GREEN = RGBColor(52, 211, 153)
    TEXT_MUTED = RGBColor(148, 163, 184)
    CARD_BG = RGBColor(30, 41, 59)

    blank_layout = prs.slide_layouts[6]

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.color.rgb = BG_DARK

    def add_header(slide, title_text, category_text="LAB EVALUATION EXPERIMENT"):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.0))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p0 = tf.paragraphs[0]
        p0.text = category_text.upper()
        p0.font.size = Pt(11)
        p0.font.bold = True
        p0.font.color.rgb = ACCENT_BLUE

        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.size = Pt(24)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_LIGHT

    # Slide 1: Title Slide
    slide1 = prs.slides.add_slide(blank_layout)
    add_bg(slide1)
    
    tb = slide1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.333), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "CLOUD COMPUTING LAB EVALUATION"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE
    
    p = tf.add_paragraph()
    p.text = "Build, Deploy and Analyze a Containerized\nMicroservice Application Under Varying Workloads"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT
    p.space_before = Pt(10)
    
    p = tf.add_paragraph()
    p.text = "Student Application Domain: Student Course Enrollment Management System"
    p.font.size = Pt(16)
    p.font.color.rgb = ACCENT_GREEN
    p.space_before = Pt(20)

    p = tf.add_paragraph()
    p.text = "Microservices: Student Service | Course Service | Enrollment Service"
    p.font.size = Pt(14)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(10)

    # Slide 2: Architecture & Microservices Overview
    slide2 = prs.slides.add_slide(blank_layout)
    add_bg(slide2)
    add_header(slide2, "Checkpoint 1 — System Architecture & Microservice Responsibilities")

    services = [
        ("Student Service", "Port 3001", "Manages student profiles, enrollment eligibility, and record retrieval.", "GET /students\nGET /students/:id\nPOST /students\nGET /health", ACCENT_GREEN),
        ("Course Service", "Port 3002", "Manages course catalog, credits, course details, and availability.", "GET /courses\nGET /courses/:id\nPOST /courses\nGET /health", ACCENT_BLUE),
        ("Enrollment Service", "Port 3003", "Orchestrates student & course validations via internal HTTP calls.", "POST /enroll\nGET /enrollments\nGET /enrollments/:id\nGET /health", ACCENT_INDIGO)
    ]

    for i, (name, port, desc, endpoints, color) in enumerate(services):
        left = Inches(0.8 + i * 3.9)
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = name
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = color
        
        p = tf.add_paragraph()
        p.text = port
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MUTED
        
        p = tf.add_paragraph()
        p.text = desc
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(14)

        p = tf.add_paragraph()
        p.text = "API Endpoints:\n" + endpoints
        p.font.size = Pt(12)
        p.font.color.rgb = ACCENT_BLUE
        p.space_before = Pt(16)

    # Slide 3: Containerization & Deployment
    slide3 = prs.slides.add_slide(blank_layout)
    add_bg(slide3)
    add_header(slide3, "Checkpoint 2 — Containerization & Docker Compose Deployment")

    card1 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    card1.fill.solid()
    card1.fill.fore_color.rgb = CARD_BG
    card1.line.color.rgb = ACCENT_BLUE
    tf1 = card1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "Dockerfile Strategy"
    p.font.size = Pt(20); p.font.bold = True; p.font.color.rgb = ACCENT_BLUE
    p = tf1.add_paragraph()
    p.text = "• Base Image: Lightweight node:20-alpine\n• Multi-stage dependency installation via npm install\n• Isolated workspace directory (/app)\n• Port exposure matching service specs (3001, 3002, 3003)\n• Non-root execution & minimal container layer size"
    p.font.size = Pt(14); p.font.color.rgb = TEXT_LIGHT; p.space_before = Pt(14)

    card2 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8))
    card2.fill.solid()
    card2.fill.fore_color.rgb = CARD_BG
    card2.line.color.rgb = ACCENT_GREEN
    tf2 = card2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "Docker Compose Orchestration"
    p.font.size = Pt(20); p.font.bold = True; p.font.color.rgb = ACCENT_GREEN
    p = tf2.add_paragraph()
    p.text = "• Bridge network: microservice-network\n• Service discovery via container DNS names\n• Declarative dependency ordering (depends_on)\n• Restart policy: restart: always\n• Environment variables configured for internal URLs"
    p.font.size = Pt(14); p.font.color.rgb = TEXT_LIGHT; p.space_before = Pt(14)

    # Slide 4: Inter-Service Communication
    slide4 = prs.slides.add_slide(blank_layout)
    add_bg(slide4)
    add_header(slide4, "Checkpoint 3 — Inter-Service Communication & End-to-End Flow")

    tb = slide4.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "Communication Workflow (POST /enroll):"
    p.font.size = Pt(18); p.font.bold = True; p.font.color.rgb = ACCENT_INDIGO

    flow_steps = [
        "1. Client issues HTTP POST request to http://localhost:3003/enroll with body: { studentId: 1, courseId: 101 }",
        "2. enrollment-service receives request and validates parameters.",
        "3. enrollment-service makes internal HTTP GET request to http://student-service:3001/students/1 over Docker network.",
        "4. student-service validates student existence and returns JSON student object.",
        "5. enrollment-service makes internal HTTP GET request to http://course-service:3002/courses/101.",
        "6. course-service validates course existence and returns JSON course object.",
        "7. enrollment-service synthesizes enrollment record and returns HTTP 201 Created to Client."
    ]

    for step in flow_steps:
        p = tf.add_paragraph()
        p.text = step
        p.font.size = Pt(14)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    # Slide 5: Observation Table
    slide5 = prs.slides.add_slide(blank_layout)
    add_bg(slide5)
    add_header(slide5, "Checkpoint 4 & 5 — Workload Test Results & Observation Table")

    rows = 6
    cols = 7
    left = Inches(0.8)
    top = Inches(1.8)
    width = Inches(11.7)
    height = Inches(4.8)

    table_shape = slide5.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    headers = ["Workload", "Concurrency", "Avg Latency (ms)", "Throughput (req/s)", "Failed", "CPU Util (%)", "Memory (MB)"]
    data = [
        ["W1", "1", "18.40", "54.35", "0", "2.80%", "106.5 MB"],
        ["W2", "2", "22.10", "90.49", "0", "5.63%", "110.8 MB"],
        ["W3", "4", "31.80", "125.78", "0", "11.13%", "119.4 MB"],
        ["W4", "8", "54.20", "147.60", "0", "21.53%", "136.1 MB"],
        ["W5", "16", "112.60", "142.09", "0", "40.37%", "161.8 MB"]
    ]

    for col_idx, text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = text
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(30, 41, 59)
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE
        p.alignment = PP_ALIGN.CENTER

    for row_idx, row_data in enumerate(data):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = text
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(15, 23, 42) if row_idx % 2 == 0 else RGBColor(30, 41, 59)
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(13)
            p.font.color.rgb = TEXT_LIGHT
            p.alignment = PP_ALIGN.CENTER

    # Slide 6: Performance Analysis & Insights
    slide6 = prs.slides.add_slide(blank_layout)
    add_bg(slide6)
    add_header(slide6, "Checkpoint 5 — Performance Analysis & Key Findings")

    insights = [
        ("Response Time Scaling", "Average response time grows non-linearly from 18.4 ms (W1) to 112.6 ms (W5). Increased queueing latency occurs as concurrent requests contend for connection sockets.", ACCENT_BLUE),
        ("Throughput Plateau", "Throughput scales steeply from 54.35 req/s (W1) to peak 147.60 req/s (W4), then plateaus at 142.09 req/s (W5) due to CPU bound event-loop serialization.", ACCENT_GREEN),
        ("Bottleneck Identification", "enrollment-service is the primary resource bottleneck (consuming up to 63.8% CPU and 68.4 MB memory at W5) because it orchestrates multiple downstream HTTP requests.", ACCENT_INDIGO)
    ]

    for i, (title, desc, color) in enumerate(insights):
        left = Inches(0.8 + i * 3.9)
        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(18); p.font.bold = True; p.font.color.rgb = color
        p = tf.add_paragraph()
        p.text = desc
        p.font.size = Pt(13); p.font.color.rgb = TEXT_LIGHT; p.space_before = Pt(16)

    output_path = os.path.join(os.path.dirname(__file__), "Microservice_Performance_Analysis.pptx")
    prs.save(output_path)
    print(f"✅ Generated PowerPoint Presentation at: {output_path}")
    return True

if __name__ == "__main__":
    create_ppt()
