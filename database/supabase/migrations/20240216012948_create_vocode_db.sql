CREATE TABLE IF NOT EXISTS public.call_history
(
    id uuid NOT NULL DEFAULT gen_random_uuid() primary key,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    prompt text COLLATE pg_catalog."default",
    transcript text COLLATE pg_catalog."default",
    to_number text COLLATE pg_catalog."default",
    from_number text COLLATE pg_catalog."default",
    start_time timestamp with time zone,
    end_time timestamp with time zone
);
