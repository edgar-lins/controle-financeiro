-- Adiciona campos opcionais para contas do tipo cartão de crédito
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS closing_day INTEGER DEFAULT NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT NULL;
