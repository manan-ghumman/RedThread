USE sql12839033;

-- Clean reset (safe to run on a fresh or partially populated schema)
DROP PROCEDURE IF EXISTS allocate_request;
DROP PROCEDURE IF EXISTS create_blood_request;
DROP PROCEDURE IF EXISTS check_alerts;
DROP TRIGGER IF EXISTS trg_donation_rules;

DROP VIEW IF EXISTS v_request_history;
DROP VIEW IF EXISTS v_pending_requests;
DROP VIEW IF EXISTS v_inventory;

DROP TABLE IF EXISTS ALERT;
DROP TABLE IF EXISTS TRANSFER;
DROP TABLE IF EXISTS ALLOCATION;
DROP TABLE IF EXISTS BLOOD_REQUEST;
DROP TABLE IF EXISTS BLOOD_REQUEST_ID_COUNTER;
DROP TABLE IF EXISTS BLOOD_COMPONENT;
DROP TABLE IF EXISTS DONATION;
DROP TABLE IF EXISTS BLOOD_COMPATIBILITY;
DROP TABLE IF EXISTS PATIENT;
DROP TABLE IF EXISTS DONOR;
DROP TABLE IF EXISTS PERSON;
DROP TABLE IF EXISTS FACILITY;

-- 1. Schema Definition

