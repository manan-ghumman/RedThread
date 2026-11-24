USE redthread_db;

-- 1. Expand FACILITY hierarchy (North, South, East, West -> Central F001 -> State -> City Blood Bank -> Hospital)
INSERT IGNORE INTO FACILITY (FacilityID, FacilityName, Type, FacilityLevel, StateName, Location, ReportsTo) VALUES
  ('F022', 'Karnataka State Blood Bank', 'Blood Bank', 'State', 'Karnataka', 'Bengaluru', 'F001'),
  ('F023', 'Tamil Nadu State Blood Bank', 'Blood Bank', 'State', 'Tamil Nadu', 'Chennai', 'F001'),
  ('F024', 'Bengaluru City Blood Bank', 'Blood Bank', 'City', 'Karnataka', 'Bengaluru', 'F022'),
  ('F025', 'Mysuru City Blood Bank', 'Blood Bank', 'City', 'Karnataka', 'Mysuru', 'F022'),
  ('F026', 'Chennai City Blood Bank', 'Blood Bank', 'City', 'Tamil Nadu', 'Chennai', 'F023'),
  ('F027', 'Coimbatore City Blood Bank', 'Blood Bank', 'City', 'Tamil Nadu', 'Coimbatore', 'F023'),
  ('F028', 'Bengaluru General Hospital', 'Hospital', 'Hospital', 'Karnataka', 'Bengaluru', 'F024'),
  ('F029', 'Mysuru District Hospital', 'Hospital', 'Hospital', 'Karnataka', 'Mysuru', 'F025'),
  ('F030', 'Chennai Medical Hospital', 'Hospital', 'Hospital', 'Tamil Nadu', 'Chennai', 'F026'),
  ('F031', 'Coimbatore Civil Hospital', 'Hospital', 'Hospital', 'Tamil Nadu', 'Coimbatore', 'F027'),
  ('F032', 'West Bengal State Blood Bank', 'Blood Bank', 'State', 'West Bengal', 'Kolkata', 'F001'),
  ('F033', 'Odisha State Blood Bank', 'Blood Bank', 'State', 'Odisha', 'Bhubaneswar', 'F001'),
  ('F034', 'Kolkata City Blood Bank', 'Blood Bank', 'City', 'West Bengal', 'Kolkata', 'F032'),
  ('F035', 'Siliguri City Blood Bank', 'Blood Bank', 'City', 'West Bengal', 'Siliguri', 'F032'),
  ('F036', 'Bhubaneswar City Blood Bank', 'Blood Bank', 'City', 'Odisha', 'Bhubaneswar', 'F033'),
  ('F037', 'Cuttack City Blood Bank', 'Blood Bank', 'City', 'Odisha', 'Cuttack', 'F033'),
  ('F038', 'Kolkata General Hospital', 'Hospital', 'Hospital', 'West Bengal', 'Kolkata', 'F034'),
  ('F039', 'Siliguri District Hospital', 'Hospital', 'Hospital', 'West Bengal', 'Siliguri', 'F035'),
  ('F040', 'Bhubaneswar Medical Hospital', 'Hospital', 'Hospital', 'Odisha', 'Bhubaneswar', 'F036'),
  ('F041', 'Cuttack Civil Hospital', 'Hospital', 'Hospital', 'Odisha', 'Cuttack', 'F037'),
  ('F042', 'Maharashtra State Blood Bank', 'Blood Bank', 'State', 'Maharashtra', 'Mumbai', 'F001'),
  ('F043', 'Gujarat State Blood Bank', 'Blood Bank', 'State', 'Gujarat', 'Ahmedabad', 'F001'),
  ('F044', 'Mumbai City Blood Bank', 'Blood Bank', 'City', 'Maharashtra', 'Mumbai', 'F042'),
  ('F045', 'Pune City Blood Bank', 'Blood Bank', 'City', 'Maharashtra', 'Pune', 'F042'),
  ('F046', 'Ahmedabad City Blood Bank', 'Blood Bank', 'City', 'Gujarat', 'Ahmedabad', 'F043'),
  ('F047', 'Surat City Blood Bank', 'Blood Bank', 'City', 'Gujarat', 'Surat', 'F043'),
  ('F048', 'Mumbai General Hospital', 'Hospital', 'Hospital', 'Maharashtra', 'Mumbai', 'F044'),
  ('F049', 'Pune Medical Hospital', 'Hospital', 'Hospital', 'Maharashtra', 'Pune', 'F045'),
  ('F050', 'Ahmedabad Civil Hospital', 'Hospital', 'Hospital', 'Gujarat', 'Ahmedabad', 'F046'),
  ('F051', 'Surat District Hospital', 'Hospital', 'Hospital', 'Gujarat', 'Surat', 'F047');

