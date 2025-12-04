-- Add account_id to expenses and incomes (nullable for backward compatibility)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id);
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id);

CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_incomes_account_id ON incomes(account_id);
