create table role (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert the three roles we need
insert into role (name) values 
  ('superuser'),
  ('admin'),
  ('employee');

-- Add role_id to users table and set up foreign key
alter table auth.users add column role_id uuid references role(id);

-- Create user_account table with all references
create table user_account (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references client(id) not null,
  role_id uuid references role(id) not null,
  first_name text not null,
  last_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
