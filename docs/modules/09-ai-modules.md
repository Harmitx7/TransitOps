# Module 09 — AI Intelligence Modules

## Overview

Five AI-powered modules providing operational intelligence: Smart Dispatch, Route Optimization, Fuel Prediction, Predictive Maintenance, and Health/Safety Scoring. The ML models are served via a Python FastAPI microservice, consumed by the Node.js backend.

---

## Architecture

```
React Frontend
  → Node.js Backend (Express)
    → Python ML Service (FastAPI)
      → Scikit-learn / XGBoost models
      → OpenRouteService API (routes)
```

Communication: REST API calls from Node to Python service. Python service runs on port 8000.

---

## 9.1 Smart Dispatch Recommendation

### Purpose
Rank available vehicles for a trip based on multi-factor scoring.

### Input
```json
{
  "source": { "lat": 19.076, "lng": 72.877 },
  "destination": { "lat": 18.520, "lng": 73.856 },
  "cargoWeight": 5.0,
  "cargoType": "electronics",
  "scheduledAt": "2026-07-15T08:00:00Z"
}
```

### Ranking Factors

| Factor | Weight | Logic |
|---|---|---|
| Distance to Pickup | 20% | Closer vehicle scores higher |
| Capacity Match | 20% | Closest to required capacity without exceeding |
| Vehicle Health Score | 15% | Higher health = higher rank |
| Maintenance Status | 10% | No upcoming maintenance = bonus |
| Fuel Efficiency | 15% | Better efficiency = higher rank |
| Driver Availability | 10% | Available driver assigned to this vehicle |
| Driver Safety Score | 10% | Higher safety score = higher rank |

### Output
```json
{
  "recommendations": [
    {
      "rank": 1,
      "vehicleId": "clx...",
      "registrationNumber": "MH12AB1234",
      "score": 87.5,
      "driver": { "id": "clx...", "name": "Rajesh Kumar", "safetyScore": 92 },
      "reasons": ["Closest to pickup (12km)", "Health: 95/100", "Fuel efficiency: 8.2 km/l"]
    }
  ]
}
```

### API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/dispatch/recommend` | Get ranked vehicle recommendations |

---

## 9.2 Route Optimization

### Purpose
Provide multiple route options optimized for different criteria.

### Integration
OpenRouteService (ORS) integration via Node.js backend proxy. 
> **Important 2026 Architecture Note:** All requests must route to the new `api.heigit.org` endpoints (the legacy `api.openrouteservice.org` is deprecated). The client must never call ORS directly; all calls go through the Node.js backend which attaches the API key and performs Zod schema validation on coordinate inputs to prevent quota wastage.

### Route Types

| Route | Optimization | API Profile |
|---|---|---|
| Fastest | Minimize time | `driving-hgv` with fastest weighting |
| Fuel Efficient | Minimize distance | `driving-hgv` with shortest weighting |
| Lowest Toll | Avoid tolls | `driving-hgv` with `avoid_features: ["tollways"]` |

### Output per Route
```json
{
  "type": "fastest",
  "distance": 148.5,
  "duration": 180,
  "fuelEstimate": 18.5,
  "tollEstimate": 320,
  "geometry": { "type": "LineString", "coordinates": [...] }
}
```

### API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/routes/optimize` | Get 3 route options |

---

## 9.3 Fuel Prediction

### Purpose
Predict expected fuel consumption for a planned trip.

### Model
XGBoost regression trained on historical trip data.

### Features

| Feature | Source |
|---|---|
| Distance | Route distance |
| Cargo weight | Trip cargo |
| Vehicle type | Vehicle registry |
| Vehicle age | Acquisition date |
| Vehicle fuel efficiency | Historical average |
| Driver efficiency score | Historical fuel/km |
| Road type | Route metadata |
| Season / weather | Date + weather API |

### Output
```json
{
  "predictedLiters": 18.2,
  "confidenceRange": { "low": 16.5, "high": 20.1 },
  "factors": {
    "distance": "148 km contributes ~14.8L baseline",
    "cargo": "+1.2L for 5 ton cargo",
    "driver": "+0.8L based on driver history"
  }
}
```

### API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/fuel/predict` | Predict fuel for trip |

---

## 9.4 Predictive Maintenance

### Purpose
Predict when next maintenance services will be needed.

### Model
Gradient Boosted Decision Tree (XGBoost classifier + regression).

### Predictions

| Prediction | Based On |
|---|---|
| Next Oil Change | Mileage since last, fuel efficiency trend |
| Next Brake Service | Mileage, braking events, last service |
| Battery Replacement | Age, voltage readings (if available), climate |
| General Service Due | Composite health factors |

### Output
```json
{
  "vehicleId": "clx...",
  "predictions": [
    {
      "service": "Oil Change",
      "predictedDate": "2026-08-15",
      "predictedOdometer": 85000,
      "confidence": 0.89,
      "urgency": "MEDIUM",
      "estimatedCost": 2500
    }
  ]
}
```

### API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ai/maintenance/predict/:vehicleId` | Predict maintenance for vehicle |
| GET | `/ai/maintenance/fleet-forecast` | Fleet-wide maintenance forecast |

---

## 9.5 Health & Safety Scoring

Already detailed in modules 03 (Vehicle Health) and 04 (Driver Safety). The AI service provides the calculation engine:

### API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ai/health/vehicle/:vehicleId` | Calculate vehicle health score |
| GET | `/ai/safety/driver/:driverId` | Calculate driver safety score |
| POST | `/ai/health/recalculate-all` | Batch recalculate all scores |

---

## ML Model Training

### Data Requirements

| Model | Minimum Training Data |
|---|---|
| Fuel Prediction | 100+ completed trips |
| Predictive Maintenance | 50+ maintenance records per vehicle |
| Dispatch Scoring | Rule-based (no training needed) |
| Health/Safety Scores | Rule-based (no training needed) |

### Fallback Strategy

When insufficient training data exists:
1. **Fuel Prediction**: Use rule-based estimation (distance / baseline efficiency)
2. **Predictive Maintenance**: Use manufacturer-recommended intervals
3. Both models improve automatically as data accumulates

### Model Retraining
- Scheduled: weekly via cron
- Triggered: after 100 new data points
- Model versions stored with timestamp for rollback
