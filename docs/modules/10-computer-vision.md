# Module 10 — Computer Vision Modules

## Overview

Four computer vision features powered by Python (OpenCV, YOLO v8, MediaPipe, InsightFace) served via FastAPI endpoints with image/video frame input. All CV processing runs server-side with results streamed to the frontend.

---

## Architecture

```
Camera/Upload → Frontend → Node.js Backend → Python CV Service (FastAPI)
                                                ├── YOLO v8 (detection)
                                                ├── MediaPipe (pose/face mesh)
                                                ├── InsightFace (recognition)
                                                └── OpenCV (processing)
```

---

## 10.1 License Plate Recognition (LPR)

### Purpose
Automatically identify vehicles at entry/exit by reading license plates from camera frames.

### Technology
- **Model**: YOLOv11 (plate localization) + EasyOCR (text extraction)
- **Input**: Image frame (base64 or file upload) from gate cameras
- **Processing**: Detect plate region → crop → CLAHE contrast enhancement & bilateral filtering → OCR → format validation regex → match against vehicle registry

### Flow
```
Gate Camera Image → Plate Detection (YOLO) → Crop Region → Preprocess (CLAHE, Filter)
  → OCR (EasyOCR) → Format Validation (e.g. MH 12 AB 1234)
  → Query Vehicle DB → Log Entry/Exit → Return vehicle profile
```

### Entry/Exit Logging
When a known vehicle is identified at a facility gate, the system automatically creates an `AuditLog` entry (Category: VEHICLE, Action: CV_DETECTION) recording the timestamp, gate location, and plate confidence.

### API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/cv/lpr/detect` | Detect and read plate from image |
| POST | `/cv/lpr/identify` | Detect plate, validate format, and return vehicle profile |
| POST | `/cv/lpr/log-gate` | Detect plate and automatically log entry/exit |

### Output
```json
{
  "plateText": "MH12AB1234",
  "confidence": 0.94,
  "boundingBox": { "x": 120, "y": 340, "w": 200, "h": 60 },
  "vehicle": {
    "id": "clx...",
    "registrationNumber": "MH12AB1234",
    "model": "Tata Prima",
    "status": "AVAILABLE",
    "healthScore": 88
  }
}
```

---

## 10.2 Face Recognition (Driver Verification)

### Purpose
Verify that the assigned driver is the one operating the vehicle before dispatch.

### Technology
- **Model**: InsightFace (ArcFace) for embedding extraction + cosine similarity matching
- **Input**: Live camera frame + stored driver face profile

### Flow
```
Camera Frame → Face Detection → Extract Face Embedding
  → Compare with assigned driver's stored embedding
  → Cosine similarity > 0.6 → VERIFIED
  → Cosine similarity ≤ 0.6 → UNAUTHORIZED → Create SafetyEvent
```

### API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/cv/face/verify` | Verify driver identity |
| POST | `/cv/face/register` | Register face profile for driver |

### Output
```json
{
  "verified": true,
  "confidence": 0.87,
  "driverId": "clx...",
  "driverName": "Rajesh Kumar",
  "timestamp": "2026-07-12T08:30:00Z"
}
```

### Security Rules
- Face verification required before trip can transition from DISPATCHED to IN_PROGRESS
- Failed verification creates a CRITICAL SafetyEvent
- Face profiles stored as encrypted embedding vectors (not raw images)
- Minimum 3 face images during registration for robust matching

---

## 10.3 Seatbelt Detection

### Purpose
Detect whether the driver is wearing a seatbelt during the trip.

### Technology
- **Model**: YOLOv8 custom-trained on seatbelt/no-seatbelt dataset
- **Input**: Periodic camera frames (every 30 seconds during trip)

### Detection Classes
```
seatbelt_on    → COMPLIANT
seatbelt_off   → VIOLATION → Create SafetyEvent
no_person      → SKIP (empty seat)
uncertain      → SKIP (low confidence)
```

### API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/cv/seatbelt/detect` | Analyze frame for seatbelt |

### Output
```json
{
  "seatbeltDetected": false,
  "confidence": 0.91,
  "action": "VIOLATION",
  "eventCreated": true,
  "eventId": "clx..."
}
```

---

## 10.4 Drowsiness Detection

### Purpose
Detect driver fatigue through eye closure, yawning, and head tilt analysis.

### Technology
- **Model**: MediaPipe Face Mesh (468 landmarks) + custom drowsiness classifier
- **Input**: Continuous camera frames (every 2 seconds during trip)

### Detection Metrics

| Metric | Calculation | Threshold |
|---|---|---|
| EAR (Eye Aspect Ratio) | Vertical/Horizontal eye landmark distances | < 0.25 for 3+ consecutive frames |
| MAR (Mouth Aspect Ratio) | Vertical/Horizontal mouth distances | > 0.6 for sustained period |
| Head Tilt Angle | Face mesh orientation deviation | > 20° sustained for 5+ seconds |

### Alert Levels

| Level | Trigger | Action |
|---|---|---|
| WARNING | EAR < 0.25 for 2 seconds | In-app warning to driver |
| ALERT | EAR < 0.20 for 3+ seconds OR yawn + head tilt | Audio alert + notify dispatcher |
| CRITICAL | EAR < 0.15 for 5+ seconds | Emergency notification to all + recommend stop |

### API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/cv/drowsiness/analyze` | Analyze frame for drowsiness |

### Output
```json
{
  "drowsinessLevel": "ALERT",
  "ear": 0.19,
  "mar": 0.65,
  "headTilt": 12.5,
  "recommendation": "Driver showing signs of fatigue. Consider a rest break.",
  "eventCreated": true
}
```

---

## CV Service Configuration

```yaml
# cv-service/config.yaml
server:
  host: 0.0.0.0
  port: 8001
  workers: 2

models:
  yolo_plate: models/yolo_plate_v8n.pt
  yolo_seatbelt: models/yolo_seatbelt_v8n.pt
  insightface: models/buffalo_l
  
detection:
  plate_confidence: 0.7
  seatbelt_confidence: 0.75
  face_similarity: 0.6
  drowsiness_ear_threshold: 0.25
  
processing:
  max_image_size: 1920
  frame_resize: 640
```

---

## Demo / Hackathon Mode

For hackathon demonstration:
- LPR: Upload image → detect and identify
- Face: Upload photo → compare with stored profile
- Seatbelt: Upload image → detect compliance
- Drowsiness: Upload image or short video → analyze

All demos work with static images (no live camera required for presentation).
