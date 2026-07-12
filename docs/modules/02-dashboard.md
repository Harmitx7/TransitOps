# Module 02 — Dashboard & KPIs

## Overview

Role-specific dashboards providing real-time operational intelligence through KPI cards, interactive charts, and contextual filters. Each role sees only metrics relevant to their responsibilities.

---

## KPI Cards (Real-time)

### Fleet Manager Dashboard

| KPI | Calculation | Update Frequency |
|---|---|---|
| Total Vehicles | COUNT(vehicles) | Real-time |
| Active Vehicles | COUNT(vehicles WHERE status = ON_TRIP) | Real-time |
| Available Vehicles | COUNT(vehicles WHERE status = AVAILABLE) | Real-time |
| In Maintenance | COUNT(vehicles WHERE status = MAINTENANCE) | Real-time |
| Fleet Utilization | (Active / Total) × 100 | Every 5 min |
| Avg Vehicle Health | AVG(healthScore) | Hourly |

### Dispatcher Dashboard

| KPI | Calculation | Update Frequency |
|---|---|---|
| Active Trips | COUNT(trips WHERE status = IN_PROGRESS) | Real-time |
| Pending Trips | COUNT(trips WHERE status = DRAFT/DISPATCHED) | Real-time |
| Completed Today | COUNT(trips WHERE completedAt = TODAY) | Real-time |
| Drivers On Duty | COUNT(drivers WHERE status = ON_TRIP) | Real-time |
| Avg Trip Duration | AVG(completedAt - startedAt) for today | Hourly |
| Delayed Trips | COUNT(trips WHERE ETA exceeded) | Every 5 min |

### Financial Analyst Dashboard

| KPI | Calculation | Update Frequency |
|---|---|---|
| Total Revenue | SUM(trips.revenue) for period | Hourly |
| Operational Cost | SUM(expenses + fuel + maintenance) | Hourly |
| Fuel Cost | SUM(fuelLogs.cost) for period | Hourly |
| Maintenance Cost | SUM(maintenance.totalCost) for period | Hourly |
| Net Profit | Revenue - Total Costs | Hourly |
| ROI | (Revenue - Cost) / Cost × 100 | Daily |
| Cost Per Km | Total Cost / Total Km | Daily |

### Safety Officer Dashboard

| KPI | Calculation | Update Frequency |
|---|---|---|
| Avg Driver Score | AVG(drivers.safetyScore) | Daily |
| Seatbelt Violations | COUNT(events WHERE type = SEATBELT) today | Real-time |
| Drowsiness Alerts | COUNT(events WHERE type = DROWSINESS) today | Real-time |
| Expiring Licenses | COUNT(drivers WHERE licenseExpiry < 30 days) | Daily |
| Failed Inspections | COUNT(inspections WHERE status = FAILED) today | Real-time |

### Administrator Dashboard

| KPI | Calculation | Update Frequency |
|---|---|---|
| Total Users | COUNT(users) | Real-time |
| Active Users Today | COUNT(users WHERE lastLogin = TODAY) | Hourly |
| Pending Approvals | COUNT(users WHERE isActive = false AND role != ADMIN) | Real-time |
| Audit Events Today | COUNT(auditLogs WHERE createdAt = TODAY) | Real-time |
| System Uptime | Process uptime from health check | Every 5 min |
| Failed Logins (24h) | COUNT(auditLogs WHERE action = LOGIN_FAILED AND last 24h) | Hourly |

### Driver Dashboard

| KPI | Calculation | Update Frequency |
|---|---|---|
| Assigned Trips | COUNT(trips WHERE driverId = self AND status IN [DISPATCHED, IN_PROGRESS]) | Real-time |
| Completed This Month | COUNT(trips WHERE driverId = self AND completedAt IN month) | Real-time |
| My Safety Score | driver.safetyScore | Daily |
| Pending Inspections | COUNT(inspections WHERE driverId = self AND status = IN_PROGRESS) | Real-time |
| Next Trip | Nearest scheduled trip details | Real-time |
| Total Km This Month | SUM(trips.distanceActual) for self this month | Daily |

---

## Charts

### Chart Specifications

| Chart | Type | Data Source | Period |
|---|---|---|---|
| Fleet Status Distribution | Donut | vehicles.status | Current |
| Fuel Consumption Trends | Area | fuelLogs grouped by week | 12 weeks |
| Maintenance Trends | Bar | maintenance grouped by month | 6 months |
| Expense Breakdown | Stacked Bar | expenses by category | Monthly |
| Revenue vs Cost | Dual Line | trips.revenue vs total costs | 12 months |
| Vehicle Utilization Heatmap | Heatmap | trips per vehicle per day | 30 days |
| Trip Volume | Line | trips grouped by day | 30 days |
| Driver Safety Distribution | Histogram | drivers.safetyScore buckets | Current |
| Top 5 Costly Vehicles | Horizontal Bar | maintenance + fuel by vehicle | 6 months |
| Route Efficiency | Scatter | planned vs actual distance | 30 days |
| Vehicle Performance Trends | Multi-Line | healthScore per vehicle over time | 6 months |
| Driver Performance Trends | Multi-Line | safetyScore per driver over time | 6 months |

---

## Filters

All dashboards support these global filters:

| Filter | Options | Default |
|---|---|---|
| Date Range | Today, This Week, This Month, Custom | This Month |
| Region | All, North, South, East, West, Custom | All |
| Vehicle Type | All, Truck, Bus, Van, Car, Bike | All |
| Vehicle Status | All, Available, On Trip, Maintenance, Retired | All |
| Driver | All, Specific Driver | All |

Filters persist across page navigation within a session (stored in Zustand).

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/fleet-kpis` | Bearer | Fleet manager KPIs |
| GET | `/dashboard/dispatch-kpis` | Bearer | Dispatcher KPIs |
| GET | `/dashboard/financial-kpis` | Bearer | Financial KPIs |
| GET | `/dashboard/safety-kpis` | Bearer | Safety KPIs |
| GET | `/dashboard/charts/:chartId` | Bearer | Chart data by ID |
| GET | `/dashboard/summary` | Bearer | Role-based summary |

All endpoints accept query params: `dateFrom`, `dateTo`, `region`, `vehicleType`, `status`.

---

## Implementation Notes

- **Recharts** for all chart rendering (responsive, composable)
- **React Query** with `staleTime: 300000` (5 min) for KPIs, `60000` (1 min) for real-time counts
- KPI cards animate with `framer-motion` number counters on load
- Charts lazy-loaded below the fold
- Dashboard layout uses CSS Grid: 4-col on desktop, 2-col on tablet, 1-col on mobile
- Dark mode: chart colors adapt via CSS custom properties