-- 2. Expand PERSON to 1,000 rows (RT0001 - RT1000)
INSERT IGNORE INTO PERSON (RedThreadID, Name, BloodType)
WITH RECURSIVE seq AS (
  SELECT 201 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
)
SELECT
  CONCAT('RT', LPAD(n, 4, '0')) AS RedThreadID,
  CONCAT(
    ELT(1 + (n % 12), 'Aarav','Ananya','Vihaan','Diya','Rohan','Meera','Kabir','Ishita','Aditya','Kavya','Siddharth','Nandini'),
    ' ',
    ELT(1 + (n % 12), 'Sharma','Verma','Patel','Nair','Rao','Iyer','Kapoor','Joshi','Das','Kulkarni','Menon','Gupta')
  ) AS Name,
  ELT(1 + (n % 8), 'O+','A+','B+','AB+','O-','A-','B-','AB-') AS BloodType
FROM seq;

-- 3. Populate DONOR up to 1,000 rows (RT0001 - RT1000)
INSERT IGNORE INTO DONOR (RedThreadID, KarmaPoints, EligibilityStatus)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
)
SELECT
  CONCAT('RT', LPAD(n, 4, '0')) AS RedThreadID,
  (n * 7) % 250 AS KarmaPoints,
  CASE WHEN n % 12 = 0 THEN 'Not Eligible' ELSE 'Eligible' END AS EligibilityStatus
FROM seq;

-- 4. Populate PATIENT up to 1,000 rows (RT0001 - RT1000)
INSERT IGNORE INTO PATIENT (RedThreadID)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
)
SELECT
  CONCAT('RT', LPAD(n, 4, '0')) AS RedThreadID
FROM seq;

-- 5. Populate DONATION up to 1,000 rows (DN0001 - DN1000) respecting Volume_mL (200..600) & trg_donation_rules

INSERT INTO DONATION (DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID)
WITH RECURSIVE seq AS (
  SELECT 151 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
),
numbered_seq AS (
  SELECT n, ROW_NUMBER() OVER (ORDER BY n) AS seq_rn
  FROM seq
),
eligible_donors AS (
  SELECT d.RedThreadID,
         ROW_NUMBER() OVER (ORDER BY d.RedThreadID) AS rn
  FROM DONOR d
  WHERE d.EligibilityStatus = 'Eligible'
    AND d.RedThreadID > 'RT0150'
),
facilities AS (
  SELECT FacilityID,
         ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn,
         COUNT(*) OVER () AS total_f
  FROM FACILITY
)
SELECT
  CONCAT('DN', LPAD(ns.n, 4, '0')) AS DonationID,
  ed.RedThreadID,
  DATE_SUB('2026-11-20', INTERVAL (ns.n % 90) DAY) AS DonationDate,
  350 + ((ns.n * 25) % 226) AS Volume_mL,
  f.FacilityID
FROM numbered_seq ns
JOIN eligible_donors ed
  ON ed.rn = ns.seq_rn
JOIN facilities f
  ON f.rn = ((ns.n % f.total_f) + 1);

SELECT 'DONATION' AS tbl, COUNT(*) AS cnt FROM DONATION;

-- 6. Populate BLOOD_COMPONENT up to 1,000 rows (BC0001 - BC1000)
INSERT IGNORE INTO BLOOD_COMPONENT (ComponentID, DonationID, Type, ExpiryDate, Status, FacilityID, RecipientRedThreadID)
WITH RECURSIVE seq AS (
  SELECT 301 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
),
donations_ordered AS (
  SELECT DonationID, DonationDate, FacilityID,
         ROW_NUMBER() OVER (ORDER BY DonationID) AS rn,
         COUNT(*) OVER () AS total_dn
  FROM DONATION
),
facilities_ordered AS (
  SELECT FacilityID,
         ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn,
         COUNT(*) OVER () AS total_f
  FROM FACILITY
),
patients_ordered AS (
  SELECT RedThreadID,
         ROW_NUMBER() OVER (ORDER BY RedThreadID) AS rn,
         COUNT(*) OVER () AS total_pt
  FROM PATIENT
)
SELECT
  CONCAT('BC', LPAD(s.n, 4, '0')) AS ComponentID,
  d.DonationID,
  ELT(1 + (s.n % 3), 'RBC', 'Plasma', 'Platelets') AS Type,
  CASE
    WHEN (s.n % 3) = 0 THEN DATE_ADD(d.DonationDate, INTERVAL 45 DAY)
    WHEN (s.n % 3) = 1 THEN DATE_ADD(d.DonationDate, INTERVAL 365 DAY)
    ELSE DATE_ADD(d.DonationDate, INTERVAL 60 DAY)
  END AS ExpiryDate,
  CASE
    WHEN (s.n % 10) IN (0, 1, 2, 3, 4) THEN 'Available'
    WHEN (s.n % 10) IN (5, 6) THEN 'Reserved'
    WHEN (s.n % 10) = 7 THEN 'In Transit'
    WHEN (s.n % 10) = 8 THEN 'Transfused'
    ELSE 'Expired'
  END AS Status,
  f.FacilityID,
  CASE
    WHEN (s.n % 10) = 8 THEN p.RedThreadID
    ELSE NULL
  END AS RecipientRedThreadID
