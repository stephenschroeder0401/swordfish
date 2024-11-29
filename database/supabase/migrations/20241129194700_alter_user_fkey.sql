ALTER TABLE user_account
DROP CONSTRAINT user_account_user_id_fkey;

ALTER TABLE user_account
ADD CONSTRAINT user_account_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;