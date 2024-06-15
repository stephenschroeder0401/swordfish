
/* drop and create billing_job with snake_case */
drop table if exists billing_job;

create table billing_job (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid references employee(id),
    entity_id uuid references entity(id),
    property_id uuid references property(id),
    billing_account_id uuid references billing_account(id),
    billing_period_id uuid references billing_period(id),
    job_date date,
    start_time timestamp,
    end_time timestamp,
    billed_miles decimal(10, 2),
    milage_rate decimal(10, 2),
    milage_total decimal(10, 2),
    billed_hours decimal(10, 2),
    hourly_rate decimal(10, 2),
    hourly_total decimal(10, 2),
    total decimal(10, 2)
);