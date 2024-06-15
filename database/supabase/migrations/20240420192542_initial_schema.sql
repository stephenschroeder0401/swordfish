-- Creating table for Entity
CREATE TABLE Entity (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255)
);

-- Creating table for Property
CREATE TABLE Property (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255),
    Address TEXT,
    EntityId UUID REFERENCES Entity(Id)
);

-- Creating table for Account
CREATE TABLE BillingAccount (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    GlCode VARCHAR(10),
    Name VARCHAR(255),
    IsBilledBack BOOLEAN
);

-- Creating table for BillingPeriod
CREATE TABLE BillingPeriod (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    StartDate DATE,
    EndDate DATE
);

-- Creating table for Employee
CREATE TABLE Employee (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255),
    Email VARCHAR(255)
);

-- Creating table for Job
CREATE TABLE BillingJob (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    EmployeeId UUID REFERENCES Employee(Id),
    EntityId UUID REFERENCES Entity(Id),
    PropertyId UUID REFERENCES Property(Id),
    BillingCategoryId UUID REFERENCES BillingCategory(Id),
    BillingPeriodId UUID REFERENCES BillingPeriod(Id),
    Date DATE,
    StartTime TIMESTAMP,
    EndTime TIMESTAMP,
    BilledMiles DECIMAL(10, 2),
    MilageRate DECIMAL(10, 2),
    MilageTotal DECIMAL(10, 2),
    BilledHours DECIMAL(10, 2),
    HourlyRate DECIMAL(10, 2),
    HourlyToal DECIMAL(10, 2),
    Total DECIMAL(10, 2)
);

