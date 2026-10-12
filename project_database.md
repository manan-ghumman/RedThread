# Database Architecture & Documentation (`osdbms`)
> **Target Audience:** AI Agents, Developers, and System Integrators  
> **System Name:** RedThread Blood Bank Management System  
> **Database Engine:** MySQL 8.0+ (InnoDB Engine with ACID Transactions & Row-Level Locking)

---

## 1. System Overview & Core Philosophy

The `osdbms` database powers **RedThread**, a distributed blood bank management system. It coordinates inventory tracking, emergency requests, donor management, and inter-branch blood transfers across a central hub and regional hospital network.

### Key Architectural Pillars
1. **Concurrency & Zero Double-Booking:** Uses database pessimistic row-level locking (`SELECT ... FOR UPDATE`) within explicit transactions (`START TRANSACTION ... COMMIT`) to prevent race conditions when multiple facilities request blood simultaneously.
2. **First-Expiring, First-Out (FEFO) Allocation:** Automatically prioritises older viable blood units nearing expiration to minimize spoilage (35–42 day shelf life).
3. **Hierarchical Facility Network:** Supports a Central Blood Bank (`ReportsTo IS NULL`) supervising regional hospitals (`ReportsTo = ParentFacilityID`).
4. **Automated Safety Triggers & Alerts:** Enforces strict donor health constraints (56-day donation window) and runs periodic routines for low-stock and expiry alerts.

---

## 2. Entity Relationship Overview

```
 [DONOR] ──(1:N)──► [DONATION] ──(1:N)──► [BLOOD_COMPONENT] ◄──(1:N)── [ALLOCATION]
                                                │                              ▲
                                                ├──(N:1)──► [FACILITY]         │
                                                │             ▲ (Self-Ref)     │
                                                │             └──(1:N)─────────┼── [BLOOD_REQUEST] ◄──(1:N)── [PATIENT]
                                                ├──(1:N)──► [TRANSFER]         │
                                                └──(1:N)──► [ALERT]            │
                                                                               │
 [BLOOD_COMPATIBILITY] (Static Matrix: DonorType ──► RecipientType) ───────────┘
```

---

## 3. Table Schemas & Data Dictionary

