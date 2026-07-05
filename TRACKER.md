# Memory.md — Backend Engineering Journey Tracking

## Current State & Context
- **Current Objective:** System Setup & Level 0 Initialization
- **Active Codebase Branch:** `main` (Initial Setup)
- **Framework/Language Selected:** [User to specify: e.g., Node.js (TypeScript) or Python]
- **Target Metrics Archetype:** Local machine baseline profiling

---

## Roadmap Progression Status

### LEVEL 0 — Mechanics
- [x] Raw HTTP Server (No Framework) | Status: COMPLETED
- [x] Idempotence & Protocol Probing | Status: COMPLETED
- [x] Baseline Chaos Probing         | Status: COMPLETED

### LEVEL 1 — Core Backend Mechanics
- [x] 1.1 API Design (Cursors, Idempotency Keys) | Status: COMPLETED
- [ ] 1.2 Relational Databases (Indexes, Migrations) | Status: NOT STARTED
- [ ] 1.3 Auth & Identity (Sessions, JWT, OAuth, CPU Tuning) | Status: NOT STARTED
- [ ] 1.4 Validation & Centralized Errors (RFC 7807) | Status: NOT STARTED

### LEVEL 2 — Data & Concurrency
- [ ] 2.1 Caching (Cache-Aside, Stampede Mutexes) | Status: NOT STARTED
- [ ] 2.2 Background Jobs (BullMQ/Celery, Idempotent Workers) | Status: NOT STARTED
- [ ] 2.3 SQL Concurrency (Pessimistic/Optimistic Locking, Deadlocks) | Status: NOT STARTED
- [ ] 2.4 NoSQL (Document vs Tabular Write Performance) | Status: NOT STARTED

### LEVEL 3 — Distributed Systems Basics
- [ ] 3.1 Horizontal Scaling & L7 Load Balancing | Status: NOT STARTED
- [ ] 3.2 Resilience (Rate Limiting, Redis-backed Counters, Circuit Breakers) | Status: NOT STARTED
- [ ] 3.3 Message Brokers (Kafka/RabbitMQ, Fan-out, Ordering) | Status: NOT STARTED
- [ ] 3.4 Bounded Contexts & API Gateways | Status: NOT STARTED

### LEVEL 4 — Reliability & Operations
- [ ] 4.1 Observability (Structured Logging, Correlation IDs, OpenTelemetry) | Status: NOT STARTED
- [ ] 4.2 Containerization & Production Readiness Probes | Status: NOT STARTED
- [ ] 4.3 Testing Strategy (Testcontainers, Soak Testing, k6 Performance Gates) | Status: NOT STARTED
- [ ] 4.4 Security Hardening (SQLi Exploitation, Least-Privilege Roles) | Status: NOT STARTED

---

## Production Scars & Hard Metrics Log
*This section will log the exact numbers we break and fix throughout the journey.*

| Level | Topic / Experiment | "Broken" Baseline Metric | "Fixed" Guardrail Metric | Key Engineering Takeaway |
| :--- | :--- | :--- | :--- | :--- |
| e.g., 1.2 | Unindexed vs Indexed | 100k rows: 142ms (Seq Scan) | 100k rows: 0.8ms (Index Scan) | Stats matter; run ANALYZE after bulk seed. |
| 0 | Unprotected Stream Parsing | Parsing Malformed JSON: App Crash (Exit Code 1) / Infinite data: Buffer unbounded entry | 400 Bad Request / 0ms crash prevention | Raw streams will consume infinite memory and throw untrapped exceptions unless bounded explicitly. |
| 1.1 | API Cursor Pagination | Offset pagination scans linearly O(N) and risk page drift | Cursor isolates exact offset locations utilizing O(log N) sequence keys. | Cursors prevent mutations from causing item skipping or deuplication during infinite scroll processing. |
| 1.1 | Idempotency Verification | Concurrent network retires generate duplicate database entries | Atomic trackign blocks overlapping requests and safely replays historical records | Idempotency tracking precvents double billing and daa corruption under high network jitter |
---

## Architecture / Pattern Decisions Ledger
*A permanent record of why we choose certain paths over others.*
- *Entry 001:* Initializing project architecture. Opting for a monolithic layout that explicitly exposes raw network layers before wrapping them in middleware frameworks.