FROM seq s
JOIN donations_ordered d
  ON d.rn = (((s.n - 1) % d.total_dn) + 1)
JOIN facilities_ordered f
  ON f.rn = (((s.n * 3) % f.total_f) + 1)
LEFT JOIN patients_ordered p
  ON p.rn = (((s.n * 5) % p.total_pt) + 1);

-- 7. Populate BLOOD_REQUEST (only referencing patients that exist in PATIENT table)
--    Uses JOIN on PATIENT to avoid FK violations.
INSERT IGNORE INTO BLOOD_REQUEST (RequestID, RedThreadID, FacilityID, ComponentType, BloodType, Quantity, Priority, Status, RequestTime)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 400
),
patients_ordered AS (
  SELECT RedThreadID,
         ROW_NUMBER() OVER (ORDER BY RedThreadID) AS rn,
         COUNT(*) OVER () AS total_pt
  FROM PATIENT
),
facilities_ordered AS (
  SELECT FacilityID,
         ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn,
         COUNT(*) OVER () AS total_f
  FROM FACILITY
)
SELECT
  CONCAT('R', LPAD(s.n, 4, '0')) AS RequestID,
  p.RedThreadID,
  f.FacilityID,
  ELT(1 + (s.n % 3), 'RBC', 'Plasma', 'Platelets') AS ComponentType,
  ELT(1 + (s.n % 8), 'O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-') AS BloodType,
  1 AS Quantity,
  ELT(1 + (s.n % 3), 'Emergency', 'Urgent', 'Routine') AS Priority,
  CASE
    WHEN s.n % 4 = 0 THEN 'Allocated'
    WHEN s.n % 4 = 1 THEN 'Fulfilled'
    WHEN s.n % 4 = 2 THEN 'Rejected'
    ELSE 'Pending'
  END AS Status,
  DATE_SUB(NOW(), INTERVAL (s.n % 60) DAY) AS RequestTime
FROM seq s
JOIN patients_ordered p
  ON p.rn = (((s.n - 1) % p.total_pt) + 1)
JOIN facilities_ordered f
  ON f.rn = (((s.n * 2) % f.total_f) + 1);

-- Guaranteed fresh Pending requests for automated allocation (blood types across all 8 groups)
INSERT IGNORE INTO BLOOD_REQUEST (RequestID, RedThreadID, FacilityID, ComponentType, BloodType, Quantity, Priority, Status, RequestTime)
SELECT
  CONCAT('RQ', LPAD(s.n, 4, '0')),
  p.RedThreadID,
  f.FacilityID,
  ELT(1 + (s.n % 3), 'RBC', 'Plasma', 'Platelets'),
  ELT(1 + (s.n % 8), 'O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'),
  1,
  ELT(1 + (s.n % 3), 'Emergency', 'Urgent', 'Routine'),
  'Pending',
  DATE_SUB(NOW(), INTERVAL (s.n % 24) HOUR)
FROM
  (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
   UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
   UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
   UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20) s
JOIN (SELECT RedThreadID, ROW_NUMBER() OVER (ORDER BY RedThreadID) AS rn FROM PATIENT) p
  ON p.rn = s.n
JOIN (SELECT FacilityID, ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn FROM FACILITY WHERE Type='Blood Bank') f
  ON f.rn = ((s.n % (SELECT COUNT(*) FROM FACILITY WHERE Type='Blood Bank')) + 1);

UPDATE BLOOD_REQUEST_ID_COUNTER
SET LastValue = 420
WHERE CounterID = 1 AND LastValue < 420;

