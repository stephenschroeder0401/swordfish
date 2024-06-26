drop table property cascade;

CREATE TABLE Property (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255),
    Code VARCHAR(255),
    Address TEXT,
    Unit Text,
    EntityId UUID REFERENCES Entity(Id) not null
);