ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurrence_day INTEGER;

CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(user_id, is_recurring) WHERE is_recurring = TRUE;