-- 8. Populate ALLOCATION up to 1,000 rows (ALX0001 - ALX1000) with unique ComponentIDs
INSERT IGNORE INTO ALLOCATION (AllocationID, RequestID, ComponentID, AllocatedAt)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
),
requests_ordered AS (
  SELECT RequestID,
         ROW_NUMBER() OVER (ORDER BY RequestID) AS rn,
         COUNT(*) OVER () AS total_r
  FROM BLOOD_REQUEST
),
components_ordered AS (
  SELECT ComponentID,
         ROW_NUMBER() OVER (ORDER BY ComponentID) AS rn
  FROM BLOOD_COMPONENT
)
SELECT
  CONCAT('ALX', LPAD(s.n, 4, '0')) AS AllocationID,
  r.RequestID,
  c.ComponentID,
  DATE_SUB(NOW(), INTERVAL (s.n % 45) DAY) AS AllocatedAt
FROM seq s
JOIN requests_ordered r
  ON r.rn = (((s.n - 1) % r.total_r) + 1)
JOIN components_ordered c
  ON c.rn = s.n;

-- 9. Populate TRANSFER up to 1,000 rows (T0001 - T1000)
INSERT IGNORE INTO TRANSFER (TransferID, ComponentID, FromFacility, ToFacility, Status, InitiatedAt, CompletedAt)
WITH RECURSIVE seq AS (
  SELECT 31 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
),
components_ordered AS (
  SELECT ComponentID,
         ROW_NUMBER() OVER (ORDER BY ComponentID) AS rn,
         COUNT(*) OVER () AS total_c
  FROM BLOOD_COMPONENT
),
facilities_ordered AS (
  SELECT FacilityID,
         ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn,
         COUNT(*) OVER () AS total_f
  FROM FACILITY
)
SELECT
  CONCAT('T', LPAD(s.n, 4, '0')) AS TransferID,
  c.ComponentID,
  f_from.FacilityID AS FromFacility,
  f_to.FacilityID AS ToFacility,
  ELT(1 + (s.n % 4), 'Initiated', 'In Transit', 'Completed', 'Cancelled') AS Status,
  DATE_SUB(NOW(), INTERVAL (s.n % 30) DAY) AS InitiatedAt,
  CASE
    WHEN (s.n % 4) = 2 THEN DATE_ADD(DATE_SUB(NOW(), INTERVAL (s.n % 30) DAY), INTERVAL 4 HOUR)
    ELSE NULL
  END AS CompletedAt
FROM seq s
JOIN components_ordered c
  ON c.rn = (((s.n - 1) % c.total_c) + 1)
JOIN facilities_ordered f_from
  ON f_from.rn = (((s.n * 2) % f_from.total_f) + 1)
JOIN facilities_ordered f_to
  ON f_to.rn = ((((s.n * 2) + 1) % f_to.total_f) + 1);

-- 10. Populate ALERT up to 1,000 rows
INSERT INTO ALERT (FacilityID, ComponentID, AlertType, Message, CreatedAt, IsRead)
WITH RECURSIVE seq AS (
  SELECT 31 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
),
facilities_ordered AS (
  SELECT FacilityID,
         ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn,
         COUNT(*) OVER () AS total_f
  FROM FACILITY
),
components_ordered AS (
  SELECT ComponentID,
         ROW_NUMBER() OVER (ORDER BY ComponentID) AS rn,
         COUNT(*) OVER () AS total_c
  FROM BLOOD_COMPONENT
)
SELECT
  f.FacilityID,
  CASE
    WHEN (s.n % 3) = 1 THEN NULL
    ELSE c.ComponentID
  END AS ComponentID,
  ELT(1 + (s.n % 3), 'Expiry', 'LowStock', 'Transfer') AS AlertType,
  CASE
    WHEN (s.n % 3) = 0 THEN CONCAT('Component ', c.ComponentID, ' is approaching expiry; review stock.')
    WHEN (s.n % 3) = 1 THEN CONCAT('Low stock monitoring required at facility ', f.FacilityID, '.')
    ELSE CONCAT('Transfer status review required for component ', c.ComponentID, '.')
  END AS Message,
  DATE_SUB(NOW(), INTERVAL (s.n % 20) DAY) AS CreatedAt,
  CASE WHEN (s.n % 4) = 0 THEN TRUE ELSE FALSE END AS IsRead
FROM seq s
JOIN facilities_ordered f
  ON f.rn = (((s.n - 1) % f.total_f) + 1)
JOIN components_ordered c
  ON c.rn = (((s.n * 2) % c.total_c) + 1);

