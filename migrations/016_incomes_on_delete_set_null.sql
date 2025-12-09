-- Migration: Set incomes.account_id to NULL on account delete
-- Allows deleting accounts even with related incomes

ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_account_id_fkey;
ALTER TABLE incomes
  ADD CONSTRAINT incomes_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
