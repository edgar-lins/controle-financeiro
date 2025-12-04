-- Add user_id to expenses and set default to NULL
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