-- 11. Populate DONOR_APPOINTMENT up to 1,000 rows (APT0001 - APT1000)
INSERT IGNORE INTO DONOR_APPOINTMENT (AppointmentID, RedThreadID, FacilityID, AppointmentDate, PreferredTime, Status, CreatedAt)
WITH RECURSIVE seq AS (
  SELECT 3 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
),
donors_ordered AS (
  SELECT RedThreadID,
         ROW_NUMBER() OVER (ORDER BY RedThreadID) AS rn,
         COUNT(*) OVER () AS total_d
  FROM DONOR
),
facilities_ordered AS (
  SELECT FacilityID,
         ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn,
         COUNT(*) OVER () AS total_f
  FROM FACILITY
)
SELECT
  CONCAT('APT', LPAD(s.n, 4, '0')) AS AppointmentID,
  d.RedThreadID,
  f.FacilityID,
  DATE_ADD('2026-11-25', INTERVAL (s.n % 45) DAY) AS AppointmentDate,
  ELT(1 + (s.n % 4), '09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM') AS PreferredTime,
  ELT(1 + (s.n % 4), 'Pending', 'Confirmed', 'Completed', 'Cancelled') AS Status,
  DATE_SUB(NOW(), INTERVAL (s.n % 15) DAY) AS CreatedAt
FROM seq s
JOIN donors_ordered d
  ON d.rn = (((s.n - 1) % d.total_d) + 1)
JOIN facilities_ordered f
  ON f.rn = (((s.n * 3) % f.total_f) + 1);

-- 12. Populate USERS up to 1,000 rows (preserving U001 - U004 default accounts)
INSERT IGNORE INTO USERS (UserID, Username, PasswordHash, Role, AssociatedID, Email, CreatedAt)
WITH RECURSIVE seq AS (
  SELECT 5 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 1000
),
donors_ordered AS (
  SELECT RedThreadID,
         ROW_NUMBER() OVER (ORDER BY RedThreadID) AS rn,
         COUNT(*) OVER () AS total_d
  FROM DONOR
),
facilities_ordered AS (
  SELECT FacilityID,
         ROW_NUMBER() OVER (ORDER BY FacilityID) AS rn,
         COUNT(*) OVER () AS total_f
  FROM FACILITY
)
SELECT
  CONCAT('U', LPAD(s.n, 4, '0')) AS UserID,
  CONCAT('user_', LPAD(s.n, 4, '0')) AS Username,
  CONCAT('pass_', LPAD(s.n, 4, '0')) AS PasswordHash,
  ELT(1 + (s.n % 4), 'Donor', 'Hospital', 'Blood Bank', 'Admin') AS Role,
  CASE
    WHEN (s.n % 4) = 0 THEN d.RedThreadID
    WHEN (s.n % 4) IN (1, 2) THEN f.FacilityID
    ELSE NULL
  END AS AssociatedID,
  CONCAT('user', LPAD(s.n, 4, '0'), '@redthread.org') AS Email,
  DATE_SUB(NOW(), INTERVAL (s.n % 30) DAY) AS CreatedAt
FROM seq s
JOIN donors_ordered d
  ON d.rn = (((s.n - 1) % d.total_d) + 1)
JOIN facilities_ordered f
  ON f.rn = (((s.n * 2) % f.total_f) + 1);

-- 13. Final Verification Queries
SELECT 'FACILITY' AS table_name, COUNT(*) AS row_count FROM FACILITY
UNION ALL SELECT 'PERSON', COUNT(*) FROM PERSON
UNION ALL SELECT 'DONOR', COUNT(*) FROM DONOR
UNION ALL SELECT 'PATIENT', COUNT(*) FROM PATIENT
UNION ALL SELECT 'DONATION', COUNT(*) FROM DONATION
UNION ALL SELECT 'BLOOD_COMPONENT', COUNT(*) FROM BLOOD_COMPONENT
UNION ALL SELECT 'BLOOD_REQUEST', COUNT(*) FROM BLOOD_REQUEST
UNION ALL SELECT 'ALLOCATION', COUNT(*) FROM ALLOCATION
UNION ALL SELECT 'TRANSFER', COUNT(*) FROM TRANSFER
UNION ALL SELECT 'ALERT', COUNT(*) FROM ALERT
UNION ALL SELECT 'BLOOD_COMPATIBILITY', COUNT(*) FROM BLOOD_COMPATIBILITY
UNION ALL SELECT 'USERS', COUNT(*) FROM USERS
UNION ALL SELECT 'DONOR_APPOINTMENT', COUNT(*) FROM DONOR_APPOINTMENT
UNION ALL SELECT 'SYSTEM_SETTINGS', COUNT(*) FROM SYSTEM_SETTINGS;

SELECT UserID, Username, Role, AssociatedID FROM USERS WHERE UserID IN ('U001','U002','U003','U004');