### 3.1 `DONOR`
Stores registered donor information, health eligibility status, and gamification points.
* `RedThreadID` (VARCHAR(20), **PK**): Unique donor identifier (e.g., `'D001'`).
* `Name` (VARCHAR(100), NOT NULL): Donor full name.
* `BloodType` (ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'), NOT NULL): Biological blood group.
* `KarmaPoints` (INT, DEFAULT 0, CHECK `>= 0`): Gamification score for frequent donations.
* `EligibilityStatus` (ENUM('Eligible','Not Eligible'), NOT NULL): Health fitness status.

### 3.2 `FACILITY`
Represents regional hubs and client healthcare institutions.
* `FacilityID` (VARCHAR(20), **PK**): Facility code (e.g., `'F001'`).
* `Type` (ENUM('Blood Bank','Hospital'), NOT NULL): Category of facility.
* `Location` (VARCHAR(100), NOT NULL): City or area name (e.g., `'Dehradun'`, `'Haridwar'`).
* `ReportsTo` (VARCHAR(20), NULL, **FK** -> `FACILITY.FacilityID` ON DELETE SET NULL ON UPDATE CASCADE): Points to parent central blood bank if it is a regional hospital.

### 3.3 `PATIENT`
Contains recipient profiles requesting blood units.
* `PatientID` (VARCHAR(20), **PK**): Recipient unique identifier (e.g., `'P001'`).
* `BloodType` (ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'), NOT NULL): Required recipient blood group.

### 3.4 `DONATION`
Records physical blood donation events.
* `DonationID` (VARCHAR(20), **PK**): Donation log code (e.g., `'DN001'`).
* `RedThreadID` (VARCHAR(20), NOT NULL, **FK** -> `DONOR.RedThreadID` ON DELETE RESTRICT ON UPDATE CASCADE).
* `DonationDate` (DATE, NOT NULL): Date donation was collected.
* `Volume_mL` (INT, CHECK `BETWEEN 200 AND 600`): Collected volume in millilitres.
* `FacilityID` (VARCHAR(20), NOT NULL, **FK** -> `FACILITY.FacilityID` ON DELETE RESTRICT ON UPDATE CASCADE).

### 3.5 `BLOOD_COMPONENT`
Individual inventory packets processed from donations.
* `ComponentID` (VARCHAR(20), **PK**): Unique unit packet ID (e.g., `'BC001'`).
* `DonationID` (VARCHAR(20), NOT NULL, **FK** -> `DONATION.DonationID` ON DELETE RESTRICT ON UPDATE CASCADE).
* `Type` (ENUM('RBC','Plasma','Platelets'), NOT NULL): Component classification.
* `ExpiryDate` (DATE, NOT NULL): Biological expiration date.
* `Status` (ENUM('Available','Reserved','In Transit','Transfused','Expired'), NOT NULL): Real-time inventory status.
* `FacilityID` (VARCHAR(20), NOT NULL, **FK** -> `FACILITY.FacilityID` ON DELETE RESTRICT ON UPDATE CASCADE): Current storage location.
* `PatientID` (VARCHAR(20), NULL, **FK** -> `PATIENT.PatientID` ON DELETE SET NULL ON UPDATE CASCADE): Assigned patient if reserved or transfused.

### 3.6 `BLOOD_REQUEST`
Order tickets raised by facilities for patient needs.
* `RequestID` (VARCHAR(20), **PK**): Request identifier (e.g., `'R001'`).
* `PatientID` (VARCHAR(20), NOT NULL, **FK** -> `PATIENT.PatientID` ON UPDATE CASCADE).
* `FacilityID` (VARCHAR(20), NOT NULL, **FK** -> `FACILITY.FacilityID` ON UPDATE CASCADE): Requesting hospital/branch.
* `ComponentType` (ENUM('RBC','Plasma','Platelets'), NOT NULL): Required product.
* `BloodType` (ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'), NOT NULL): Patient blood type.
* `Quantity` (INT, CHECK `Quantity > 0`): Number of units requested.
* `Priority` (ENUM('Emergency','Urgent','Routine'), NOT NULL): Triage level.
* `Status` (ENUM('Pending','Allocated','Fulfilled','Rejected'), DEFAULT `'Pending'`).
* `RequestTime` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP).

### 3.7 `ALLOCATION`
Junction table linking request tickets to reserved blood components.
* `AllocationID` (VARCHAR(20), **PK**): Unique record ID.
* `RequestID` (VARCHAR(20), NOT NULL, **FK** -> `BLOOD_REQUEST.RequestID` ON UPDATE CASCADE).
* `ComponentID` (VARCHAR(20), NOT NULL, UNIQUE, **FK** -> `BLOOD_COMPONENT.ComponentID` ON UPDATE CASCADE).
* `AllocatedAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP).

### 3.8 `TRANSFER`
Inter-facility transit records for rebalancing stock.
* `TransferID` (VARCHAR(20), **PK**): Transfer ticket ID (e.g., `'T001'`).
* `ComponentID` (VARCHAR(20), NOT NULL, **FK** -> `BLOOD_COMPONENT.ComponentID` ON UPDATE CASCADE).
* `FromFacility` (VARCHAR(20), NOT NULL, **FK** -> `FACILITY.FacilityID`).
* `ToFacility` (VARCHAR(20), NOT NULL, **FK** -> `FACILITY.FacilityID`).
* `Status` (ENUM('Initiated','In Transit','Completed','Cancelled'), NOT NULL).
* `InitiatedAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP).
* `CompletedAt` (TIMESTAMP, NULL).
* *Constraint:* `CHECK (FromFacility <> ToFacility)`.

### 3.9 `ALERT`
System notifications generated for inventory warnings.
* `AlertID` (INT AUTO_INCREMENT, **PK**).
* `FacilityID` (VARCHAR(20), NOT NULL, **FK** -> `FACILITY.FacilityID` ON UPDATE CASCADE).
* `ComponentID` (VARCHAR(20), NULL, **FK** -> `BLOOD_COMPONENT.ComponentID` ON DELETE SET NULL ON UPDATE CASCADE).
* `AlertType` (ENUM('Expiry','LowStock','Transfer'), NOT NULL).
* `Message` (VARCHAR(255), NOT NULL).
* `CreatedAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP).
* `IsRead` (BOOLEAN, DEFAULT `FALSE`).

### 3.10 `BLOOD_COMPATIBILITY`
Static matrix defining Red Blood Cell (RBC) compatibility rules.
* `DonorType` (ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'), NOT NULL).
* `RecipientType` (ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'), NOT NULL).
* **Primary Key:** (`DonorType`, `RecipientType`).

*Compatibility Map Examples:*
* `O-` -> Compatible with ALL recipient blood types (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`).
* `O+` -> Compatible with `O+`, `A+`, `B+`, `AB+`.
* `AB+` -> Can ONLY donate to `AB+` (Universal Recipient for RBCs).

---

## 4. Views & Indexing Performance

### 4.1 Indexing
* `idx_comp_facility_status`: `BLOOD_COMPONENT(FacilityID, Status)` -> Fast lookup of available stock at a branch.
* `idx_comp_expiry`: `BLOOD_COMPONENT(ExpiryDate)` -> Accelerated FEFO ordering and expiry sweeps.
* `idx_req_status_priority`: `BLOOD_REQUEST(Status, Priority, RequestTime)` -> Priority queue triage sorting.
* `idx_donation_donor_date`: `DONATION(RedThreadID, DonationDate)` -> Fast validation of donor 56-day gap.

