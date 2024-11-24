-- Set these variables once and run
DO $$ 
DECLARE 
    v_email text := 'stephen.o.schroeder@gmail.com';  -- user's email
    v_client_name text := 'WSPM';  -- client name
    v_role_name text := 'admin';      -- role name (superuser, admin, or employee)
    v_first_name text := 'Steve';          -- first name
    v_last_name text := 'Schroeder';            -- last name
BEGIN
    INSERT INTO user_account (user_id, client_id, role_id, first_name, last_name)
    SELECT 
        (SELECT id FROM auth.users WHERE email = v_email),
        (SELECT id FROM client WHERE name = v_client_name),
        (SELECT id FROM role WHERE name = v_role_name),
        v_first_name,
        v_last_name;
END $$;



select * from employee

1f693839-777c-4eb8-9462-0b0d900ef244

select * from billing_account

select * from user_account
select * from client
select * from 
