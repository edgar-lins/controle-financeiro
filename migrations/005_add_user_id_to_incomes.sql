-- Add user_id to incomes and set default to NULL
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
