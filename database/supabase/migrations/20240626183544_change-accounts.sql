ALTER TABLE public.billing_job
    DROP CONSTRAINT IF EXISTS billing_job_billing_account_id_fkey;

truncate table Billing_Account cascade;
drop table Billing_Account;

CREATE TABLE Billing_Account (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    GlCode VARCHAR(10),
    Name VARCHAR(255),
    Description VARCHAR(255),
    IsBilledBack BOOLEAN
);


insert into Billing_Account(GlCode, Name,Description, IsBilledBack) values
('6141', '1 R&M - General Labor','WSPM R&M Labor', 'true'),
('6144', '1 R&M - HVAC & Plumbing','WSPM R&M Labor', 'true'),
('7050', '2 CapEx - Other','WSPM CapEx Labor', 'true'),
('7010', '2 CapEx - Unit Turns','WSPM CapEx Labor', 'true'),
('7010', '3 Leasing: Applications & Lease Execution','WSPM CapEx Labor', 'true'),
('7010', '3 Leasing: Move-In/Move-Out Photos','WSPM CapEx Labor', 'true'),
('6113', '3 Leasing: Showings/Marketing','WSPM Marketing Labor', 'true'),
('6119', '3 Leasing: Violations & Document Service','WSPM Lease Violations/Service Labor', 'true'),
('6071', 'HOA Management','WSPM HOA Management Labor', 'true'),
('6147', 'R&M - Fire Protection & Security','WSPM R&M Labor', 'true'),
('6145', 'R&M - Landscaping & Grounds','WSPM R&M Labor', 'true'),
('6146', 'R&M - Roof and Building Exterior','WSPM R&M Labor', 'true'),
('6193', 'Z CapEx - Admin Setup','WSPM Admin Setup Labor', 'true'),
('7030', 'Z CapEx - Exterior & Roofing','WSPM CapEx Labor', 'true'),
('7060', 'Z CapEx - Furniture, Fixtures & Equipment','WSPM CapEx Labor', 'true'),
('7035', 'Z CapEx - Land Planning','WSPM CapEx Labor', 'true'),
('7040', 'Z CapEx - Landscaping','WSPM CapEx Labor', 'true');


ALTER TABLE public.billing_job
    ADD CONSTRAINT billing_job_billing_account_id_fkey FOREIGN KEY (billing_account_id)
    REFERENCES public.billing_account (id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
