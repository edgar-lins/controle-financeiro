-- Migration: Set expenses.account_id to NULL on account delete
-- Allows deleting accounts even with related expenses

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_account_id_fkey;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
