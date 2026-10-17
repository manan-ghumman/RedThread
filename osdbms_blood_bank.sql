-- RedThread blood bank database

CREATE DATABASE IF NOT EXISTS osdbms;
USE osdbms;

-- Create tables

-- Donor table
CREATE TABLE DONOR (
    RedThreadID       VARCHAR(20)  PRIMARY KEY,
    Name              VARCHAR(100) NOT NULL,
    BloodType         ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    KarmaPoints       INT NOT NULL DEFAULT 0 CHECK (KarmaPoints >= 0),
    EligibilityStatus ENUM('Eligible','Not Eligible') NOT NULL
) ENGINE=InnoDB;

-- Facility table
CREATE TABLE FACILITY (
    FacilityID VARCHAR(20)  PRIMARY KEY,
    Type       ENUM('Blood Bank','Hospital') NOT NULL,
    Location   VARCHAR(100) NOT NULL,
    ReportsTo  VARCHAR(20)  NULL,
    FOREIGN KEY (ReportsTo) REFERENCES FACILITY(FacilityID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Patient table
CREATE TABLE PATIENT (
    PatientID VARCHAR(20) PRIMARY KEY,
    BloodType ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL
) ENGINE=InnoDB;

-- Donation table
CREATE TABLE DONATION (
    DonationID   VARCHAR(20) PRIMARY KEY,
    RedThreadID  VARCHAR(20) NOT NULL,
    DonationDate DATE        NOT NULL,
    Volume_mL    INT         NOT NULL CHECK (Volume_mL BETWEEN 200 AND 600),
    FacilityID   VARCHAR(20) NOT NULL,
    FOREIGN KEY (RedThreadID) REFERENCES DONOR(RedThreadID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (FacilityID)  REFERENCES FACILITY(FacilityID)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Blood component table
-- FacilityID is where the component is stored, or its destination if in transit
CREATE TABLE BLOOD_COMPONENT (
    ComponentID VARCHAR(20) PRIMARY KEY,
    DonationID  VARCHAR(20) NOT NULL,
    Type        ENUM('RBC','Plasma','Platelets') NOT NULL,
    ExpiryDate  DATE        NOT NULL,
    Status      ENUM('Available','Reserved','In Transit','Transfused','Expired') NOT NULL,
    FacilityID  VARCHAR(20) NOT NULL,
    PatientID   VARCHAR(20) NULL,
    FOREIGN KEY (DonationID) REFERENCES DONATION(DonationID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (FacilityID) REFERENCES FACILITY(FacilityID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (PatientID)  REFERENCES PATIENT(PatientID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Blood request table
CREATE TABLE BLOOD_REQUEST (
    RequestID     VARCHAR(20) PRIMARY KEY,
    PatientID     VARCHAR(20) NOT NULL,
    FacilityID    VARCHAR(20) NOT NULL,
    ComponentType ENUM('RBC','Plasma','Platelets') NOT NULL,
    BloodType     ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    Quantity      INT NOT NULL CHECK (Quantity > 0),
    Priority      ENUM('Emergency','Urgent','Routine') NOT NULL,
    Status        ENUM('Pending','Allocated','Fulfilled','Rejected') NOT NULL DEFAULT 'Pending',
    RequestTime   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PatientID)  REFERENCES PATIENT(PatientID)   ON UPDATE CASCADE,
    FOREIGN KEY (FacilityID) REFERENCES FACILITY(FacilityID) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Allocation table
CREATE TABLE ALLOCATION (
    AllocationID VARCHAR(20) PRIMARY KEY,
    RequestID    VARCHAR(20) NOT NULL,
    ComponentID  VARCHAR(20) NOT NULL UNIQUE,
    AllocatedAt  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (RequestID)   REFERENCES BLOOD_REQUEST(RequestID)     ON UPDATE CASCADE,
    FOREIGN KEY (ComponentID) REFERENCES BLOOD_COMPONENT(ComponentID) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Transfer table
CREATE TABLE TRANSFER (
    TransferID   VARCHAR(20) PRIMARY KEY,
    ComponentID  VARCHAR(20) NOT NULL,
    FromFacility VARCHAR(20) NOT NULL,
    ToFacility   VARCHAR(20) NOT NULL,
    Status       ENUM('Initiated','In Transit','Completed','Cancelled') NOT NULL,
    InitiatedAt  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CompletedAt  TIMESTAMP NULL,
    FOREIGN KEY (ComponentID)  REFERENCES BLOOD_COMPONENT(ComponentID) ON UPDATE CASCADE,
    FOREIGN KEY (FromFacility) REFERENCES FACILITY(FacilityID),
    FOREIGN KEY (ToFacility)   REFERENCES FACILITY(FacilityID),
    CHECK (FromFacility <> ToFacility)
) ENGINE=InnoDB;

-- Alert table
CREATE TABLE ALERT (
    AlertID     INT AUTO_INCREMENT PRIMARY KEY,
    FacilityID  VARCHAR(20)  NOT NULL,
    ComponentID VARCHAR(20)  NULL,
    AlertType   ENUM('Expiry','LowStock','Transfer') NOT NULL,
    Message     VARCHAR(255) NOT NULL,
    CreatedAt   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IsRead      BOOLEAN      NOT NULL DEFAULT FALSE,
    FOREIGN KEY (FacilityID)  REFERENCES FACILITY(FacilityID)         ON UPDATE CASCADE,
    FOREIGN KEY (ComponentID) REFERENCES BLOOD_COMPONENT(ComponentID) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Blood compatibility table
-- These are red cell rules only
CREATE TABLE BLOOD_COMPATIBILITY (
    DonorType     ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    RecipientType ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    PRIMARY KEY (DonorType, RecipientType)
) ENGINE=InnoDB;

-- Indexes and view
CREATE INDEX idx_comp_facility_status ON BLOOD_COMPONENT(FacilityID, Status);
CREATE INDEX idx_comp_expiry          ON BLOOD_COMPONENT(ExpiryDate);
CREATE INDEX idx_req_status_priority  ON BLOOD_REQUEST(Status, Priority, RequestTime);
CREATE INDEX idx_donation_donor_date  ON DONATION(RedThreadID, DonationDate);

-- View showing each component with its blood type and location
CREATE VIEW v_inventory AS
SELECT bc.ComponentID, bc.Type, d.BloodType, bc.ExpiryDate, bc.Status,
       f.FacilityID, f.Location, bc.DonationID
FROM BLOOD_COMPONENT bc
JOIN DONATION dn ON bc.DonationID = dn.DonationID
JOIN DONOR d     ON dn.RedThreadID = d.RedThreadID
JOIN FACILITY f  ON bc.FacilityID = f.FacilityID;

-- Insert data

-- Donor data
INSERT INTO DONOR (RedThreadID, Name, BloodType, KarmaPoints, EligibilityStatus) VALUES
('D001', 'Aarav Sharma',  'O+',  120, 'Eligible'),
('D002', 'Riya Verma',    'A+',   90, 'Eligible'),
('D003', 'Kabir Singh',   'B+',   70, 'Eligible'),
('D004', 'Ananya Gupta',  'AB+',  50, 'Not Eligible'),
('D005', 'Arjun Rawat',   'O-',  150, 'Eligible'),
('D006', 'Meera Joshi',   'B-',   60, 'Eligible'),
('D007', 'Rohan Negi',    'A-',   40, 'Eligible'),
('D008', 'Sana Khan',     'AB-',  30, 'Eligible'),
('D009', 'Dev Bisht',     'O+',   80, 'Eligible'),
('D010', 'Priya Nair',    'B+',   55, 'Eligible'),
('D011', 'Vikram Rana',   'O-',   95, 'Eligible'),
('D012', 'Neha Pant',     'A+',   45, 'Eligible'),
('D013', 'Karan Bhatt',   'AB+',  20, 'Eligible'),
('D014', 'Isha Rawat',    'O+',   35, 'Eligible'),
('D015', 'Harsh Thapa',   'A-',   25, 'Not Eligible');

-- Facility data
INSERT INTO FACILITY (FacilityID, Type, Location, ReportsTo) VALUES
('F001', 'Blood Bank', 'Dehradun', NULL),
('F004', 'Blood Bank', 'Haldwani', NULL);

INSERT INTO FACILITY (FacilityID, Type, Location, ReportsTo) VALUES
('F002', 'Hospital', 'Haridwar',  'F001'),
('F003', 'Hospital', 'Rishikesh', 'F001'),
('F005', 'Hospital', 'Nainital',  'F004'),
('F006', 'Hospital', 'Roorkee',   'F001'),
('F007', 'Hospital', 'Kashipur',  'F004');

-- Patient data
INSERT INTO PATIENT (PatientID, BloodType) VALUES
('P001', 'O+'),
('P002', 'A+'),
('P003', 'B+'),
('P004', 'O-'),
('P005', 'AB+'),
('P006', 'A-'),
('P007', 'O+'),
('P008', 'B-');

-- Donation data
INSERT INTO DONATION (DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID) VALUES
('DN001', 'D001', '2026-09-01', 450, 'F001'),
('DN002', 'D002', '2026-09-05', 400, 'F002'),
('DN003', 'D003', '2026-09-10', 450, 'F001'),
('DN004', 'D005', '2026-09-15', 500, 'F004'),
('DN005', 'D006', '2026-09-20', 450, 'F003'),
('DN006', 'D007', '2026-09-25', 450, 'F001'),
('DN007', 'D008', '2026-09-28', 400, 'F004'),
('DN008', 'D009', '2026-10-01', 450, 'F001'),
('DN009', 'D001', '2026-07-05', 450, 'F001'),
('DN010', 'D010', '2026-10-02', 450, 'F001'),
('DN011', 'D011', '2026-10-03', 500, 'F004'),
('DN012', 'D012', '2026-10-04', 400, 'F002'),
('DN013', 'D013', '2026-10-05', 450, 'F004'),
('DN014', 'D014', '2026-10-06', 450, 'F001'),
('DN015', 'D005', '2026-06-10', 450, 'F004');

-- Blood component data
INSERT INTO BLOOD_COMPONENT (ComponentID, DonationID, Type, ExpiryDate, Status, FacilityID, PatientID) VALUES
('BC001', 'DN001', 'RBC',       '2026-10-13', 'Available',  'F001', NULL),   -- expires soon
('BC002', 'DN001', 'Plasma',    '2027-09-01', 'Available',  'F001', NULL),
('BC003', 'DN002', 'RBC',       '2026-10-17', 'Transfused', 'F002', 'P002'),
('BC004', 'DN003', 'Platelets', '2026-09-15', 'Available',  'F001', NULL),   -- already expired but still marked Available
('BC005', 'DN004', 'RBC',       '2026-10-27', 'In Transit', 'F004', NULL),
('BC006', 'DN005', 'Plasma',    '2027-09-20', 'Transfused', 'F003', 'P001'),
('BC007', 'DN003', 'RBC',       '2026-10-22', 'Available',  'F001', NULL),
('BC008', 'DN006', 'RBC',       '2026-11-06', 'Available',  'F001', NULL),
('BC009', 'DN006', 'Platelets', '2026-10-14', 'Available',  'F001', NULL),   -- expires soon
('BC010', 'DN007', 'RBC',       '2026-11-09', 'Available',  'F004', NULL),
('BC011', 'DN008', 'RBC',       '2026-11-12', 'Available',  'F001', NULL),
('BC012', 'DN008', 'Plasma',    '2027-10-01', 'Available',  'F001', NULL),
('BC013', 'DN004', 'Plasma',    '2027-09-15', 'Available',  'F004', NULL),
('BC014', 'DN002', 'Plasma',    '2027-09-05', 'Reserved',   'F002', NULL),
('BC015', 'DN005', 'RBC',       '2026-11-01', 'Available',  'F003', NULL),
('BC016', 'DN009', 'RBC',       '2026-08-16', 'Expired',    'F001', NULL),
('BC017', 'DN015', 'RBC',       '2026-07-22', 'Expired',    'F004', NULL),
('BC018', 'DN010', 'RBC',       '2026-11-13', 'Available',  'F001', NULL),
('BC019', 'DN010', 'Plasma',    '2027-10-02', 'Available',  'F001', NULL),
('BC020', 'DN011', 'RBC',       '2026-11-14', 'Available',  'F004', NULL),
('BC021', 'DN011', 'Platelets', '2026-10-12', 'Available',  'F004', NULL),   -- expires soon
('BC022', 'DN012', 'RBC',       '2026-11-15', 'Available',  'F002', NULL),
('BC023', 'DN012', 'Plasma',    '2027-10-04', 'Available',  'F002', NULL),
('BC024', 'DN013', 'RBC',       '2026-11-16', 'Available',  'F004', NULL),
('BC025', 'DN014', 'RBC',       '2026-11-17', 'Available',  'F001', NULL),
('BC026', 'DN014', 'Platelets', '2026-10-13', 'Available',  'F001', NULL),   -- expires soon
('BC027', 'DN011', 'Plasma',    '2027-10-03', 'Available',  'F004', NULL),
('BC028', 'DN013', 'Plasma',    '2027-10-05', 'Available',  'F004', NULL);

-- Blood compatibility data
INSERT INTO BLOOD_COMPATIBILITY (DonorType, RecipientType) VALUES
('O-','O-'),('O-','O+'),('O-','A-'),('O-','A+'),('O-','B-'),('O-','B+'),('O-','AB-'),('O-','AB+'),
('O+','O+'),('O+','A+'),('O+','B+'),('O+','AB+'),
('A-','A-'),('A-','A+'),('A-','AB-'),('A-','AB+'),
('A+','A+'),('A+','AB+'),
('B-','B-'),('B-','B+'),('B-','AB-'),('B-','AB+'),
('B+','B+'),('B+','AB+'),
('AB-','AB-'),('AB-','AB+'),
('AB+','AB+');

-- Blood request data
INSERT INTO BLOOD_REQUEST (RequestID, PatientID, FacilityID, ComponentType, BloodType, Quantity, Priority, Status, RequestTime) VALUES
('R001', 'P003', 'F003', 'RBC',       'B+',  1, 'Emergency', 'Pending',   '2026-10-10 09:00:00'),
('R002', 'P002', 'F002', 'RBC',       'A+',  2, 'Routine',   'Pending',   '2026-10-10 08:30:00'),
('R003', 'P004', 'F001', 'RBC',       'O-',  1, 'Urgent',    'Pending',   '2026-10-10 08:45:00'),
('R004', 'P005', 'F005', 'Platelets', 'AB+', 1, 'Urgent',    'Pending',   '2026-10-10 09:15:00'),
('R005', 'P001', 'F003', 'Plasma',    'O+',  1, 'Routine',   'Fulfilled', '2026-10-01 10:00:00'),
('R006', 'P002', 'F002', 'RBC',       'A+',  1, 'Urgent',    'Fulfilled', '2026-10-06 11:00:00'),
('R007', 'P002', 'F002', 'Plasma',    'A+',  1, 'Routine',   'Allocated', '2026-10-09 14:00:00'),
('R008', 'P006', 'F002', 'RBC',       'A-',  1, 'Emergency', 'Pending',   '2026-10-10 09:30:00'),
('R009', 'P007', 'F006', 'RBC',       'O+',  2, 'Urgent',    'Pending',   '2026-10-10 09:20:00'),
('R010', 'P008', 'F007', 'Platelets', 'B-',  1, 'Routine',   'Pending',   '2026-10-10 09:40:00'),   -- no matching stock
('R011', 'P003', 'F003', 'Plasma',    'B+',  1, 'Routine',   'Pending',   '2026-10-10 09:45:00');

-- Allocation data
INSERT INTO ALLOCATION (AllocationID, RequestID, ComponentID) VALUES
('AL001', 'R005', 'BC006'),
('AL002', 'R006', 'BC003'),
('AL003', 'R007', 'BC014');

-- Transfer data
INSERT INTO TRANSFER (TransferID, ComponentID, FromFacility, ToFacility, Status) VALUES
('T001', 'BC005', 'F001', 'F004', 'In Transit');

-- Alert data
INSERT INTO ALERT (FacilityID, ComponentID, AlertType, Message) VALUES
('F001', 'BC001', 'Expiry',   'RBC unit BC001 expires on 2026-10-13'),
('F004', 'BC005', 'Transfer', 'RBC unit BC005 is in transit to Haldwani');

-- Trigger for donations
-- Blocks donors who are not eligible and donations less than 56 days apart
DELIMITER $$

CREATE TRIGGER trg_donation_rules
BEFORE INSERT ON DONATION
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_last   DATE;

    SELECT EligibilityStatus INTO v_status
    FROM DONOR WHERE RedThreadID = NEW.RedThreadID;

    IF v_status IS NULL OR v_status <> 'Eligible' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Donor is not eligible to donate';
    END IF;

    SELECT MAX(DonationDate) INTO v_last
    FROM DONATION WHERE RedThreadID = NEW.RedThreadID;

    IF v_last IS NOT NULL AND ABS(DATEDIFF(NEW.DonationDate, v_last)) < 56 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Donor must wait at least 56 days between donations';
    END IF;
END$$

DELIMITER ;

-- Expiry and low stock alerts
-- Marks expired units, then adds alerts for units expiring in 7 days
-- and for blood types with fewer than 2 units left at a facility
DELIMITER $$

CREATE PROCEDURE check_alerts()
BEGIN
    -- mark expired units
    UPDATE BLOOD_COMPONENT
    SET Status = 'Expired'
    WHERE Status = 'Available' AND ExpiryDate < CURDATE();

    -- expiring soon
    INSERT INTO ALERT (FacilityID, ComponentID, AlertType, Message)
    SELECT bc.FacilityID, bc.ComponentID, 'Expiry',
           CONCAT(bc.Type, ' unit ', bc.ComponentID, ' expires on ', bc.ExpiryDate)
    FROM BLOOD_COMPONENT bc
    WHERE bc.Status = 'Available'
      AND bc.ExpiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      AND NOT EXISTS (SELECT 1 FROM ALERT a
                      WHERE a.ComponentID = bc.ComponentID AND a.AlertType = 'Expiry');

    -- low stock
    INSERT INTO ALERT (FacilityID, AlertType, Message)
    SELECT t.FacilityID, 'LowStock', t.msg
    FROM (
        SELECT FacilityID,
               CONCAT('Low stock: only ', COUNT(*), ' ', BloodType, ' ', Type, ' unit(s) left') AS msg
        FROM v_inventory
        WHERE Status = 'Available' AND ExpiryDate >= CURDATE()
        GROUP BY FacilityID, BloodType, Type
        HAVING COUNT(*) < 2
    ) t
    WHERE NOT EXISTS (SELECT 1 FROM ALERT a
                      WHERE a.FacilityID = t.FacilityID AND a.Message = t.msg AND a.IsRead = FALSE);
END$$

-- Allocation with locking
-- Gives a pending request its blood units inside one transaction.
-- FOR UPDATE locks the chosen rows so two requests cannot take the same unit.
-- If anything fails (no stock, deadlock), everything is rolled back.
CREATE PROCEDURE allocate_request(IN p_request_id VARCHAR(20))
BEGIN
    DECLARE v_type      VARCHAR(20);
    DECLARE v_blood     VARCHAR(5);
    DECLARE v_qty       INT;
    DECLARE v_status    VARCHAR(20);
    DECLARE v_component VARCHAR(20);
    DECLARE v_count     INT DEFAULT 0;

    -- on any error, undo everything and pass the error on
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- lock the request row
    SELECT ComponentType, BloodType, Quantity, Status
    INTO v_type, v_blood, v_qty, v_status
    FROM BLOOD_REQUEST
    WHERE RequestID = p_request_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request not found';
    END IF;

    IF v_status <> 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request is not pending';
    END IF;

    -- pick one unit at a time
    WHILE v_count < v_qty DO
        SET v_component = NULL;

        -- exact blood type first, then compatible RBC, oldest expiry first
        SELECT bc.ComponentID INTO v_component
        FROM BLOOD_COMPONENT bc
        JOIN DONATION dn ON bc.DonationID = dn.DonationID
        JOIN DONOR d     ON dn.RedThreadID = d.RedThreadID
        WHERE bc.Type = v_type
          AND bc.Status = 'Available'
          AND bc.ExpiryDate >= CURDATE()
          AND (d.BloodType = v_blood
               OR (v_type = 'RBC' AND EXISTS (SELECT 1 FROM BLOOD_COMPATIBILITY c
                                              WHERE c.DonorType = d.BloodType
                                                AND c.RecipientType = v_blood)))
        ORDER BY (d.BloodType = v_blood) DESC, bc.ExpiryDate
        LIMIT 1
        FOR UPDATE;

        IF v_component IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough matching stock';
        END IF;

        UPDATE BLOOD_COMPONENT SET Status = 'Reserved' WHERE ComponentID = v_component;

        INSERT INTO ALLOCATION (AllocationID, RequestID, ComponentID)
        VALUES (CONCAT('AL', SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10)), p_request_id, v_component);

        SET v_count = v_count + 1;
    END WHILE;

    UPDATE BLOOD_REQUEST SET Status = 'Allocated' WHERE RequestID = p_request_id;

    COMMIT;
END$$

DELIMITER ;

-- Check tables
SHOW TABLES;
SELECT * FROM DONOR;
SELECT * FROM BLOOD_COMPONENT;


--check scheduling and allocation 
SELECT RequestID, Priority, RequestTime, Status
FROM BLOOD_REQUEST
WHERE Status = 'Pending'
ORDER BY FIELD(Priority, 'Critical', 'Emergency', 'Urgent', 'Routine'),
         RequestTime,
         RequestID;
         
         SELECT br.RequestID, br.Priority, br.Status,
       a.ComponentID, a.AllocatedAt,
       d.RedThreadID, d.KarmaPoints, bc.ExpiryDate
FROM ALLOCATION a
JOIN BLOOD_REQUEST br ON br.RequestID = a.RequestID
JOIN BLOOD_COMPONENT bc ON bc.ComponentID = a.ComponentID
JOIN DONATION dn ON dn.DonationID = bc.DonationID
JOIN DONOR d ON d.RedThreadID = dn.RedThreadID
ORDER BY a.AllocatedAt DESC
LIMIT 10;

USE osdbms;

SHOW TABLES;

DESCRIBE blood_request;

--check triggers
SHOW TRIGGERS FROM osdbms;

SELECT RedThreadID, Name, EligibilityStatus
FROM DONOR;

SELECT RedThreadID, DonationDate
FROM DONATION
ORDER BY RedThreadID, DonationDate;

DESCRIBE DONATION;

SELECT FacilityID
FROM FACILITY;

SELECT *
FROM DONATION
WHERE DonationID IN ('DN_TEST01', 'DN_TEST02');

SELECT DonationID FROM DONATION;

USE osdbms;

INSERT INTO DONATION
    (DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID)
VALUES
    ('DN_TEST01', 'D001', '2026-09-20', 450, 'F001');

INSERT INTO DONATION
    (DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID)
VALUES
    ('DN_TEST02', 'D005', '2026-11-10', 450, 'F001');
    
SELECT *
FROM DONATION
WHERE DonationID IN ('DN_TEST01', 'DN_TEST02');

DELETE FROM DONATION
WHERE DonationID = 'DN_TEST02';