### 4.2 Unified Inventory View (`v_inventory`)
Denormalised view providing complete details of every blood component:
```sql
CREATE VIEW v_inventory AS
SELECT bc.ComponentID, bc.Type, d.BloodType, bc.ExpiryDate, bc.Status, f.FacilityID, f.Location, bc.DonationID
FROM BLOOD_COMPONENT bc
JOIN DONATION dn ON bc.DonationID = dn.DonationID
JOIN DONOR d     ON dn.RedThreadID = d.RedThreadID
JOIN FACILITY f  ON bc.FacilityID = f.FacilityID;
```

---

## 5. Triggers & Stored Procedures

### 5.1 `trg_donation_rules` (Trigger on `DONATION`)
Enforces biological and safety regulations **BEFORE INSERT**:
1. Checks `DONOR.EligibilityStatus`: Throws SQL exception (`45000`) if donor is not `'Eligible'`.
2. Validates donation interval: Calculates `DATEDIFF(NEW.DonationDate, max_previous_donation)`. If `< 56 days`, throws SQL exception (`'Donor must wait at least 56 days between donations'`).

### 5.2 `check_alerts()` (Periodic System Procedure)
Maintains inventory hygiene and generates notifications:
1. **Expiry Sweep:** Marks any `'Available'` units with `ExpiryDate < CURDATE()` as `'Expired'`.
2. **Expiry Alerts:** Inserts `ALERT` records for components expiring within 7 days (`CURDATE()` to `CURDATE() + 7 days`).
3. **Low Stock Alerts:** Evaluates `v_inventory` per facility, component type, and blood type. If available non-expired count is `< 2 units`, generates a `'LowStock'` alert.

### 5.3 `allocate_request(p_request_id)` (Core Concurrency Engine)
Executes allocation with **pessimistic row-level locking** inside a transaction to guarantee ACID safety:

```sql
CALL allocate_request('R001');
```

**Internal Workflow for AI Agents:**
1. Starts explicit transaction (`START TRANSACTION`).
2. Locks the request row (`SELECT ... FOR UPDATE`).
3. Verifies request status is `'Pending'`.
4. Executes loop for `Quantity` needed:
   * Queries `BLOOD_COMPONENT` joined with `DONOR` and `BLOOD_COMPATIBILITY`.
   * Filters for `Status = 'Available'` and `ExpiryDate >= CURDATE()`.
   * Filters for exact blood type match OR compatible RBC donor type.
   * Sorts by `(d.BloodType = v_blood) DESC, bc.ExpiryDate ASC` (Prefers exact match first, then oldest expiring unit).
   * Locks the winning component row with `LIMIT 1 FOR UPDATE`.
   * Updates component status to `'Reserved'`.
   * Inserts row into `ALLOCATION` table.
5. Updates request status to `'Allocated'`.
6. Commits transaction (`COMMIT`).
7. Handled by SQLEXCEPTION handler: Executes `ROLLBACK` if stock is insufficient or a transaction deadlock occurs.

---

## 6. AI Agent Query Cheat-Sheet

When interacting with `osdbms`, AI agents should use the following standard SQL patterns:

### 6.1 Check Available Stock by Location & Component
```sql
SELECT BloodType, Type, COUNT(*) AS AvailableUnits
FROM v_inventory
WHERE Location = 'Dehradun' 
  AND Status = 'Available' 
  AND ExpiryDate >= CURDATE()
GROUP BY BloodType, Type;
```

### 6.2 Identify Units Expiring Within 7 Days (FEFO Prioritisation)
```sql
SELECT ComponentID, BloodType, Type, ExpiryDate, FacilityID
FROM v_inventory
WHERE Status = 'Available' 
  AND ExpiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY ExpiryDate ASC;
```

### 6.3 Allocate a Pending Blood Request
```sql
-- Safely trigger the stored procedure with row-level locking
CALL allocate_request('R001');
```

### 6.4 Query Active Unread System Alerts
```sql
SELECT AlertID, FacilityID, AlertType, Message, CreatedAt
FROM ALERT
WHERE IsRead = FALSE
ORDER BY CreatedAt DESC;
```

### 6.5 Validate Donor Eligibility Before Donation
```sql
SELECT RedThreadID, Name, EligibilityStatus, 
       (SELECT MAX(DonationDate) FROM DONATION WHERE RedThreadID = 'D001') AS LastDonation
FROM DONOR
WHERE RedThreadID = 'D001';
```

---

*End of Database Documentation for `osdbms` (RedThread Blood Bank Management System)*