CREATE TABLE FACILITY (
  FacilityID VARCHAR(20) PRIMARY KEY,
  FacilityName VARCHAR(120) NOT NULL,
  Type ENUM('Blood Bank','Hospital') NOT NULL,
  FacilityLevel ENUM('Central','State','City','Hospital') NOT NULL,
  StateName VARCHAR(80) NOT NULL,
  Location VARCHAR(100) NOT NULL,
  ReportsTo VARCHAR(20) NULL,
  FOREIGN KEY (ReportsTo) REFERENCES FACILITY(FacilityID)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE PERSON (
  RedThreadID VARCHAR(20) PRIMARY KEY,
  Name VARCHAR(100) NULL,
  BloodType ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE DONOR (
  RedThreadID VARCHAR(20) PRIMARY KEY,
  KarmaPoints INT NOT NULL DEFAULT 0 CHECK (KarmaPoints >= 0),
  EligibilityStatus ENUM('Eligible','Not Eligible') NOT NULL,
  FOREIGN KEY (RedThreadID) REFERENCES PERSON(RedThreadID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE PATIENT (
  RedThreadID VARCHAR(20) PRIMARY KEY,
  FOREIGN KEY (RedThreadID) REFERENCES PERSON(RedThreadID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE DONATION (
  DonationID VARCHAR(20) PRIMARY KEY,
  RedThreadID VARCHAR(20) NOT NULL,
  DonationDate DATE NOT NULL,
  Volume_mL INT NOT NULL CHECK (Volume_mL BETWEEN 200 AND 600),
  FacilityID VARCHAR(20) NOT NULL,
  FOREIGN KEY (RedThreadID) REFERENCES DONOR(RedThreadID) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (FacilityID) REFERENCES FACILITY(FacilityID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE BLOOD_COMPONENT (
  ComponentID VARCHAR(20) PRIMARY KEY,
  DonationID VARCHAR(20) NOT NULL,
  Type ENUM('RBC','Plasma','Platelets') NOT NULL,
  ExpiryDate DATE NOT NULL,
  Status ENUM('Available','Reserved','In Transit','Transfused','Expired') NOT NULL,
  FacilityID VARCHAR(20) NOT NULL,
  RecipientRedThreadID VARCHAR(20) NULL,
  FOREIGN KEY (DonationID) REFERENCES DONATION(DonationID) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (FacilityID) REFERENCES FACILITY(FacilityID) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (RecipientRedThreadID) REFERENCES PATIENT(RedThreadID) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE BLOOD_REQUEST (
  RequestID VARCHAR(20) PRIMARY KEY,
  RedThreadID VARCHAR(20) NOT NULL,
  FacilityID VARCHAR(20) NOT NULL,
  ComponentType ENUM('RBC','Plasma','Platelets') NOT NULL,
  BloodType ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  Quantity INT NOT NULL CHECK (Quantity > 0),
  Priority ENUM('Emergency','Urgent','Routine') NOT NULL,
  Status ENUM('Pending','Allocated','Fulfilled','Rejected') NOT NULL DEFAULT 'Pending',
  RequestTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (RedThreadID) REFERENCES PATIENT(RedThreadID) ON UPDATE CASCADE,
  FOREIGN KEY (FacilityID) REFERENCES FACILITY(FacilityID) ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ALLOCATION (
  AllocationID VARCHAR(20) PRIMARY KEY,
  RequestID VARCHAR(20) NOT NULL,
  ComponentID VARCHAR(20) NOT NULL UNIQUE,
  AllocatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (RequestID) REFERENCES BLOOD_REQUEST(RequestID) ON UPDATE CASCADE,
  FOREIGN KEY (ComponentID) REFERENCES BLOOD_COMPONENT(ComponentID) ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE TRANSFER (
  TransferID VARCHAR(20) PRIMARY KEY,
  ComponentID VARCHAR(20) NOT NULL,
  FromFacility VARCHAR(20) NOT NULL,
  ToFacility VARCHAR(20) NOT NULL,
  Status ENUM('Initiated','In Transit','Completed','Cancelled') NOT NULL,
  InitiatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CompletedAt TIMESTAMP NULL,
  FOREIGN KEY (ComponentID) REFERENCES BLOOD_COMPONENT(ComponentID) ON UPDATE CASCADE,
  FOREIGN KEY (FromFacility) REFERENCES FACILITY(FacilityID) ON UPDATE CASCADE,
  FOREIGN KEY (ToFacility) REFERENCES FACILITY(FacilityID) ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ALERT (
  AlertID INT AUTO_INCREMENT PRIMARY KEY,
  FacilityID VARCHAR(20) NOT NULL,
  ComponentID VARCHAR(20) NULL,
  AlertType ENUM('Expiry','LowStock','Transfer') NOT NULL,
  Message VARCHAR(255) NOT NULL,
  CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsRead BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (FacilityID) REFERENCES FACILITY(FacilityID) ON UPDATE CASCADE,
  FOREIGN KEY (ComponentID) REFERENCES BLOOD_COMPONENT(ComponentID) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE BLOOD_COMPATIBILITY (
  DonorType ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  RecipientType ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  PRIMARY KEY (DonorType, RecipientType)
) ENGINE=InnoDB;

CREATE TABLE BLOOD_REQUEST_ID_COUNTER (
  CounterID TINYINT NOT NULL PRIMARY KEY,
  LastValue BIGINT UNSIGNED NOT NULL
) ENGINE=InnoDB;

INSERT INTO BLOOD_REQUEST_ID_COUNTER (CounterID, LastValue) VALUES (1, 0);

-- 2. Seed Data

INSERT INTO FACILITY (FacilityID, FacilityName, Type, FacilityLevel, StateName, Location, ReportsTo) VALUES
  ('F001', 'RedThread Central Blood Bank', 'Blood Bank', 'Central', 'Delhi', 'New Delhi', NULL),
  ('F002', 'Uttarakhand State Blood Bank', 'Blood Bank', 'State', 'Uttarakhand', 'Dehradun', 'F001'),
  ('F003', 'Uttar Pradesh State Blood Bank', 'Blood Bank', 'State', 'Uttar Pradesh', 'Lucknow', 'F001'),
  ('F004', 'Himachal Pradesh State Blood Bank', 'Blood Bank', 'State', 'Himachal Pradesh', 'Shimla', 'F001'),
  ('F005', 'Dehradun City Blood Bank', 'Blood Bank', 'City', 'Uttarakhand', 'Dehradun', 'F002'),
  ('F006', 'Haldwani City Blood Bank', 'Blood Bank', 'City', 'Uttarakhand', 'Haldwani', 'F002'),
  ('F007', 'Haridwar City Blood Bank', 'Blood Bank', 'City', 'Uttarakhand', 'Haridwar', 'F002'),
  ('F008', 'Rishikesh City Blood Bank', 'Blood Bank', 'City', 'Uttarakhand', 'Rishikesh', 'F002'),
  ('F009', 'Lucknow City Blood Bank', 'Blood Bank', 'City', 'Uttar Pradesh', 'Lucknow', 'F003'),
  ('F010', 'Noida City Blood Bank', 'Blood Bank', 'City', 'Uttar Pradesh', 'Noida', 'F003'),
  ('F011', 'Shimla City Blood Bank', 'Blood Bank', 'City', 'Himachal Pradesh', 'Shimla', 'F004'),
  ('F012', 'Solan City Blood Bank', 'Blood Bank', 'City', 'Himachal Pradesh', 'Solan', 'F004'),
  ('F013', 'Doon General Hospital', 'Hospital', 'Hospital', 'Uttarakhand', 'Dehradun', 'F005'),
  ('F014', 'Dehradun Medical Centre', 'Hospital', 'Hospital', 'Uttarakhand', 'Dehradun', 'F005'),
  ('F015', 'Haldwani District Hospital', 'Hospital', 'Hospital', 'Uttarakhand', 'Haldwani', 'F006'),
  ('F016', 'Haridwar Civil Hospital', 'Hospital', 'Hospital', 'Uttarakhand', 'Haridwar', 'F007'),
  ('F017', 'Rishikesh Community Hospital', 'Hospital', 'Hospital', 'Uttarakhand', 'Rishikesh', 'F008'),
  ('F018', 'Lucknow General Hospital', 'Hospital', 'Hospital', 'Uttar Pradesh', 'Lucknow', 'F009'),
  ('F019', 'Noida District Hospital', 'Hospital', 'Hospital', 'Uttar Pradesh', 'Noida', 'F010'),
  ('F020', 'Shimla Regional Hospital', 'Hospital', 'Hospital', 'Himachal Pradesh', 'Shimla', 'F011'),
  ('F021', 'Solan Community Hospital', 'Hospital', 'Hospital', 'Himachal Pradesh', 'Solan', 'F012');

INSERT INTO PERSON (RedThreadID, Name, BloodType) VALUES
  ('RT0001', 'Ananya Pant', 'O-'),
  ('RT0002', 'Deepika Das', 'A+'),
  ('RT0003', 'Harsh Agarwal', 'AB+'),
  ('RT0004', 'Krishna Joshi', 'AB+'),
  ('RT0005', 'Neeraj Chauhan', 'O+'),
  ('RT0006', 'Pranav Bhandari', 'A-'),
  ('RT0007', 'Riya Jain', 'B-'),
  ('RT0008', 'Shreya Rana', 'AB+'),
  ('RT0009', 'Vaibhav Malik', 'O-'),
  ('RT0010', 'Aarav Sethi', 'A+'),
  ('RT0011', 'Ananya Rawat', 'O-'),
  ('RT0012', 'Deepika Mehta', 'AB+'),
  ('RT0013', 'Harsh Kumar', 'O-'),
  ('RT0014', 'Krishna Arora', 'B+'),
  ('RT0015', 'Neeraj Nair', 'O-'),
  ('RT0016', 'Pranav Pandey', 'B-'),
  ('RT0017', 'Riya Pillai', 'O+'),
  ('RT0018', 'Shreya Gupta', 'A-'),
  ('RT0019', 'Vaibhav Kapoor', 'O-'),
  ('RT0020', 'Aarav Patel', 'O-'),
  ('RT0021', 'Ananya Dutta', 'AB-'),
  ('RT0022', 'Deepika Bisht', 'AB-'),
  ('RT0023', 'Harsh Yadav', 'B+'),
  ('RT0024', 'Krishna Bose', 'O+'),
  ('RT0025', 'Neeraj Singh', 'B+'),
  ('RT0026', 'Pranav Thapa', 'B+'),
  ('RT0027', 'Riya Iyer', 'A+'),
  ('RT0028', 'Shreya Goyal', 'AB-'),
  ('RT0029', 'Vaibhav Khan', 'B+'),
  ('RT0030', 'Aarav Mishra', 'A+'),
  ('RT0031', 'Ananya Saini', 'O-'),
  ('RT0032', 'Deepika Verma', 'A-'),
  ('RT0033', 'Harsh Bhatt', 'AB+'),
  ('RT0034', 'Krishna Reddy', 'AB-'),
  ('RT0035', 'Neeraj Tripathi', 'B-'),
  ('RT0036', 'Pranav Negi', 'B-'),
  ('RT0037', 'Riya Saxena', 'B-'),
  ('RT0038', 'Shreya Tiwari', 'B-'),
  ('RT0039', 'Vaibhav Sharma', 'A-'),
  ('RT0040', 'Aarav Pant', 'B-'),
  ('RT0041', 'Ananya Das', 'B-'),
  ('RT0042', 'Deepika Agarwal', 'O-'),
  ('RT0043', 'Harsh Joshi', 'O+'),
  ('RT0044', 'Krishna Chauhan', 'O-'),
  ('RT0045', 'Neeraj Bhandari', 'AB+'),
  ('RT0046', 'Pranav Jain', 'AB+'),
  ('RT0047', 'Riya Rana', 'AB+'),
  ('RT0048', 'Shreya Malik', 'O+'),
  ('RT0049', 'Vaibhav Sethi', 'AB+'),
  ('RT0050', 'Aarav Rawat', 'O-'),
  ('RT0051', 'Ananya Mehta', 'B+'),
  ('RT0052', 'Deepika Kumar', 'O-'),
  ('RT0053', 'Harsh Arora', 'AB-'),
  ('RT0054', 'Krishna Nair', 'AB-'),
  ('RT0055', 'Neeraj Pandey', 'O+'),
  ('RT0056', 'Pranav Pillai', 'O-'),
  ('RT0057', 'Riya Gupta', 'O-'),
  ('RT0058', 'Shreya Kapoor', 'B+'),
  ('RT0059', 'Vaibhav Patel', 'A+'),
  ('RT0060', 'Aarav Dutta', 'B+'),
  ('RT0061', 'Ananya Bisht', 'O+'),
  ('RT0062', 'Deepika Yadav', 'AB+'),
  ('RT0063', 'Harsh Bose', 'AB-'),
  ('RT0064', 'Krishna Singh', 'A+'),
  ('RT0065', 'Neeraj Thapa', 'AB+'),
  ('RT0066', 'Pranav Iyer', 'A+'),
  ('RT0067', 'Riya Goyal', 'B-'),
  ('RT0068', 'Shreya Khan', 'B-'),
  ('RT0069', 'Vaibhav Mishra', 'O+'),
  ('RT0070', 'Aarav Saini', 'O-'),
  ('RT0071', 'Ananya Verma', 'A-'),
  ('RT0072', 'Deepika Bhatt', 'O-'),
  ('RT0073', 'Harsh Reddy', 'AB+'),
  ('RT0074', 'Krishna Tripathi', 'O-'),
  ('RT0075', 'Neeraj Negi', 'B-'),
  ('RT0076', 'Pranav Saxena', 'AB-'),
  ('RT0077', 'Riya Tiwari', 'AB-'),
  ('RT0078', 'Shreya Sharma', 'B+'),
  ('RT0079', 'Vaibhav Pant', 'O-'),
  ('RT0080', 'Aarav Das', 'A-'),
  ('RT0081', 'Ananya Agarwal', 'AB-'),
  ('RT0082', 'Deepika Joshi', 'AB+'),
  ('RT0083', 'Harsh Chauhan', 'A+'),
  ('RT0084', 'Krishna Bhandari', 'A+'),
  ('RT0085', 'Neeraj Jain', 'AB+'),
  ('RT0086', 'Pranav Rana', 'O+'),
  ('RT0087', 'Riya Malik', 'O+'),
  ('RT0088', 'Shreya Sethi', 'A+'),
  ('RT0089', 'Vaibhav Rawat', 'AB+'),
  ('RT0090', 'Aarav Mehta', 'B-'),
  ('RT0091', 'Ananya Kumar', 'O+'),
  ('RT0092', 'Deepika Arora', 'A+'),
  ('RT0093', 'Harsh Nair', 'B-'),
  ('RT0094', 'Krishna Pandey', 'B+'),
  ('RT0095', 'Neeraj Pillai', 'A-'),
  ('RT0096', 'Pranav Gupta', 'AB+'),
  ('RT0097', 'Riya Kapoor', 'AB-'),
  ('RT0098', 'Shreya Patel', 'O-'),
  ('RT0099', 'Vaibhav Dutta', 'B+'),
  ('RT0100', 'Aarav Bisht', 'AB+'),
  ('RT0101', NULL, 'A+'),
  ('RT0102', NULL, 'AB-'),
  ('RT0103', NULL, 'A-'),
  ('RT0104', NULL, 'AB-'),
  ('RT0105', NULL, 'B-'),
  ('RT0106', NULL, 'B+'),
  ('RT0107', NULL, 'AB+'),
  ('RT0108', NULL, 'O+'),
  ('RT0109', NULL, 'B-'),
  ('RT0110', NULL, 'A+'),
  ('RT0111', NULL, 'A+'),
  ('RT0112', NULL, 'A+'),
  ('RT0113', NULL, 'AB-'),
  ('RT0114', NULL, 'O-'),
  ('RT0115', NULL, 'B-'),
  ('RT0116', NULL, 'AB+'),
  ('RT0117', NULL, 'O+'),
  ('RT0118', NULL, 'B+'),
  ('RT0119', NULL, 'B+'),
  ('RT0120', NULL, 'A+'),
  ('RT0121', NULL, 'A-'),
  ('RT0122', NULL, 'B+'),
  ('RT0123', NULL, 'AB-'),
  ('RT0124', NULL, 'O-'),
  ('RT0125', NULL, 'B-'),
  ('RT0126', NULL, 'A+'),
  ('RT0127', NULL, 'A-'),
  ('RT0128', NULL, 'A-'),
  ('RT0129', NULL, 'O+'),
  ('RT0130', NULL, 'AB+'),
  ('RT0131', NULL, 'A+'),
  ('RT0132', NULL, 'A+'),
  ('RT0133', NULL, 'B+'),
  ('RT0134', NULL, 'A+'),
  ('RT0135', NULL, 'AB+'),
  ('RT0136', NULL, 'O-'),
  ('RT0137', NULL, 'B-'),
  ('RT0138', NULL, 'A+'),
  ('RT0139', NULL, 'A+'),
  ('RT0140', NULL, 'A-'),
  ('RT0141', NULL, 'O-'),
  ('RT0142', NULL, 'B+'),
  ('RT0143', NULL, 'A+'),
  ('RT0144', NULL, 'B+'),
  ('RT0145', NULL, 'A-'),
  ('RT0146', NULL, 'AB-'),
  ('RT0147', NULL, 'B-'),
  ('RT0148', NULL, 'AB-'),
  ('RT0149', NULL, 'O+'),
  ('RT0150', NULL, 'O+'),
  ('RT0151', NULL, 'A+'),
  ('RT0152', NULL, 'O+'),
  ('RT0153', NULL, 'O+'),
  ('RT0154', NULL, 'AB+'),
  ('RT0155', NULL, 'O-'),
  ('RT0156', NULL, 'A+'),
  ('RT0157', NULL, 'B-'),
  ('RT0158', NULL, 'O+'),
  ('RT0159', NULL, 'A+'),
  ('RT0160', NULL, 'A+'),
  ('RT0161', NULL, 'AB+'),
  ('RT0162', NULL, 'AB+'),
  ('RT0163', NULL, 'A-'),
  ('RT0164', NULL, 'A+'),
  ('RT0165', NULL, 'O-'),
  ('RT0166', NULL, 'B+'),
  ('RT0167', NULL, 'B+'),
  ('RT0168', NULL, 'O-'),
  ('RT0169', NULL, 'B-'),
  ('RT0170', NULL, 'O+'),
  ('RT0171', NULL, 'O-'),
  ('RT0172', NULL, 'B+'),
  ('RT0173', NULL, 'AB+'),
  ('RT0174', NULL, 'AB-'),
  ('RT0175', NULL, 'O+'),
  ('RT0176', NULL, 'O+'),
  ('RT0177', NULL, 'O+'),
  ('RT0178', NULL, 'AB+'),
  ('RT0179', NULL, 'O+'),
  ('RT0180', NULL, 'B+'),
  ('RT0181', NULL, 'B+'),
  ('RT0182', NULL, 'O-'),
  ('RT0183', NULL, 'AB+'),
  ('RT0184', NULL, 'B+'),
  ('RT0185', NULL, 'O+'),
  ('RT0186', NULL, 'A-'),
  ('RT0187', NULL, 'O-'),
  ('RT0188', NULL, 'B-'),
  ('RT0189', NULL, 'A-'),
  ('RT0190', NULL, 'A-'),
  ('RT0191', NULL, 'A-'),
  ('RT0192', NULL, 'B-'),
  ('RT0193', NULL, 'A-'),
  ('RT0194', NULL, 'AB+'),
  ('RT0195', NULL, 'AB-'),
  ('RT0196', NULL, 'AB+'),
  ('RT0197', NULL, 'AB+'),
  ('RT0198', NULL, 'B-'),
  ('RT0199', NULL, 'O-'),
  ('RT0200', NULL, 'AB+');

INSERT INTO DONOR (RedThreadID, KarmaPoints, EligibilityStatus) VALUES
  ('RT0001', 123, 'Eligible'),
  ('RT0002', 116, 'Eligible'),
  ('RT0003', 40, 'Eligible'),
  ('RT0004', 243, 'Eligible'),
  ('RT0005', 222, 'Eligible'),
  ('RT0006', 229, 'Eligible'),
  ('RT0007', 60, 'Eligible'),
  ('RT0008', 186, 'Eligible'),
  ('RT0009', 146, 'Eligible'),
  ('RT0010', 84, 'Eligible'),
  ('RT0011', 70, 'Eligible'),
  ('RT0012', 11, 'Eligible'),
  ('RT0013', 241, 'Eligible'),
  ('RT0014', 38, 'Eligible'),
  ('RT0015', 170, 'Eligible'),
  ('RT0016', 223, 'Eligible'),
  ('RT0017', 158, 'Eligible'),
  ('RT0018', 93, 'Eligible'),
  ('RT0019', 111, 'Not Eligible'),
  ('RT0020', 111, 'Eligible'),
  ('RT0021', 112, 'Eligible'),
  ('RT0022', 64, 'Eligible'),
  ('RT0023', 156, 'Eligible'),
  ('RT0024', 114, 'Eligible'),
  ('RT0025', 157, 'Eligible'),
  ('RT0026', 63, 'Eligible'),
  ('RT0027', 201, 'Eligible'),
  ('RT0028', 96, 'Eligible'),
  ('RT0029', 216, 'Eligible'),
  ('RT0030', 77, 'Eligible'),
  ('RT0031', 225, 'Eligible'),
  ('RT0032', 80, 'Eligible'),
  ('RT0033', 84, 'Eligible'),
  ('RT0034', 169, 'Eligible'),
  ('RT0035', 222, 'Eligible'),
  ('RT0036', 24, 'Eligible'),
  ('RT0037', 90, 'Eligible'),
  ('RT0038', 93, 'Not Eligible'),
  ('RT0039', 90, 'Eligible'),
  ('RT0040', 190, 'Eligible'),
  ('RT0041', 93, 'Eligible'),
  ('RT0042', 61, 'Eligible'),
  ('RT0043', 100, 'Eligible'),
  ('RT0044', 136, 'Eligible'),
  ('RT0045', 192, 'Eligible'),
  ('RT0046', 166, 'Eligible'),
  ('RT0047', 212, 'Eligible'),
  ('RT0048', 19, 'Eligible'),
  ('RT0049', 200, 'Eligible'),
  ('RT0050', 65, 'Eligible'),
  ('RT0051', 139, 'Eligible'),
  ('RT0052', 14, 'Eligible'),
  ('RT0053', 19, 'Eligible'),
  ('RT0054', 160, 'Eligible'),
  ('RT0055', 39, 'Eligible'),
  ('RT0056', 247, 'Eligible'),
  ('RT0057', 173, 'Not Eligible'),
  ('RT0058', 108, 'Eligible'),
  ('RT0059', 240, 'Eligible'),
  ('RT0060', 31, 'Eligible'),
  ('RT0061', 118, 'Eligible'),
  ('RT0062', 141, 'Eligible'),
  ('RT0063', 55, 'Eligible'),
  ('RT0064', 216, 'Eligible'),
  ('RT0065', 210, 'Eligible'),
  ('RT0066', 123, 'Eligible'),
  ('RT0067', 63, 'Eligible'),
  ('RT0068', 93, 'Eligible'),
  ('RT0069', 79, 'Eligible'),
  ('RT0070', 131, 'Eligible'),
  ('RT0071', 156, 'Eligible'),
  ('RT0072', 4, 'Eligible'),
  ('RT0073', 71, 'Eligible'),
  ('RT0074', 238, 'Eligible'),
  ('RT0075', 54, 'Eligible'),
  ('RT0076', 62, 'Not Eligible'),
  ('RT0077', 11, 'Eligible'),
  ('RT0078', 222, 'Eligible'),
  ('RT0079', 38, 'Eligible'),
  ('RT0080', 106, 'Eligible'),
  ('RT0081', 18, 'Eligible'),
  ('RT0082', 162, 'Eligible'),
  ('RT0083', 101, 'Eligible'),
  ('RT0084', 5, 'Eligible'),
  ('RT0085', 100, 'Eligible'),
  ('RT0086', 208, 'Eligible'),
  ('RT0087', 216, 'Eligible'),
  ('RT0088', 167, 'Eligible'),
  ('RT0089', 28, 'Eligible'),
  ('RT0090', 127, 'Eligible'),
  ('RT0091', 139, 'Eligible'),
  ('RT0092', 39, 'Eligible'),
  ('RT0093', 82, 'Eligible'),
  ('RT0094', 208, 'Eligible'),
  ('RT0095', 176, 'Not Eligible'),
  ('RT0096', 148, 'Eligible'),
  ('RT0097', 175, 'Eligible'),
  ('RT0098', 56, 'Eligible'),
  ('RT0099', 57, 'Eligible'),
  ('RT0100', 203, 'Eligible');

INSERT INTO PATIENT (RedThreadID) VALUES
  ('RT0101'), ('RT0102'), ('RT0103'), ('RT0104'), ('RT0105'),
  ('RT0106'), ('RT0107'), ('RT0108'), ('RT0109'), ('RT0110'),
  ('RT0111'), ('RT0112'), ('RT0113'), ('RT0114'), ('RT0115'),
  ('RT0116'), ('RT0117'), ('RT0118'), ('RT0119'), ('RT0120'),
  ('RT0121'), ('RT0122'), ('RT0123'), ('RT0124'), ('RT0125'),
  ('RT0126'), ('RT0127'), ('RT0128'), ('RT0129'), ('RT0130'),
  ('RT0131'), ('RT0132'), ('RT0133'), ('RT0134'), ('RT0135'),
  ('RT0136'), ('RT0137'), ('RT0138'), ('RT0139'), ('RT0140'),
  ('RT0141'), ('RT0142'), ('RT0143'), ('RT0144'), ('RT0145'),
  ('RT0146'), ('RT0147'), ('RT0148'), ('RT0149'), ('RT0150'),
  ('RT0151'), ('RT0152'), ('RT0153'), ('RT0154'), ('RT0155'),
  ('RT0156'), ('RT0157'), ('RT0158'), ('RT0159'), ('RT0160'),
  ('RT0161'), ('RT0162'), ('RT0163'), ('RT0164'), ('RT0165'),
  ('RT0166'), ('RT0167'), ('RT0168'), ('RT0169'), ('RT0170'),
  ('RT0171'), ('RT0172'), ('RT0173'), ('RT0174'), ('RT0175'),
  ('RT0176'), ('RT0177'), ('RT0178'), ('RT0179'), ('RT0180'),
  ('RT0181'), ('RT0182'), ('RT0183'), ('RT0184'), ('RT0185'),
  ('RT0186'), ('RT0187'), ('RT0188'), ('RT0189'), ('RT0190'),
  ('RT0191'), ('RT0192'), ('RT0193'), ('RT0194'), ('RT0195'),
  ('RT0196'), ('RT0197'), ('RT0198'), ('RT0199'), ('RT0200');

INSERT INTO BLOOD_COMPATIBILITY (DonorType, RecipientType) VALUES
  ('O-', 'O-'), ('O-', 'O+'), ('O-', 'A-'), ('O-', 'A+'),
  ('O-', 'B-'), ('O-', 'B+'), ('O-', 'AB-'), ('O-', 'AB+'),
  ('O+', 'O+'), ('O+', 'A+'), ('O+', 'B+'), ('O+', 'AB+'),
  ('A-', 'A-'), ('A-', 'A+'), ('A-', 'AB-'), ('A-', 'AB+'),
  ('A+', 'A+'), ('A+', 'AB+'),
  ('B-', 'B-'), ('B-', 'B+'), ('B-', 'AB-'), ('B-', 'AB+'),
  ('B+', 'B+'), ('B+', 'AB+'),
  ('AB-', 'AB-'), ('AB-', 'AB+'),
  ('AB+', 'AB+');

INSERT INTO DONATION (DonationID, RedThreadID, DonationDate, Volume_mL, FacilityID) VALUES
  ('DN0001', 'RT0001', '2026-08-02', 450, 'F005'),
  ('DN0002', 'RT0002', '2026-08-03', 350, 'F006'),
  ('DN0003', 'RT0003', '2026-08-04', 350, 'F007'),
  ('DN0004', 'RT0004', '2026-08-05', 500, 'F008'),
  ('DN0005', 'RT0005', '2026-08-06', 450, 'F013'),
  ('DN0006', 'RT0006', '2026-08-07', 500, 'F014'),
  ('DN0007', 'RT0007', '2026-08-08', 350, 'F015'),
  ('DN0008', 'RT0008', '2026-08-09', 500, 'F016'),
  ('DN0009', 'RT0009', '2026-08-10', 450, 'F017'),
  ('DN0010', 'RT0010', '2026-08-11', 450, 'F005'),
  ('DN0011', 'RT0011', '2026-08-12', 500, 'F006'),
  ('DN0012', 'RT0012', '2026-08-13', 450, 'F007'),
  ('DN0013', 'RT0013', '2026-08-14', 400, 'F008'),
  ('DN0014', 'RT0014', '2026-08-15', 450, 'F013'),
  ('DN0015', 'RT0015', '2026-08-16', 450, 'F014'),
  ('DN0016', 'RT0016', '2026-08-17', 400, 'F015'),
  ('DN0017', 'RT0017', '2026-08-18', 550, 'F016'),
  ('DN0018', 'RT0018', '2026-08-19', 400, 'F017'),
  ('DN0019', 'RT0019', '2026-08-20', 450, 'F005'),
  ('DN0020', 'RT0020', '2026-08-21', 550, 'F006'),
  ('DN0021', 'RT0021', '2026-08-22', 450, 'F007'),
  ('DN0022', 'RT0022', '2026-08-23', 350, 'F008'),
  ('DN0023', 'RT0023', '2026-08-24', 550, 'F013'),
  ('DN0024', 'RT0024', '2026-08-25', 350, 'F014'),
  ('DN0025', 'RT0025', '2026-08-26', 550, 'F015'),
  ('DN0026', 'RT0026', '2026-08-27', 500, 'F016'),
  ('DN0027', 'RT0027', '2026-08-28', 350, 'F017'),
  ('DN0028', 'RT0028', '2026-08-29', 400, 'F005'),
  ('DN0029', 'RT0029', '2026-08-30', 450, 'F006'),
  ('DN0030', 'RT0030', '2026-08-31', 350, 'F007'),
  ('DN0031', 'RT0031', '2026-09-01', 500, 'F008'),
  ('DN0032', 'RT0032', '2026-09-02', 350, 'F013'),
  ('DN0033', 'RT0033', '2026-09-03', 550, 'F014'),
  ('DN0034', 'RT0034', '2026-09-04', 550, 'F015'),
  ('DN0035', 'RT0035', '2026-09-05', 350, 'F016'),
  ('DN0036', 'RT0036', '2026-09-06', 450, 'F017'),
  ('DN0037', 'RT0037', '2026-09-07', 350, 'F005'),
  ('DN0038', 'RT0038', '2026-09-08', 450, 'F006'),
  ('DN0039', 'RT0039', '2026-09-09', 350, 'F007'),
  ('DN0040', 'RT0040', '2026-09-10', 500, 'F008'),
  ('DN0041', 'RT0041', '2026-09-11', 350, 'F013'),
  ('DN0042', 'RT0042', '2026-09-12', 400, 'F014'),
  ('DN0043', 'RT0043', '2026-09-13', 400, 'F015'),
  ('DN0044', 'RT0044', '2026-09-14', 450, 'F016'),
  ('DN0045', 'RT0045', '2026-09-15', 500, 'F017'),
  ('DN0046', 'RT0046', '2026-09-16', 350, 'F005'),
  ('DN0047', 'RT0047', '2026-09-17', 400, 'F006'),
  ('DN0048', 'RT0048', '2026-09-18', 450, 'F007'),
  ('DN0049', 'RT0049', '2026-09-19', 500, 'F008'),
  ('DN0050', 'RT0050', '2026-09-20', 500, 'F013'),
  ('DN0051', 'RT0051', '2026-09-21', 450, 'F014'),
  ('DN0052', 'RT0052', '2026-09-22', 350, 'F015'),
  ('DN0053', 'RT0053', '2026-09-23', 400, 'F016'),
  ('DN0054', 'RT0054', '2026-09-24', 400, 'F017'),
  ('DN0055', 'RT0055', '2026-09-25', 450, 'F005'),
  ('DN0056', 'RT0056', '2026-09-26', 400, 'F006'),
  ('DN0057', 'RT0057', '2026-09-27', 500, 'F007'),
  ('DN0058', 'RT0058', '2026-09-28', 400, 'F008'),
  ('DN0059', 'RT0059', '2026-09-29', 400, 'F013'),
  ('DN0060', 'RT0060', '2026-08-01', 400, 'F014'),
  ('DN0061', 'RT0061', '2026-08-02', 350, 'F015'),
  ('DN0062', 'RT0062', '2026-08-03', 500, 'F016'),
  ('DN0063', 'RT0063', '2026-08-04', 350, 'F017'),
  ('DN0064', 'RT0064', '2026-08-05', 350, 'F005'),
  ('DN0065', 'RT0065', '2026-08-06', 400, 'F006'),
  ('DN0066', 'RT0066', '2026-08-07', 350, 'F007'),
  ('DN0067', 'RT0067', '2026-08-08', 400, 'F008'),
  ('DN0068', 'RT0068', '2026-08-09', 500, 'F013'),
  ('DN0069', 'RT0069', '2026-08-10', 350, 'F014'),
  ('DN0070', 'RT0070', '2026-08-11', 550, 'F015'),
  ('DN0071', 'RT0071', '2026-08-12', 400, 'F016'),
  ('DN0072', 'RT0072', '2026-08-13', 500, 'F017'),
  ('DN0073', 'RT0073', '2026-08-14', 350, 'F005'),
  ('DN0074', 'RT0074', '2026-08-15', 350, 'F006'),
  ('DN0075', 'RT0075', '2026-08-16', 350, 'F007'),
  ('DN0076', 'RT0076', '2026-08-17', 450, 'F008'),
  ('DN0077', 'RT0077', '2026-08-18', 550, 'F013'),
  ('DN0078', 'RT0078', '2026-08-19', 350, 'F014'),
  ('DN0079', 'RT0079', '2026-08-20', 550, 'F015'),
  ('DN0080', 'RT0080', '2026-08-21', 500, 'F016'),
  ('DN0081', 'RT0081', '2026-08-22', 350, 'F017'),
  ('DN0082', 'RT0082', '2026-08-23', 400, 'F005'),
  ('DN0083', 'RT0083', '2026-08-24', 400, 'F006'),
  ('DN0084', 'RT0084', '2026-08-25', 500, 'F007'),
  ('DN0085', 'RT0085', '2026-08-26', 550, 'F008'),
  ('DN0086', 'RT0086', '2026-08-27', 350, 'F013'),
  ('DN0087', 'RT0087', '2026-08-28', 350, 'F014'),
  ('DN0088', 'RT0088', '2026-08-29', 350, 'F015'),
  ('DN0089', 'RT0089', '2026-08-30', 450, 'F016'),
  ('DN0090', 'RT0090', '2026-08-31', 550, 'F017'),
  ('DN0091', 'RT0091', '2026-09-01', 550, 'F005'),
  ('DN0092', 'RT0092', '2026-09-02', 500, 'F006'),
  ('DN0093', 'RT0093', '2026-09-03', 450, 'F007'),
  ('DN0094', 'RT0094', '2026-09-04', 500, 'F008'),
  ('DN0095', 'RT0095', '2026-09-05', 350, 'F013'),
  ('DN0096', 'RT0096', '2026-09-06', 350, 'F014'),
  ('DN0097', 'RT0097', '2026-09-07', 350, 'F015'),
  ('DN0098', 'RT0098', '2026-09-08', 550, 'F016'),
  ('DN0099', 'RT0099', '2026-09-09', 350, 'F017'),
  ('DN0100', 'RT0100', '2026-09-10', 550, 'F005'),
  ('DN0101', 'RT0001', '2026-09-11', 450, 'F006'),
  ('DN0102', 'RT0002', '2026-09-12', 350, 'F007'),
  ('DN0103', 'RT0003', '2026-09-13', 550, 'F008'),
  ('DN0104', 'RT0004', '2026-09-14', 550, 'F013'),
  ('DN0105', 'RT0005', '2026-09-15', 450, 'F014'),
  ('DN0106', 'RT0006', '2026-09-16', 500, 'F015'),
  ('DN0107', 'RT0007', '2026-09-17', 400, 'F016'),
  ('DN0108', 'RT0008', '2026-09-18', 550, 'F017'),
  ('DN0109', 'RT0009', '2026-09-19', 400, 'F005'),
  ('DN0110', 'RT0010', '2026-09-20', 550, 'F006'),
  ('DN0111', 'RT0011', '2026-09-21', 400, 'F007'),
  ('DN0112', 'RT0012', '2026-09-22', 500, 'F008'),
  ('DN0113', 'RT0013', '2026-09-23', 350, 'F013'),
  ('DN0114', 'RT0014', '2026-09-24', 350, 'F014'),
  ('DN0115', 'RT0015', '2026-09-25', 450, 'F015'),
  ('DN0116', 'RT0016', '2026-09-26', 500, 'F016'),
  ('DN0117', 'RT0017', '2026-09-27', 550, 'F017'),
  ('DN0118', 'RT0018', '2026-09-28', 400, 'F005'),
  ('DN0119', 'RT0019', '2026-09-29', 450, 'F006'),
  ('DN0120', 'RT0020', '2026-08-01', 550, 'F007'),
  ('DN0121', 'RT0021', '2026-08-02', 500, 'F008'),
  ('DN0122', 'RT0022', '2026-08-03', 550, 'F013'),
  ('DN0123', 'RT0023', '2026-08-04', 550, 'F014'),
  ('DN0124', 'RT0024', '2026-08-05', 350, 'F015'),
  ('DN0125', 'RT0025', '2026-08-06', 550, 'F016'),
  ('DN0126', 'RT0026', '2026-08-07', 400, 'F017'),
  ('DN0127', 'RT0027', '2026-08-08', 350, 'F005'),
  ('DN0128', 'RT0028', '2026-08-09', 550, 'F006'),
  ('DN0129', 'RT0029', '2026-08-10', 350, 'F007'),
  ('DN0130', 'RT0030', '2026-08-11', 450, 'F008'),
  ('DN0131', 'RT0031', '2026-08-12', 450, 'F013'),
  ('DN0132', 'RT0032', '2026-08-13', 450, 'F014'),
  ('DN0133', 'RT0033', '2026-08-14', 450, 'F015'),
  ('DN0134', 'RT0034', '2026-08-15', 400, 'F016'),
  ('DN0135', 'RT0035', '2026-08-16', 500, 'F017'),
  ('DN0136', 'RT0036', '2026-08-17', 550, 'F005'),
  ('DN0137', 'RT0037', '2026-08-18', 500, 'F006'),
  ('DN0138', 'RT0038', '2026-08-19', 500, 'F007'),
  ('DN0139', 'RT0039', '2026-08-20', 350, 'F008'),
  ('DN0140', 'RT0040', '2026-08-21', 500, 'F013'),
  ('DN0141', 'RT0041', '2026-08-22', 350, 'F014'),
  ('DN0142', 'RT0042', '2026-08-23', 500, 'F015'),
  ('DN0143', 'RT0043', '2026-08-24', 350, 'F016'),
  ('DN0144', 'RT0044', '2026-08-25', 500, 'F017'),
  ('DN0145', 'RT0045', '2026-08-26', 450, 'F005'),
  ('DN0146', 'RT0046', '2026-08-27', 450, 'F006'),
  ('DN0147', 'RT0047', '2026-08-28', 500, 'F007'),
  ('DN0148', 'RT0048', '2026-08-29', 350, 'F008'),
  ('DN0149', 'RT0049', '2026-08-30', 400, 'F013'),
  ('DN0150', 'RT0050', '2026-08-31', 550, 'F014');

INSERT INTO BLOOD_COMPONENT (ComponentID, DonationID, Type, ExpiryDate, Status, FacilityID, RecipientRedThreadID) VALUES
  ('BC0001', 'DN0001', 'RBC', '2026-09-13', 'Expired', 'F005', NULL),
  ('BC0002', 'DN0001', 'Plasma', '2027-08-02', 'Available', 'F006', NULL),
  ('BC0003', 'DN0002', 'Platelets', '2026-08-08', 'Expired', 'F015', NULL),
  ('BC0004', 'DN0002', 'RBC', '2026-09-14', 'Expired', 'F008', NULL),
  ('BC0005', 'DN0003', 'Plasma', '2027-08-04', 'Available', 'F009', NULL),
  ('BC0006', 'DN0003', 'Platelets', '2026-08-09', 'Expired', 'F018', NULL),
  ('BC0007', 'DN0004', 'RBC', '2026-09-16', 'Expired', 'F011', NULL),
  ('BC0008', 'DN0004', 'Plasma', '2027-08-05', 'Available', 'F012', NULL),
  ('BC0009', 'DN0005', 'Platelets', '2026-08-11', 'Expired', 'F021', NULL),
  ('BC0010', 'DN0005', 'RBC', '2026-09-17', 'Expired', 'F006', NULL),
  ('BC0011', 'DN0006', 'Plasma', '2027-08-07', 'Available', 'F007', NULL),
  ('BC0012', 'DN0006', 'Platelets', '2026-08-12', 'Expired', 'F015', NULL),
  ('BC0013', 'DN0007', 'RBC', '2026-09-19', 'Expired', 'F009', NULL),
  ('BC0014', 'DN0007', 'Plasma', '2027-08-08', 'In Transit', 'F010', NULL),
  ('BC0015', 'DN0008', 'Platelets', '2026-08-14', 'Expired', 'F018', NULL),
  ('BC0016', 'DN0008', 'RBC', '2026-09-20', 'Expired', 'F012', NULL),
  ('BC0017', 'DN0009', 'Plasma', '2027-08-10', 'Available', 'F005', NULL),
  ('BC0018', 'DN0009', 'Platelets', '2026-08-15', 'Expired', 'F021', NULL),
  ('BC0019', 'DN0010', 'RBC', '2026-09-22', 'Expired', 'F007', NULL),
  ('BC0020', 'DN0010', 'Plasma', '2027-08-11', 'Available', 'F008', NULL),
  ('BC0021', 'DN0011', 'Platelets', '2026-08-17', 'Expired', 'F015', NULL),
  ('BC0022', 'DN0011', 'RBC', '2026-09-23', 'Expired', 'F010', NULL),
  ('BC0023', 'DN0012', 'Plasma', '2027-08-13', 'Available', 'F011', NULL),
  ('BC0024', 'DN0012', 'Platelets', '2026-08-18', 'Expired', 'F018', NULL),
  ('BC0025', 'DN0013', 'RBC', '2026-09-25', 'Expired', 'F005', NULL),
  ('BC0026', 'DN0013', 'Plasma', '2027-08-14', 'Available', 'F006', NULL),
  ('BC0027', 'DN0014', 'Platelets', '2026-08-20', 'Expired', 'F021', NULL),
  ('BC0028', 'DN0014', 'RBC', '2026-09-26', 'Expired', 'F008', NULL),
  ('BC0029', 'DN0015', 'Plasma', '2027-08-16', 'Available', 'F009', NULL),
  ('BC0030', 'DN0015', 'Platelets', '2026-08-21', 'Expired', 'F015', NULL),
  ('BC0031', 'DN0016', 'RBC', '2026-09-28', 'Expired', 'F011', NULL),
  ('BC0032', 'DN0016', 'Plasma', '2027-08-17', 'Available', 'F012', NULL),
  ('BC0033', 'DN0017', 'Platelets', '2026-08-23', 'Expired', 'F018', NULL),
  ('BC0034', 'DN0017', 'RBC', '2026-09-29', 'Expired', 'F006', NULL),
  ('BC0035', 'DN0018', 'Plasma', '2027-08-19', 'In Transit', 'F007', NULL),
  ('BC0036', 'DN0018', 'Platelets', '2026-08-24', 'Expired', 'F021', NULL),
  ('BC0037', 'DN0019', 'RBC', '2026-10-01', 'Expired', 'F009', NULL),
  ('BC0038', 'DN0019', 'Plasma', '2027-08-20', 'Available', 'F010', NULL),
  ('BC0039', 'DN0020', 'Platelets', '2026-08-26', 'Expired', 'F015', NULL),
  ('BC0040', 'DN0020', 'RBC', '2026-10-02', 'Expired', 'F012', NULL),
  ('BC0041', 'DN0021', 'Plasma', '2027-08-22', 'Available', 'F005', NULL),
  ('BC0042', 'DN0021', 'Platelets', '2026-08-27', 'Expired', 'F018', NULL),
  ('BC0043', 'DN0022', 'RBC', '2026-10-04', 'Expired', 'F007', NULL),
  ('BC0044', 'DN0022', 'Plasma', '2027-08-23', 'Available', 'F008', NULL),
  ('BC0045', 'DN0023', 'Platelets', '2026-08-29', 'Expired', 'F021', NULL),
  ('BC0046', 'DN0023', 'RBC', '2026-10-05', 'Expired', 'F010', NULL),
  ('BC0047', 'DN0024', 'Plasma', '2027-08-25', 'Reserved', 'F011', NULL),
  ('BC0048', 'DN0024', 'Platelets', '2026-08-30', 'Expired', 'F015', NULL),
  ('BC0049', 'DN0025', 'RBC', '2026-10-07', 'Expired', 'F005', NULL),
  ('BC0050', 'DN0025', 'Plasma', '2027-08-26', 'Available', 'F006', NULL),
  ('BC0051', 'DN0026', 'Platelets', '2026-09-01', 'Expired', 'F018', NULL),
  ('BC0052', 'DN0026', 'RBC', '2026-10-08', 'Expired', 'F008', NULL),
  ('BC0053', 'DN0027', 'Plasma', '2027-08-28', 'Reserved', 'F009', NULL),
  ('BC0054', 'DN0027', 'Platelets', '2026-09-02', 'Expired', 'F021', NULL),
  ('BC0055', 'DN0028', 'RBC', '2026-10-10', 'Expired', 'F011', NULL),
  ('BC0056', 'DN0028', 'Plasma', '2027-08-29', 'In Transit', 'F012', NULL),
  ('BC0057', 'DN0029', 'Platelets', '2026-09-04', 'Expired', 'F015', NULL),
  ('BC0058', 'DN0029', 'RBC', '2026-10-11', 'Expired', 'F006', NULL),
  ('BC0059', 'DN0030', 'Plasma', '2027-08-31', 'In Transit', 'F007', NULL),
  ('BC0060', 'DN0030', 'Platelets', '2026-09-05', 'Expired', 'F018', NULL),
  ('BC0061', 'DN0031', 'RBC', '2026-10-13', 'Expired', 'F009', NULL),
  ('BC0062', 'DN0031', 'Plasma', '2027-09-01', 'Available', 'F010', NULL),
  ('BC0063', 'DN0032', 'Platelets', '2026-09-07', 'Expired', 'F021', NULL),
  ('BC0064', 'DN0032', 'RBC', '2026-10-14', 'Available', 'F012', NULL),
  ('BC0065', 'DN0033', 'Plasma', '2027-09-03', 'In Transit', 'F005', NULL),
  ('BC0066', 'DN0033', 'Platelets', '2026-09-08', 'Expired', 'F015', NULL),
  ('BC0067', 'DN0034', 'RBC', '2026-10-16', 'Available', 'F007', NULL),
  ('BC0068', 'DN0034', 'Plasma', '2027-09-04', 'Available', 'F008', NULL),
  ('BC0069', 'DN0035', 'Platelets', '2026-09-10', 'Expired', 'F018', NULL),
  ('BC0070', 'DN0035', 'RBC', '2026-10-17', 'Available', 'F010', NULL),
  ('BC0071', 'DN0036', 'Plasma', '2027-09-06', 'Available', 'F011', NULL),
  ('BC0072', 'DN0036', 'Platelets', '2026-09-11', 'Expired', 'F021', NULL),
  ('BC0073', 'DN0037', 'RBC', '2026-10-19', 'Reserved', 'F005', NULL),
  ('BC0074', 'DN0037', 'Plasma', '2027-09-07', 'Available', 'F006', NULL),
  ('BC0075', 'DN0038', 'Platelets', '2026-09-13', 'Expired', 'F015', NULL),
  ('BC0076', 'DN0038', 'RBC', '2026-10-20', 'In Transit', 'F008', NULL),
  ('BC0077', 'DN0039', 'Plasma', '2027-09-09', 'Available', 'F009', NULL),
  ('BC0078', 'DN0039', 'Platelets', '2026-09-14', 'Expired', 'F018', NULL),
  ('BC0079', 'DN0040', 'RBC', '2026-10-22', 'Reserved', 'F011', NULL),
  ('BC0080', 'DN0040', 'Plasma', '2027-09-10', 'Available', 'F012', NULL),
  ('BC0081', 'DN0041', 'Platelets', '2026-09-16', 'Expired', 'F021', NULL),
  ('BC0082', 'DN0041', 'RBC', '2026-10-23', 'Reserved', 'F006', NULL),
  ('BC0083', 'DN0042', 'Plasma', '2027-09-12', 'Available', 'F007', NULL),
  ('BC0084', 'DN0042', 'Platelets', '2026-09-17', 'Expired', 'F015', NULL),
  ('BC0085', 'DN0043', 'RBC', '2026-10-25', 'Available', 'F009', NULL),
  ('BC0086', 'DN0043', 'Plasma', '2027-09-13', 'Reserved', 'F010', NULL),
  ('BC0087', 'DN0044', 'Platelets', '2026-09-19', 'Expired', 'F018', NULL),
  ('BC0088', 'DN0044', 'RBC', '2026-10-26', 'Available', 'F012', NULL),
  ('BC0089', 'DN0045', 'Plasma', '2027-09-15', 'In Transit', 'F005', NULL),
  ('BC0090', 'DN0045', 'Platelets', '2026-09-20', 'Expired', 'F021', NULL),
  ('BC0091', 'DN0046', 'RBC', '2026-10-28', 'Reserved', 'F007', NULL),
  ('BC0092', 'DN0046', 'Plasma', '2027-09-16', 'Available', 'F008', NULL),
  ('BC0093', 'DN0047', 'Platelets', '2026-09-22', 'Expired', 'F015', NULL),
  ('BC0094', 'DN0047', 'RBC', '2026-10-29', 'Available', 'F010', NULL),
  ('BC0095', 'DN0048', 'Plasma', '2027-09-18', 'Available', 'F011', NULL),
  ('BC0096', 'DN0048', 'Platelets', '2026-09-23', 'Expired', 'F018', NULL),
  ('BC0097', 'DN0049', 'RBC', '2026-10-31', 'Available', 'F005', NULL),
  ('BC0098', 'DN0049', 'Plasma', '2027-09-19', 'Available', 'F006', NULL),
  ('BC0099', 'DN0050', 'Platelets', '2026-09-25', 'Expired', 'F021', NULL),
  ('BC0100', 'DN0050', 'RBC', '2026-11-01', 'Reserved', 'F008', NULL),
  ('BC0101', 'DN0051', 'Plasma', '2027-09-21', 'Reserved', 'F009', NULL),
  ('BC0102', 'DN0051', 'Platelets', '2026-09-26', 'Expired', 'F015', NULL),
  ('BC0103', 'DN0052', 'RBC', '2026-11-03', 'Available', 'F011', NULL),
  ('BC0104', 'DN0052', 'Plasma', '2027-09-22', 'Reserved', 'F012', NULL),
  ('BC0105', 'DN0053', 'Platelets', '2026-09-28', 'Expired', 'F018', NULL),
  ('BC0106', 'DN0053', 'RBC', '2026-11-04', 'Available', 'F006', NULL),
  ('BC0107', 'DN0054', 'Plasma', '2027-09-24', 'Available', 'F007', NULL),
  ('BC0108', 'DN0054', 'Platelets', '2026-09-29', 'Expired', 'F021', NULL),
  ('BC0109', 'DN0055', 'RBC', '2026-11-06', 'Available', 'F009', NULL),
  ('BC0110', 'DN0055', 'Plasma', '2027-09-25', 'Available', 'F010', NULL),
  ('BC0111', 'DN0056', 'Platelets', '2026-10-01', 'Expired', 'F015', NULL),
  ('BC0112', 'DN0056', 'RBC', '2026-11-07', 'Available', 'F012', NULL),
  ('BC0113', 'DN0057', 'Plasma', '2027-09-27', 'Available', 'F005', NULL),
  ('BC0114', 'DN0057', 'Platelets', '2026-10-02', 'Expired', 'F018', NULL),
  ('BC0115', 'DN0058', 'RBC', '2026-11-09', 'Available', 'F007', NULL),
  ('BC0116', 'DN0058', 'Plasma', '2027-09-28', 'Available', 'F008', NULL),
  ('BC0117', 'DN0059', 'Platelets', '2026-10-04', 'Expired', 'F021', NULL),
  ('BC0118', 'DN0059', 'RBC', '2026-11-10', 'In Transit', 'F010', NULL),
  ('BC0119', 'DN0060', 'Plasma', '2027-08-01', 'In Transit', 'F011', NULL),
  ('BC0120', 'DN0060', 'Platelets', '2026-08-06', 'Expired', 'F015', NULL),
  ('BC0121', 'DN0061', 'RBC', '2026-09-13', 'Expired', 'F005', NULL),
  ('BC0122', 'DN0061', 'Plasma', '2027-08-02', 'Available', 'F006', NULL),
  ('BC0123', 'DN0062', 'Platelets', '2026-08-08', 'Expired', 'F018', NULL),
  ('BC0124', 'DN0062', 'RBC', '2026-09-14', 'Expired', 'F008', NULL),
  ('BC0125', 'DN0063', 'Plasma', '2027-08-04', 'Reserved', 'F009', NULL),
  ('BC0126', 'DN0063', 'Platelets', '2026-08-09', 'Expired', 'F021', NULL),
  ('BC0127', 'DN0064', 'RBC', '2026-09-16', 'Expired', 'F011', NULL),
  ('BC0128', 'DN0064', 'Plasma', '2027-08-05', 'Available', 'F012', NULL),
  ('BC0129', 'DN0065', 'Platelets', '2026-08-11', 'Expired', 'F015', NULL),
  ('BC0130', 'DN0065', 'RBC', '2026-09-17', 'Expired', 'F006', NULL),
  ('BC0131', 'DN0066', 'Plasma', '2027-08-07', 'Available', 'F007', NULL),
  ('BC0132', 'DN0066', 'Platelets', '2026-08-12', 'Expired', 'F018', NULL),
  ('BC0133', 'DN0067', 'RBC', '2026-09-19', 'Expired', 'F009', NULL),
  ('BC0134', 'DN0067', 'Plasma', '2027-08-08', 'Available', 'F010', NULL),
  ('BC0135', 'DN0068', 'Platelets', '2026-08-14', 'Expired', 'F021', NULL),
  ('BC0136', 'DN0068', 'RBC', '2026-09-20', 'Expired', 'F012', NULL),
  ('BC0137', 'DN0069', 'Plasma', '2027-08-10', 'Available', 'F005', NULL),
  ('BC0138', 'DN0069', 'Platelets', '2026-08-15', 'Expired', 'F015', NULL),
  ('BC0139', 'DN0070', 'RBC', '2026-09-22', 'Expired', 'F007', NULL),
  ('BC0140', 'DN0070', 'Plasma', '2027-08-11', 'Available', 'F008', NULL),
  ('BC0141', 'DN0071', 'Platelets', '2026-08-17', 'Expired', 'F018', NULL),
  ('BC0142', 'DN0071', 'RBC', '2026-09-23', 'Expired', 'F010', NULL),
  ('BC0143', 'DN0072', 'Plasma', '2027-08-13', 'Transfused', 'F011', 'RT0144'),
  ('BC0144', 'DN0072', 'Platelets', '2026-08-18', 'Expired', 'F021', NULL),
  ('BC0145', 'DN0073', 'RBC', '2026-09-25', 'Expired', 'F005', NULL),
  ('BC0146', 'DN0073', 'Plasma', '2027-08-14', 'Reserved', 'F006', NULL),
  ('BC0147', 'DN0074', 'Platelets', '2026-08-20', 'Expired', 'F015', NULL),
  ('BC0148', 'DN0074', 'RBC', '2026-09-26', 'Expired', 'F008', NULL),
  ('BC0149', 'DN0075', 'Plasma', '2027-08-16', 'Available', 'F009', NULL),
  ('BC0150', 'DN0075', 'Platelets', '2026-08-21', 'Expired', 'F018', NULL),
  ('BC0151', 'DN0076', 'RBC', '2026-09-28', 'Expired', 'F011', NULL),
  ('BC0152', 'DN0076', 'Plasma', '2027-08-17', 'Reserved', 'F012', NULL),
  ('BC0153', 'DN0077', 'Platelets', '2026-08-23', 'Expired', 'F021', NULL),
  ('BC0154', 'DN0077', 'RBC', '2026-09-29', 'Expired', 'F006', NULL),
  ('BC0155', 'DN0078', 'Plasma', '2027-08-19', 'In Transit', 'F007', NULL),
  ('BC0156', 'DN0078', 'Platelets', '2026-08-24', 'Expired', 'F015', NULL),
  ('BC0157', 'DN0079', 'RBC', '2026-10-01', 'Expired', 'F009', NULL),
  ('BC0158', 'DN0079', 'Plasma', '2027-08-20', 'Available', 'F010', NULL),
  ('BC0159', 'DN0080', 'Platelets', '2026-08-26', 'Expired', 'F018', NULL),
  ('BC0160', 'DN0080', 'RBC', '2026-10-02', 'Expired', 'F012', NULL),
  ('BC0161', 'DN0081', 'Plasma', '2027-08-22', 'In Transit', 'F005', NULL),
  ('BC0162', 'DN0081', 'Platelets', '2026-08-27', 'Expired', 'F021', NULL),
  ('BC0163', 'DN0082', 'RBC', '2026-10-04', 'Expired', 'F007', NULL),
  ('BC0164', 'DN0082', 'Plasma', '2027-08-23', 'Available', 'F008', NULL),
  ('BC0165', 'DN0083', 'Platelets', '2026-08-29', 'Expired', 'F015', NULL),
  ('BC0166', 'DN0083', 'RBC', '2026-10-05', 'Expired', 'F010', NULL),
  ('BC0167', 'DN0084', 'Plasma', '2027-08-25', 'Available', 'F011', NULL),
  ('BC0168', 'DN0084', 'Platelets', '2026-08-30', 'Expired', 'F018', NULL),
  ('BC0169', 'DN0085', 'RBC', '2026-10-07', 'Expired', 'F005', NULL),
  ('BC0170', 'DN0085', 'Plasma', '2027-08-26', 'In Transit', 'F006', NULL),
  ('BC0171', 'DN0086', 'Platelets', '2026-09-01', 'Expired', 'F021', NULL),
  ('BC0172', 'DN0086', 'RBC', '2026-10-08', 'Expired', 'F008', NULL),
  ('BC0173', 'DN0087', 'Plasma', '2027-08-28', 'Available', 'F009', NULL),
  ('BC0174', 'DN0087', 'Platelets', '2026-09-02', 'Expired', 'F015', NULL),
  ('BC0175', 'DN0088', 'RBC', '2026-10-10', 'Expired', 'F011', NULL),
  ('BC0176', 'DN0088', 'Plasma', '2027-08-29', 'In Transit', 'F012', NULL),
  ('BC0177', 'DN0089', 'Platelets', '2026-09-04', 'Expired', 'F018', NULL),
  ('BC0178', 'DN0089', 'RBC', '2026-10-11', 'Expired', 'F006', NULL),
  ('BC0179', 'DN0090', 'Plasma', '2027-08-31', 'Available', 'F007', NULL),
  ('BC0180', 'DN0090', 'Platelets', '2026-09-05', 'Expired', 'F021', NULL),
  ('BC0181', 'DN0091', 'RBC', '2026-10-13', 'Expired', 'F009', NULL),
  ('BC0182', 'DN0091', 'Plasma', '2027-09-01', 'Available', 'F010', NULL),
  ('BC0183', 'DN0092', 'Platelets', '2026-09-07', 'Expired', 'F015', NULL),
  ('BC0184', 'DN0092', 'RBC', '2026-10-14', 'In Transit', 'F012', NULL),
  ('BC0185', 'DN0093', 'Plasma', '2027-09-03', 'Reserved', 'F005', NULL),
  ('BC0186', 'DN0093', 'Platelets', '2026-09-08', 'Expired', 'F018', NULL),
  ('BC0187', 'DN0094', 'RBC', '2026-10-16', 'Transfused', 'F007', 'RT0188'),
  ('BC0188', 'DN0094', 'Plasma', '2027-09-04', 'Reserved', 'F008', NULL),
  ('BC0189', 'DN0095', 'Platelets', '2026-09-10', 'Expired', 'F021', NULL),
  ('BC0190', 'DN0095', 'RBC', '2026-10-17', 'Available', 'F010', NULL),
  ('BC0191', 'DN0096', 'Plasma', '2027-09-06', 'Available', 'F011', NULL),
  ('BC0192', 'DN0096', 'Platelets', '2026-09-11', 'Expired', 'F015', NULL),
  ('BC0193', 'DN0097', 'RBC', '2026-10-19', 'In Transit', 'F005', NULL),
  ('BC0194', 'DN0097', 'Plasma', '2027-09-07', 'Available', 'F006', NULL),
  ('BC0195', 'DN0098', 'Platelets', '2026-09-13', 'Expired', 'F018', NULL),
  ('BC0196', 'DN0098', 'RBC', '2026-10-20', 'Reserved', 'F008', NULL),
  ('BC0197', 'DN0099', 'Plasma', '2027-09-09', 'Available', 'F009', NULL),
  ('BC0198', 'DN0099', 'Platelets', '2026-09-14', 'Expired', 'F021', NULL),
  ('BC0199', 'DN0100', 'RBC', '2026-10-22', 'In Transit', 'F011', NULL),
  ('BC0200', 'DN0100', 'Plasma', '2027-09-10', 'Reserved', 'F012', NULL),
  ('BC0201', 'DN0101', 'Platelets', '2026-09-16', 'Expired', 'F015', NULL),
  ('BC0202', 'DN0101', 'RBC', '2026-10-23', 'Available', 'F006', NULL),
  ('BC0203', 'DN0102', 'Plasma', '2027-09-12', 'Available', 'F007', NULL),
  ('BC0204', 'DN0102', 'Platelets', '2026-09-17', 'Expired', 'F018', NULL),
  ('BC0205', 'DN0103', 'RBC', '2026-10-25', 'Available', 'F009', NULL),
  ('BC0206', 'DN0103', 'Plasma', '2027-09-13', 'Reserved', 'F010', NULL),
  ('BC0207', 'DN0104', 'Platelets', '2026-09-19', 'Expired', 'F021', NULL),
  ('BC0208', 'DN0104', 'RBC', '2026-10-26', 'Available', 'F012', NULL),
  ('BC0209', 'DN0105', 'Plasma', '2027-09-15', 'Available', 'F005', NULL),
  ('BC0210', 'DN0105', 'Platelets', '2026-09-20', 'Expired', 'F015', NULL),
  ('BC0211', 'DN0106', 'RBC', '2026-10-28', 'Available', 'F007', NULL),
  ('BC0212', 'DN0106', 'Plasma', '2027-09-16', 'Reserved', 'F008', NULL),
  ('BC0213', 'DN0107', 'Platelets', '2026-09-22', 'Expired', 'F018', NULL),
  ('BC0214', 'DN0107', 'RBC', '2026-10-29', 'Available', 'F010', NULL),
  ('BC0215', 'DN0108', 'Plasma', '2027-09-18', 'Available', 'F011', NULL),
  ('BC0216', 'DN0108', 'Platelets', '2026-09-23', 'Expired', 'F021', NULL),
  ('BC0217', 'DN0109', 'RBC', '2026-10-31', 'Available', 'F005', NULL),
  ('BC0218', 'DN0109', 'Plasma', '2027-09-19', 'Available', 'F006', NULL),
  ('BC0219', 'DN0110', 'Platelets', '2026-09-25', 'Expired', 'F015', NULL),
  ('BC0220', 'DN0110', 'RBC', '2026-11-01', 'Available', 'F008', NULL),
  ('BC0221', 'DN0111', 'Plasma', '2027-09-21', 'Available', 'F009', NULL),
  ('BC0222', 'DN0111', 'Platelets', '2026-09-26', 'Expired', 'F018', NULL),
  ('BC0223', 'DN0112', 'RBC', '2026-11-03', 'Reserved', 'F011', NULL),
  ('BC0224', 'DN0112', 'Plasma', '2027-09-22', 'Available', 'F012', NULL),
  ('BC0225', 'DN0113', 'Platelets', '2026-09-28', 'Expired', 'F021', NULL),
  ('BC0226', 'DN0113', 'RBC', '2026-11-04', 'In Transit', 'F006', NULL),
  ('BC0227', 'DN0114', 'Plasma', '2027-09-24', 'Available', 'F007', NULL),
  ('BC0228', 'DN0114', 'Platelets', '2026-09-29', 'Expired', 'F015', NULL),
  ('BC0229', 'DN0115', 'RBC', '2026-11-06', 'In Transit', 'F009', NULL),
  ('BC0230', 'DN0115', 'Plasma', '2027-09-25', 'Available', 'F010', NULL),
  ('BC0231', 'DN0116', 'Platelets', '2026-10-01', 'Expired', 'F018', NULL),
  ('BC0232', 'DN0116', 'RBC', '2026-11-07', 'Reserved', 'F012', NULL),
  ('BC0233', 'DN0117', 'Plasma', '2027-09-27', 'In Transit', 'F005', NULL),
  ('BC0234', 'DN0117', 'Platelets', '2026-10-02', 'Expired', 'F021', NULL),
  ('BC0235', 'DN0118', 'RBC', '2026-11-09', 'Available', 'F007', NULL),
  ('BC0236', 'DN0118', 'Plasma', '2027-09-28', 'Available', 'F008', NULL),
  ('BC0237', 'DN0119', 'Platelets', '2026-10-04', 'Expired', 'F015', NULL),
  ('BC0238', 'DN0119', 'RBC', '2026-11-10', 'Available', 'F010', NULL),
  ('BC0239', 'DN0120', 'Plasma', '2027-08-01', 'In Transit', 'F011', NULL),
  ('BC0240', 'DN0120', 'Platelets', '2026-08-06', 'Expired', 'F018', NULL),
  ('BC0241', 'DN0121', 'RBC', '2026-09-13', 'Expired', 'F005', NULL),
  ('BC0242', 'DN0121', 'Plasma', '2027-08-02', 'In Transit', 'F006', NULL),
  ('BC0243', 'DN0122', 'Platelets', '2026-08-08', 'Expired', 'F021', NULL),
  ('BC0244', 'DN0122', 'RBC', '2026-09-14', 'Expired', 'F008', NULL),
  ('BC0245', 'DN0123', 'Plasma', '2027-08-04', 'Reserved', 'F009', NULL),
  ('BC0246', 'DN0123', 'Platelets', '2026-08-09', 'Expired', 'F015', NULL),
  ('BC0247', 'DN0124', 'RBC', '2026-09-16', 'Expired', 'F011', NULL),
  ('BC0248', 'DN0124', 'Plasma', '2027-08-05', 'Available', 'F012', NULL),
  ('BC0249', 'DN0125', 'Platelets', '2026-08-11', 'Expired', 'F018', NULL),
  ('BC0250', 'DN0125', 'RBC', '2026-09-17', 'Expired', 'F006', NULL),
  ('BC0251', 'DN0126', 'Plasma', '2027-08-07', 'Available', 'F007', NULL),
  ('BC0252', 'DN0126', 'Platelets', '2026-08-12', 'Expired', 'F021', NULL),
  ('BC0253', 'DN0127', 'RBC', '2026-09-19', 'Expired', 'F009', NULL),
  ('BC0254', 'DN0127', 'Plasma', '2027-08-08', 'In Transit', 'F010', NULL),
  ('BC0255', 'DN0128', 'Platelets', '2026-08-14', 'Expired', 'F015', NULL),
  ('BC0256', 'DN0128', 'RBC', '2026-09-20', 'Expired', 'F012', NULL),
  ('BC0257', 'DN0129', 'Plasma', '2027-08-10', 'Reserved', 'F005', NULL),
  ('BC0258', 'DN0129', 'Platelets', '2026-08-15', 'Expired', 'F018', NULL),
  ('BC0259', 'DN0130', 'RBC', '2026-09-22', 'Expired', 'F007', NULL),
  ('BC0260', 'DN0130', 'Plasma', '2027-08-11', 'Available', 'F008', NULL),
  ('BC0261', 'DN0131', 'Platelets', '2026-08-17', 'Expired', 'F021', NULL),
  ('BC0262', 'DN0131', 'RBC', '2026-09-23', 'Expired', 'F010', NULL),
  ('BC0263', 'DN0132', 'Plasma', '2027-08-13', 'In Transit', 'F011', NULL),
  ('BC0264', 'DN0132', 'Platelets', '2026-08-18', 'Expired', 'F015', NULL),
  ('BC0265', 'DN0133', 'RBC', '2026-09-25', 'Expired', 'F005', NULL),
  ('BC0266', 'DN0133', 'Plasma', '2027-08-14', 'Reserved', 'F006', NULL),
  ('BC0267', 'DN0134', 'Platelets', '2026-08-20', 'Expired', 'F018', NULL),
  ('BC0268', 'DN0134', 'RBC', '2026-09-26', 'Expired', 'F008', NULL),
  ('BC0269', 'DN0135', 'Plasma', '2027-08-16', 'Reserved', 'F009', NULL),
  ('BC0270', 'DN0135', 'Platelets', '2026-08-21', 'Expired', 'F021', NULL),
  ('BC0271', 'DN0136', 'RBC', '2026-09-28', 'Expired', 'F011', NULL),
  ('BC0272', 'DN0136', 'Plasma', '2027-08-17', 'Available', 'F012', NULL),
  ('BC0273', 'DN0137', 'Platelets', '2026-08-23', 'Expired', 'F015', NULL),
  ('BC0274', 'DN0137', 'RBC', '2026-09-29', 'Expired', 'F006', NULL),
  ('BC0275', 'DN0138', 'Plasma', '2027-08-19', 'In Transit', 'F007', NULL),
  ('BC0276', 'DN0138', 'Platelets', '2026-08-24', 'Expired', 'F018', NULL),
  ('BC0277', 'DN0139', 'RBC', '2026-10-01', 'Expired', 'F009', NULL),
  ('BC0278', 'DN0139', 'Plasma', '2027-08-20', 'Available', 'F010', NULL),
  ('BC0279', 'DN0140', 'Platelets', '2026-08-26', 'Expired', 'F021', NULL),
  ('BC0280', 'DN0140', 'RBC', '2026-10-02', 'Expired', 'F012', NULL),
  ('BC0281', 'DN0141', 'Plasma', '2027-08-22', 'In Transit', 'F005', NULL),
  ('BC0282', 'DN0141', 'Platelets', '2026-08-27', 'Expired', 'F015', NULL),
  ('BC0283', 'DN0142', 'RBC', '2026-10-04', 'Expired', 'F007', NULL),
  ('BC0284', 'DN0142', 'Plasma', '2027-08-23', 'Available', 'F008', NULL),
  ('BC0285', 'DN0143', 'Platelets', '2026-08-29', 'Expired', 'F018', NULL),
  ('BC0286', 'DN0143', 'RBC', '2026-10-05', 'Expired', 'F010', NULL),
  ('BC0287', 'DN0144', 'Plasma', '2027-08-25', 'Available', 'F011', NULL),
  ('BC0288', 'DN0144', 'Platelets', '2026-08-30', 'Expired', 'F021', NULL),
  ('BC0289', 'DN0145', 'RBC', '2026-10-07', 'Expired', 'F005', NULL),
  ('BC0290', 'DN0145', 'Plasma', '2027-08-26', 'Available', 'F006', NULL),
  ('BC0291', 'DN0146', 'Platelets', '2026-09-01', 'Expired', 'F015', NULL),
  ('BC0292', 'DN0146', 'RBC', '2026-10-08', 'Expired', 'F008', NULL),
  ('BC0293', 'DN0147', 'Plasma', '2027-08-28', 'Available', 'F009', NULL),
  ('BC0294', 'DN0147', 'Platelets', '2026-09-02', 'Expired', 'F018', NULL),
  ('BC0295', 'DN0148', 'RBC', '2026-10-10', 'Expired', 'F011', NULL),
  ('BC0296', 'DN0148', 'Plasma', '2027-08-29', 'In Transit', 'F012', NULL),
  ('BC0297', 'DN0149', 'Platelets', '2026-09-04', 'Expired', 'F021', NULL),
  ('BC0298', 'DN0149', 'RBC', '2026-10-11', 'Expired', 'F006', NULL),
  ('BC0299', 'DN0150', 'Plasma', '2027-08-31', 'Available', 'F007', NULL),
  ('BC0300', 'DN0150', 'Platelets', '2026-09-05', 'Expired', 'F015', NULL);

INSERT INTO TRANSFER (TransferID, ComponentID, FromFacility, ToFacility, Status, InitiatedAt, CompletedAt) VALUES
  ('T0001', 'BC0001', 'F005', 'F001', 'Initiated', '2026-10-01 13:00:00', NULL),
  ('T0002', 'BC0002', 'F006', 'F001', 'In Transit', '2026-10-01 18:00:00', NULL),
  ('T0003', 'BC0003', 'F007', 'F001', 'Completed', '2026-10-01 23:00:00', '2026-10-02 03:00:00'),
  ('T0004', 'BC0004', 'F008', 'F001', 'Cancelled', '2026-10-02 04:00:00', NULL),
  ('T0005', 'BC0005', 'F009', 'F001', 'Initiated', '2026-10-02 09:00:00', NULL),
  ('T0006', 'BC0006', 'F010', 'F001', 'In Transit', '2026-10-02 14:00:00', NULL),
  ('T0007', 'BC0007', 'F011', 'F001', 'Completed', '2026-10-02 19:00:00', '2026-10-02 23:00:00'),
  ('T0008', 'BC0008', 'F012', 'F001', 'Cancelled', '2026-10-03 00:00:00', NULL),
  ('T0009', 'BC0009', 'F005', 'F002', 'Initiated', '2026-10-03 05:00:00', NULL),
  ('T0010', 'BC0010', 'F006', 'F003', 'In Transit', '2026-10-03 10:00:00', NULL),
  ('T0011', 'BC0011', 'F007', 'F004', 'Completed', '2026-10-03 15:00:00', '2026-10-03 19:00:00'),
  ('T0012', 'BC0012', 'F008', 'F005', 'Cancelled', '2026-10-03 20:00:00', NULL),
  ('T0013', 'BC0013', 'F009', 'F006', 'Initiated', '2026-10-04 01:00:00', NULL),
  ('T0014', 'BC0014', 'F010', 'F007', 'In Transit', '2026-10-04 06:00:00', NULL),
  ('T0015', 'BC0015', 'F011', 'F008', 'Completed', '2026-10-04 11:00:00', '2026-10-04 15:00:00'),
  ('T0016', 'BC0016', 'F012', 'F009', 'Cancelled', '2026-10-04 16:00:00', NULL),
  ('T0017', 'BC0017', 'F005', 'F010', 'Initiated', '2026-10-04 21:00:00', NULL),
  ('T0018', 'BC0018', 'F006', 'F011', 'In Transit', '2026-10-05 02:00:00', NULL),
  ('T0019', 'BC0019', 'F007', 'F012', 'Completed', '2026-10-05 07:00:00', '2026-10-05 11:00:00'),
  ('T0020', 'BC0020', 'F008', 'F002', 'Cancelled', '2026-10-05 12:00:00', NULL),
  ('T0021', 'BC0021', 'F009', 'F003', 'Initiated', '2026-10-05 17:00:00', NULL),
  ('T0022', 'BC0022', 'F010', 'F004', 'In Transit', '2026-10-05 22:00:00', NULL),
  ('T0023', 'BC0023', 'F011', 'F005', 'Completed', '2026-10-06 03:00:00', '2026-10-06 07:00:00'),
  ('T0024', 'BC0024', 'F012', 'F006', 'Cancelled', '2026-10-06 08:00:00', NULL),
  ('T0025', 'BC0025', 'F005', 'F007', 'Initiated', '2026-10-06 13:00:00', NULL),
  ('T0026', 'BC0026', 'F006', 'F008', 'In Transit', '2026-10-06 18:00:00', NULL),
  ('T0027', 'BC0027', 'F007', 'F009', 'Completed', '2026-10-06 23:00:00', '2026-10-07 03:00:00'),
  ('T0028', 'BC0028', 'F008', 'F010', 'Cancelled', '2026-10-07 04:00:00', NULL),
  ('T0029', 'BC0029', 'F009', 'F011', 'Initiated', '2026-10-07 09:00:00', NULL),
  ('T0030', 'BC0030', 'F010', 'F012', 'In Transit', '2026-10-07 14:00:00', NULL);

INSERT INTO ALERT (FacilityID, ComponentID, AlertType, Message, IsRead) VALUES
  ('F001', 'BC0001', 'Expiry', 'Component BC0001 is approaching expiry; review stock.', FALSE),
  ('F002', NULL, 'LowStock', 'Low stock monitoring required at facility F002.', FALSE),
  ('F003', 'BC0003', 'Transfer', 'Transfer status review required for component BC0003.', FALSE),
  ('F004', 'BC0004', 'Expiry', 'Component BC0004 is approaching expiry; review stock.', TRUE),
  ('F005', NULL, 'LowStock', 'Low stock monitoring required at facility F005.', FALSE),
  ('F006', 'BC0006', 'Transfer', 'Transfer status review required for component BC0006.', FALSE),
  ('F007', 'BC0007', 'Expiry', 'Component BC0007 is approaching expiry; review stock.', FALSE),
  ('F008', NULL, 'LowStock', 'Low stock monitoring required at facility F008.', TRUE),
  ('F013', 'BC0009', 'Transfer', 'Transfer status review required for component BC0009.', FALSE),
  ('F015', 'BC0010', 'Expiry', 'Component BC0010 is approaching expiry; review stock.', FALSE),
  ('F018', NULL, 'LowStock', 'Low stock monitoring required at facility F018.', FALSE),
  ('F001', 'BC0012', 'Transfer', 'Transfer status review required for component BC0012.', TRUE),
  ('F002', 'BC0013', 'Expiry', 'Component BC0013 is approaching expiry; review stock.', FALSE),
  ('F003', NULL, 'LowStock', 'Low stock monitoring required at facility F003.', FALSE),
  ('F004', 'BC0015', 'Transfer', 'Transfer status review required for component BC0015.', FALSE),
  ('F005', 'BC0016', 'Expiry', 'Component BC0016 is approaching expiry; review stock.', TRUE),
  ('F006', NULL, 'LowStock', 'Low stock monitoring required at facility F006.', FALSE),
  ('F007', 'BC0018', 'Transfer', 'Transfer status review required for component BC0018.', FALSE),
  ('F008', 'BC0019', 'Expiry', 'Component BC0019 is approaching expiry; review stock.', FALSE),
  ('F013', NULL, 'LowStock', 'Low stock monitoring required at facility F013.', TRUE),
  ('F015', 'BC0021', 'Transfer', 'Transfer status review required for component BC0021.', FALSE),
  ('F018', 'BC0022', 'Expiry', 'Component BC0022 is approaching expiry; review stock.', FALSE),
  ('F001', NULL, 'LowStock', 'Low stock monitoring required at facility F001.', FALSE),
  ('F002', 'BC0024', 'Transfer', 'Transfer status review required for component BC0024.', TRUE),
  ('F003', 'BC0025', 'Expiry', 'Component BC0025 is approaching expiry; review stock.', FALSE),
  ('F004', NULL, 'LowStock', 'Low stock monitoring required at facility F004.', FALSE),
  ('F005', 'BC0027', 'Transfer', 'Transfer status review required for component BC0027.', FALSE),
  ('F006', 'BC0028', 'Expiry', 'Component BC0028 is approaching expiry; review stock.', TRUE),
  ('F007', NULL, 'LowStock', 'Low stock monitoring required at facility F007.', FALSE),
  ('F008', 'BC0030', 'Transfer', 'Transfer status review required for component BC0030.', FALSE);

-- 3. Indexes & Views

CREATE INDEX idx_comp_facility_status ON BLOOD_COMPONENT(FacilityID, Status);
CREATE INDEX idx_comp_expiry ON BLOOD_COMPONENT(ExpiryDate);
CREATE INDEX idx_req_status_priority ON BLOOD_REQUEST(Status, Priority, RequestTime);
CREATE INDEX idx_donation_donor_date ON DONATION(RedThreadID, DonationDate);
CREATE INDEX idx_facility_level_parent ON FACILITY(FacilityLevel, ReportsTo);
CREATE INDEX idx_facility_state_city ON FACILITY(StateName, Location);

CREATE VIEW v_inventory AS
SELECT bc.ComponentID, bc.Type, donor_person.BloodType AS BloodType,
       bc.ExpiryDate, bc.Status,
       f.FacilityID, f.FacilityName, f.FacilityLevel, f.StateName, f.Location,
       f.ReportsTo, bc.DonationID
FROM BLOOD_COMPONENT bc
JOIN DONATION dn ON bc.DonationID = dn.DonationID
JOIN DONOR d ON dn.RedThreadID = d.RedThreadID
JOIN PERSON donor_person ON donor_person.RedThreadID = d.RedThreadID
JOIN FACILITY f ON bc.FacilityID = f.FacilityID;

CREATE VIEW v_pending_requests AS
SELECT br.RequestID, br.RedThreadID,
       patient_person.Name AS PatientName,
       patient_person.BloodType AS PatientBloodType,
       br.FacilityID, f.FacilityName,
       br.ComponentType, br.BloodType AS RequestedBloodType,
       br.Quantity, br.Priority, br.Status, br.RequestTime
FROM BLOOD_REQUEST br
JOIN PATIENT pt ON pt.RedThreadID = br.RedThreadID
JOIN PERSON patient_person ON patient_person.RedThreadID = pt.RedThreadID
JOIN FACILITY f ON f.FacilityID = br.FacilityID
WHERE br.Status = 'Pending';

CREATE VIEW v_request_history AS
SELECT br.RequestID, br.RedThreadID,
       patient_person.Name AS PatientName,
       patient_person.BloodType AS PatientBloodType,
       br.FacilityID, f.FacilityName,
       br.ComponentType, br.BloodType AS RequestedBloodType,
       br.Quantity, br.Priority, br.Status, br.RequestTime
FROM BLOOD_REQUEST br
JOIN PATIENT pt ON pt.RedThreadID = br.RedThreadID
JOIN PERSON patient_person ON patient_person.RedThreadID = pt.RedThreadID
JOIN FACILITY f ON f.FacilityID = br.FacilityID;

-- 4. Triggers & Stored Procedures

DELIMITER $$

CREATE TRIGGER trg_donation_rules
BEFORE INSERT ON DONATION
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_last DATE;
  SELECT EligibilityStatus INTO v_status FROM DONOR WHERE RedThreadID = NEW.RedThreadID;
  IF v_status IS NULL OR v_status <> 'Eligible' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Donor is not eligible to donate';
  END IF;
  SELECT MAX(DonationDate) INTO v_last FROM DONATION WHERE RedThreadID = NEW.RedThreadID;
  IF v_last IS NOT NULL AND ABS(DATEDIFF(NEW.DonationDate, v_last)) < 56 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Donor must wait at least 56 days between donations';
  END IF;
END$$

CREATE PROCEDURE check_alerts()
BEGIN
  UPDATE BLOOD_COMPONENT SET Status='Expired'
  WHERE Status='Available' AND ExpiryDate < CURDATE();

  INSERT INTO ALERT (FacilityID, ComponentID, AlertType, Message)
  SELECT bc.FacilityID, bc.ComponentID, 'Expiry',
         CONCAT(bc.Type, ' unit ', bc.ComponentID, ' expires on ', bc.ExpiryDate)
  FROM BLOOD_COMPONENT bc
  WHERE bc.Status='Available'
    AND bc.ExpiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    AND NOT EXISTS (SELECT 1 FROM ALERT a WHERE a.ComponentID=bc.ComponentID AND a.AlertType='Expiry');

  INSERT INTO ALERT (FacilityID, AlertType, Message)
  SELECT x.FacilityID, 'LowStock', x.msg
  FROM (
    SELECT FacilityID,
           CONCAT('Low stock: only ', COUNT(*), ' ', BloodType, ' ', Type, ' unit(s) left') AS msg
    FROM v_inventory
    WHERE Status='Available' AND ExpiryDate >= CURDATE()
    GROUP BY FacilityID, BloodType, Type
    HAVING COUNT(*) < 2
  ) x
  WHERE NOT EXISTS (SELECT 1 FROM ALERT a
                    WHERE a.FacilityID=x.FacilityID AND a.Message=x.msg AND a.IsRead=FALSE);
END$$

CREATE PROCEDURE create_blood_request(
  IN p_RedThreadID VARCHAR(20),
  IN p_FacilityID VARCHAR(20),
  IN p_ComponentType VARCHAR(20),
  IN p_BloodType VARCHAR(5),
  IN p_Quantity INT,
  IN p_Priority VARCHAR(20)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_request_number BIGINT UNSIGNED DEFAULT 0;
  DECLARE v_request_id VARCHAR(20);

  SELECT COUNT(*) INTO v_count
  FROM PATIENT WHERE RedThreadID = p_RedThreadID;
  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Patient RedThreadID not found';
  END IF;

  IF p_Quantity IS NULL OR p_Quantity < 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be at least 1';
  END IF;
  IF p_ComponentType IS NULL OR p_ComponentType NOT IN ('RBC','Plasma','Platelets') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid ComponentType';
  END IF;
  IF p_BloodType IS NULL OR p_BloodType NOT IN ('A+','A-','B+','B-','AB+','AB-','O+','O-') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid BloodType';
  END IF;
  IF p_Priority IS NULL OR p_Priority NOT IN ('Emergency','Urgent','Routine') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid Priority';
  END IF;

  UPDATE BLOOD_REQUEST_ID_COUNTER
  SET LastValue = LAST_INSERT_ID(LastValue + 1)
  WHERE CounterID = 1;
  SET v_request_number = LAST_INSERT_ID();
  SET v_request_id = CONCAT('R', LPAD(v_request_number, GREATEST(4, LENGTH(CAST(v_request_number AS CHAR))), '0'));

  INSERT INTO BLOOD_REQUEST
    (RequestID, RedThreadID, FacilityID, ComponentType, BloodType, Quantity, Priority, Status)
  VALUES
    (v_request_id, p_RedThreadID, p_FacilityID, p_ComponentType, p_BloodType, p_Quantity, p_Priority, 'Pending');

  SELECT v_request_id AS RequestID, 'Pending' AS Status;
END$$

CREATE PROCEDURE allocate_request(IN p_request_id VARCHAR(20))
BEGIN
  DECLARE v_redthread_id VARCHAR(20);
  DECLARE v_type VARCHAR(20);
  DECLARE v_blood VARCHAR(5);
  DECLARE v_qty INT;
  DECLARE v_status VARCHAR(20);
  DECLARE v_component VARCHAR(20) DEFAULT NULL;
  DECLARE v_count INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_component = NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT RedThreadID, ComponentType, BloodType, Quantity, Status
  INTO v_redthread_id, v_type, v_blood, v_qty, v_status
  FROM BLOOD_REQUEST WHERE RequestID = p_request_id FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request not found';
  END IF;
  IF v_status <> 'Pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request is not pending';
  END IF;

  WHILE v_count < v_qty DO
    SET v_component = NULL;
    SELECT bc.ComponentID INTO v_component
    FROM BLOOD_COMPONENT bc
    JOIN DONATION dn ON bc.DonationID = dn.DonationID
    JOIN PERSON donor_person ON dn.RedThreadID = donor_person.RedThreadID
    WHERE bc.Type = v_type
      AND bc.Status = 'Available'
      AND bc.ExpiryDate >= CURDATE()
      AND (
        donor_person.BloodType = v_blood
        OR (v_type = 'RBC' AND EXISTS (
          SELECT 1 FROM BLOOD_COMPATIBILITY c
          WHERE c.DonorType = donor_person.BloodType
            AND c.RecipientType = v_blood
        ))
      )
    ORDER BY (donor_person.BloodType = v_blood) DESC, bc.ExpiryDate
    LIMIT 1 FOR UPDATE;

    IF v_component IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough matching stock';
    END IF;

    UPDATE BLOOD_COMPONENT
    SET Status = 'Reserved', RecipientRedThreadID = v_redthread_id
    WHERE ComponentID = v_component AND Status = 'Available';

    IF ROW_COUNT() <> 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component is no longer available';
    END IF;

    INSERT INTO ALLOCATION (AllocationID, RequestID, ComponentID)
    VALUES (CONCAT('ALX', SUBSTRING(REPLACE(UUID(), '-', ''), 1, 16)), p_request_id, v_component);

    SET v_count = v_count + 1;
  END WHILE;

  UPDATE BLOOD_REQUEST SET Status = 'Allocated'
  WHERE RequestID = p_request_id AND Status = 'Pending';

  COMMIT;

  SELECT AllocationID, RequestID, ComponentID, AllocatedAt
  FROM ALLOCATION WHERE RequestID = p_request_id ORDER BY AllocatedAt;
END$$

DELIMITER ;

-- 5. Verification Queries

SELECT FacilityID, FacilityName, FacilityLevel, StateName, Location, ReportsTo
FROM FACILITY
ORDER BY FIELD(FacilityLevel,'Central','State','City','Hospital'), FacilityID;

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
UNION ALL SELECT 'BLOOD_COMPATIBILITY', COUNT(*) FROM BLOOD_COMPATIBILITY;

-- Optional test calls:
-- CALL create_blood_request('RT0101', 'F013', 'RBC', 'A+', 1, 'Emergency');
-- CALL allocate_request('R0001');
-- CALL check_alerts();
