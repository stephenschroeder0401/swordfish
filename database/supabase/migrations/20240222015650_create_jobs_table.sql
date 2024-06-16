-- Table: public.jobs

DROP TABLE IF EXISTS public.jobs;

CREATE TABLE IF NOT EXISTS public.jobs
(
    id integer NOT NULL DEFAULT nextval('jobs_id_seq'::regclass),
    employee character varying(255) COLLATE pg_catalog."default" NOT NULL,
    date date NOT NULL,
    property character varying(255) COLLATE pg_catalog."default",
    category character varying(255) COLLATE pg_catalog."default",
    hours numeric(5,2) NOT NULL,
    rate numeric(10,2),
    total numeric(10,2),
    CONSTRAINT jobs_pkey PRIMARY KEY (id),
    entity VARCHAR(255)
);