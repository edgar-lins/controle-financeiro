-- Add opening_balance to persist saldo inicial informado pelo usuário
ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Preencher contas existentes com o saldo atual como saldo inicial, se ainda não definido
UPDATE accounts
SET opening_balance = balance
WHERE opening_balance = 0;
