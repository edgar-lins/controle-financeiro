-- Permitir deletar contas mesmo com transferências vinculadas
-- As transferências antigas não serão apagadas, apenas o campo de conta ficará NULL

ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_from_account_id_fkey;
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_to_account_id_fkey;

ALTER TABLE transfers
  ADD CONSTRAINT transfers_from_account_id_fkey
  FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE transfers
  ADD CONSTRAINT transfers_to_account_id_fkey
  FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL;
