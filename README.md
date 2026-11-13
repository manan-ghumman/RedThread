# RedThread: A Blood Bank Management System (OSDBMS)

[![Build Status](https://img.shields.io/badge/Build-Success-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passing-brightgreen.svg)]()
[![Java](https://img.shields.io/badge/Java-21%20(No%20Spring%20Boot)-orange.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-blue.svg)]()
[![Database](https://img.shields.io/badge/Database-MySQL%208.0-blue.svg)]()

> **BTECH OSDBMS-V-2026 Phase-III Final Project**  
> **Team Name:** Last_Of_Us  
> **Team ID:** #OSDBMS-V-2026-T071  
> **Team Members:**
> - Mansi Kabdal (*Team Lead*) — `24022066`
> - Ishtita Goel — `24022976`
> - Manandeep Singh Ghumman — `24021185`
> 
> **Repository:** [https://github.com/manan-ghumman/RedThread](https://github.com/manan-ghumman/RedThread)

---

## 📖 Executive Summary

**RedThread** is an enterprise-grade, full-stack Blood Bank Management System engineered to bridge low-level **Operating Systems (OS)** resource management principles with robust **Relational Database Management (DBMS)** transactional consistency. 

Blood products (Red Blood Cells, Platelets, and Plasma) are acutely perishable resources with strict shelf-life constraints and clinical compatibility barriers (ABO/Rh types). RedThread models blood units as protected shared resources, applying scheduling, locking, deadlock mitigation, and fair load-balancing algorithms to ensure zero wastage, instant emergency triage, and strictly atomic allocations.

---

## 🏛️ System Architecture

RedThread follows a decoupled 5-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│              1. Presentation Layer (Frontend)               │
│          React 19 + Vite • Role-Based Web Dashboards        │
│          (Admin, Hospital, Blood Bank, Donor Panels)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / RESTful JSON
┌──────────────────────────────▼──────────────────────────────┐
│             2. Application Layer (Java Backend)             │
│    JDK Built-in com.sun.net.httpserver (Zero Frameworks)    │
│    Controllers • REST Handlers • Lightweight JSON Engine    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     3. OS Algorithm Layer   ││    4. Data Access Layer      │
│  • Multi-Level Priority     ││  • Connection-Pooled JDBC    │
│  • Concurrency & Mutex 2PL  ││  • PreparedStatements        │
│  • Havender Deadlock Guard  ││  • Transaction Management    │
│  • Min-Max Fair Balancer    ││  • ACID Rollback Controls    │
└──────────────┬──────────────┘└──────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│                5. Data Storage Layer (MySQL)                │
│       Normalized 3NF Schema • Foreign Keys • Cascades       │
│       Stored Procedures • Integrity Triggers • Views        │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Operating Systems (OS) Concepts & Algorithms

RedThread translates fundamental operating system concepts directly into software architecture and logistics management:

### 1. Multi-Level Priority Scheduling with FCFS Tie-Breaking (CPU Scheduling Analog)
*Implementation:* `AllocationModule.java`, `AllocationHandler.java`
- **Concept:** Critical requests must preempt routine requisitions to prevent mortality.
- **Priority Classes:**
  1. `Critical` (Rank 1)
  2. `Emergency` (Rank 2)
  3. `Urgent` (Rank 3)
  4. `Routine` (Rank 4)
- **Data Structure:** Java `PriorityQueue<BloodRequest>` managed by a composite multi-tier `Comparator`:
  ```java
  Comparator.comparingInt((BloodRequest r) -> getPriorityRank(r.priority)) // Tier 1: Static Priority
      .thenComparing(r -> r.requestTime)                                  // Tier 2: FCFS (Arrival Time)
      .thenComparing(Comparator.comparingInt(r -> r.karmaPoints).reversed()) // Tier 3: Karma Aging
      .thenComparing(r -> r.requestId);                                   // Tier 4: Deterministic ID
  ```
- **FCFS Ordering:** When two requests have equal severity, the request with the earlier timestamp (`RequestTime`) is allocated first.

### 2. Starvation Mitigation via Karma Points (Aging Analog)
*Implementation:* `PrioritySchedulingTest.java`, `AllocationModule.java`
- **Concept:** In standard static priority scheduling, lower-priority tasks risk infinite starvation if a continuous stream of higher-priority tasks arrives.
- **Mechanism:** RedThread implements an **Aging Mechanism** using **Karma Points**. Regular donors accumulate points upon each donation. When multiple `Routine` requests compete for scarce matching blood, donors with higher Karma Points receive a priority boost, guaranteeing service and preventing starvation.

### 3. FEFO & FIFO Cache Replacement (Page Replacement Analog)
*Implementation:* Stored procedure `allocate_request`, `BLOOD_COMPONENT` queries
- **Concept:** Analogous to FIFO (First-In, First-Out) and LRU (Least Recently Used) cache/page replacement algorithms.
- **Mechanism:** Blood products have rigid expiration windows:
  - Platelets: 5 days
  - Red Blood Cells (RBC): 42 days
  - Plasma: 365 days
- **Query Filter:** Units are allocated using **FEFO (First-Expired, First-Out)**:
  ```sql
  ORDER BY (donor_person.BloodType = v_blood) DESC, bc.ExpiryDate ASC
  ```
  The unit nearest to expiration is selected first, minimizing spoilage and optimizing stock freshness.

### 4. Mutual Exclusion & Two-Phase Locking (2PL Concurrency Control)
*Implementation:* `AllocationHandler.java`, `allocate_request` procedure
- **Concept:** Preventing **Race Conditions** where two hospital threads attempt to allocate the exact same blood unit concurrently (double-allocation bug).
- **Mechanism:**
  - Employs **Pessimistic Row-Level Locking** via `SELECT ... FOR UPDATE`.
  - Enforces **Two-Phase Locking (2PL)**: growing phase locks request and matching component rows; shrinking phase transitions status from `Available` $\rightarrow$ `Reserved` $\rightarrow$ `Transfused` and releases locks upon `COMMIT`.

### 5. Deadlock Prevention via Havender’s Resource Ordering
*Implementation:* `DeadlockHandlingTest.java`, `AllocationHandler.java`
- **Concept:** Circular wait is one of Coffman's four necessary conditions for deadlock. If Thread A holds Component 1 and waits for Component 2, while Thread B holds Component 2 and waits for Component 1, both stall permanently.
- **Mechanism:** RedThread enforces **Havender's Global Resource Ordering**. All resources are indexed and acquired in strict ascending numerical order (`ORDER BY ComponentID ASC, RequestID ASC`). Because no thread can request a lower-indexed resource while holding a higher-indexed one, **Circular Wait is mathematically eliminated**.

### 6. Min-Max Fair Sharing & Equal Load Balancing (Cluster Resource Distribution)
*Implementation:* `DistributionHandler.java`, `AdminPages.jsx`
- **Concept:** In distributed systems, cluster resource schedulers (e.g., Fair-Share schedulers) balance workloads across nodes to prevent hotspotting.
- **Mechanism:** Admin can trigger equal distribution across blood banks and hospitals within any district:
  $$\text{Target Share} = \left\lfloor \frac{\text{Total Available Units in District}}{\text{Number of Facilities in District}} \right\rfloor$$
  Surplus facilities ($\text{Delta} > 0$) automatically transfer units to deficit facilities ($\text{Delta} < 0$), establishing perfect parity ($\pm 1$ unit) across the district.

### 7. Producer-Consumer Problem (Bounded Buffer Management)
*Implementation:* `DonationHandler.java`, `RequestHandler.java`, `BLOOD_COMPONENT` table
- **Producers:** Donors and mobile camps produce inventory (`INSERT INTO DONATION` $\rightarrow$ `BLOOD_COMPONENT`).
- **Consumers:** Hospitals and patients consume inventory (`BLOOD_REQUEST` $\rightarrow$ `ALLOCATION`).
- **Bounded Buffer:** Central blood bank facilities represent bounded buffers monitored by capacity thresholds and automated low-stock alerts.

### 8. Hierarchical Spanning Tree Routing (Network / IPC Analog)
*Implementation:* `FACILITY` recursive hierarchy (`ReportsTo`), `TRANSFER` table
- Facilities are organized in an acyclic spanning tree:
  $$\text{Central (F001)} \longrightarrow \text{State (F002–F004)} \longrightarrow \text{City Blood Banks (F005–F012)} \longrightarrow \text{Hospitals (F013–F021)}$$
- Unfulfilled hospital requests escalate upstream through parent nodes in the hierarchy to coordinate inter-facility logistics.

---

## 🗄️ Database Management System (DBMS) Concepts

RedThread's data tier is implemented in MySQL 8.0, maintaining strict third normal form (3NF) and enterprise consistency:

### 1. Relational Schema & Table Architecture (14 Tables)
1. **`PERSON`**: Base entity storing demographic and clinical blood group (`BloodType`).
2. **`DONOR`**: Extends `PERSON` with eligibility status, last donation date, and `KarmaPoints`.
3. **`PATIENT`**: Extends `PERSON` tracking recipient hospitalizations.
4. **`FACILITY`**: Hierarchical network of blood banks and hospitals with recursive `ReportsTo`.
5. **`DONATION`**: Tracks collection events, volume in mL, donor ID, and collection facility.
6. **`BLOOD_COMPONENT`**: Granular inventory units (`RBC`, `Plasma`, `Platelets`) with individual shelf-life timestamps and status (`Available`, `Reserved`, `In Transit`, `Transfused`, `Expired`).
7. **`BLOOD_REQUEST`**: Hospital orders with priority tiers (`Critical`, `Emergency`, `Urgent`, `Routine`).
8. **`ALLOCATION`**: Immutable mapping linking a request to its specific fulfilled component unit.
9. **`TRANSFER`**: Inter-facility dispatch logs tracking transit from source to destination.
10. **`ALERT`**: System notification queue triggered by stock shortages or expiration events.
11. **`BLOOD_COMPATIBILITY`**: Full clinical matrix modeling donor-recipient compatibility for RBC, Whole Blood, and Platelets.
12. **`BLOOD_REQUEST_ID_COUNTER`**: Sequence generator for unique transactional request IDs.
13. **`USERS`**: Role-based authentication store with hashed credentials (`Admin`, `Hospital`, `Blood Bank`, `Donor`).
14. **`DONOR_APPOINTMENT`**: Appointment booking table linking donors, facilities, and preferred time slots.
15. **`SYSTEM_SETTINGS`**: Key-value operational configuration (low stock thresholds, automation mode, app settings).

### 2. ACID Transactional Guarantees
- **Atomicity:** Blood allocation executes within an all-or-nothing transaction block. If matching inventory falls short of requested quantity, the entire transaction calls `ROLLBACK`, leaving stock unchanged.
- **Consistency:** Enforced by foreign key constraints (`ON DELETE CASCADE`, `ON UPDATE CASCADE`) preventing orphan records during multi-facility transfers.
- **Isolation:** Serialized execution via row-level locks prevents dirty reads and lost updates under high concurrency.
- **Durability:** Committed dispatches and transfers are permanently recorded in write-ahead transaction logs (InnoDB engine).

### 3. Stored Procedures & Business Logic Decoupling
- **`allocate_request(IN p_request_id VARCHAR(20))`**:
  - Atomically searches compatible stock using the `BLOOD_COMPATIBILITY` matrix.
  - Locks eligible components `FOR UPDATE`.
  - Reserves the unit, updates request status to `Allocated`, and logs into `ALLOCATION`.
- **`create_blood_request(...)`**: Validates patient existence and queues emergency requisitions.
- **`check_alerts()`**: Background audit procedure identifying units expiring within 7 days and flagging facilities falling below minimum buffer thresholds.

### 4. Database Integrity Triggers
- **`trg_donation_rules`**: A `BEFORE INSERT` trigger on `DONATION` that verifies donor eligibility before accepting blood:
  ```sql
  CREATE TRIGGER trg_donation_rules
  BEFORE INSERT ON DONATION
  FOR EACH ROW
  BEGIN
    DECLARE v_status VARCHAR(20);
    SELECT EligibilityStatus INTO v_status FROM DONOR WHERE RedThreadID = NEW.RedThreadID;
    IF v_status IS NULL OR v_status <> 'Eligible' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Donor is not eligible to donate';
    END IF;
  END$$
  ```

### 5. High-Performance Views & Indexing
- **`v_inventory`**: Real-time aggregation joining `BLOOD_COMPONENT`, `DONATION`, `PERSON`, and `FACILITY` to report live available units without expensive client-side joins.
- **`v_pending_requests`**: Filtered view for clinical staff monitoring open orders ordered by severity rank.
- **`v_request_history`**: Comprehensive audit trail for hospital and blood bank administrators.
- **B-Tree Indexes:**
  - `idx_comp_facility_status` on `BLOOD_COMPONENT(FacilityID, Status)`
  - `idx_comp_expiry` on `BLOOD_COMPONENT(ExpiryDate)`
  - `idx_req_status_priority` on `BLOOD_REQUEST(Status, Priority, RequestTime)`

---

## 🧪 Testing & Validation Suite

RedThread includes automated test suites covering all claims in the Phase-III evaluation report:

```powershell
mvn test
```

### Test Execution Results (9/9 Passed):
1. **`PrioritySchedulingTest.java`**:
   - `testEmergencyPreemptsRoutineOrders`: Verifies emergency requisitions jump ahead of older routine orders.
   - `testFcfsWithinSamePriorityTier`: Verifies arrival timestamp breaks ties within identical priority classes.
   - `testKarmaAgingPriorityBoost`: Verifies Karma Points act as an aging mechanism to prevent starvation.
2. **`DeadlockHandlingTest.java`**:
   - `testHavendersResourceOrderingEliminatesCircularWait`: Verifies strict sequential locking order breaks circular waits.
3. **`BloodCompatibilityTest.java`**:
   - `testUniversalDonorCompatibility`: Verifies $O^-$ can safely donate to all recipient blood types.
   - `testUniversalRecipientCompatibility`: Verifies $AB^+$ can safely receive from all 8 blood groups.
   - `testIncompatibleTransfusionRejected`: Verifies clinical rejections (e.g., $A^+$ receiving $B^+$ or $AB^+$).
4. **`AppTest.java`**:
   - Configuration fallback and environment variable verification.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Java Development Kit (JDK) 21+**
- **Apache Maven 3.9+**
- **Node.js (v18+) & npm**
- **MySQL Server 8.0+**

### 1. Database Configuration
Open MySQL command line or workbench:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < "Phase 3 Final Database.sql"
```
Configure your credentials in `.env`:
```ini
REDTHREAD_DB_URL=jdbc:mysql://localhost:3306/redthread_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
REDTHREAD_DB_USER=root
REDTHREAD_DB_PASSWORD=your_mysql_password
```

### 2. Start Java Backend
```powershell
mvn clean compile
mvn exec:java
```
*Backend runs at: `http://localhost:8080/api`*

### 3. Start Frontend Dashboard
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

---

## 👥 Default Login Credentials

| Role | Username | Password | Default Facility / Entity | Associated Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | Global Administration | `/admin-dashboard` |
| **Hospital Staff** | `hospital` | `hospital123` | `F013` (Doon General Hospital) | `/dashboard` |
| **Blood Bank Admin** | `bloodbank` | `bloodbank123` | `F005` (Dehradun City Blood Bank) | `/blood-bank` |
| **Blood Donor** | `donor` | `donor123` | `RT0001` (Ananya Pant) | `/donor-dashboard` |

---

## 📜 Project Deliverables Mapping

| Phase-III Report Deliverable | Implementation File(s) | Status |
| :--- | :--- | :---: |
| **Normalized MySQL Schema** | [`Phase 3 Final Database.sql`](Phase%203%20Final%20Database.sql) | ✅ Complete |
| **Modular Java REST API** | [`ApiServer.java`](src/main/java/com/example/server/ApiServer.java), Handlers in `src/main/java/com/example/server/handlers/` | ✅ Complete |
| **Interactive Web UI** | React components in `frontend/src/pages/` | ✅ Complete |
| **OS Priority Queue** | [`AllocationModule.java`](src/main/java/com/example/modules/AllocationModule.java), [`AllocationHandler.java`](src/main/java/com/example/server/handlers/AllocationHandler.java) | ✅ Complete |
| **District Fair-Share Balancer** | [`DistributionHandler.java`](src/main/java/com/example/server/handlers/DistributionHandler.java), `AdminDistribution` in [`AdminPages.jsx`](frontend/src/pages/AdminPages.jsx) | ✅ Complete |
| **Unit & Integration Tests** | `src/test/java/com/example/` | ✅ Complete |

