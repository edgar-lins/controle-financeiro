-- Add group column to expenses table for 50/30/20 rule classification
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "group" VARCHAR(20);

-- Set default group based on existing categories (backwards compatibility)
UPDATE expenses SET "group" = CASE
    WHEN category IN ('moradia', 'alimentacao', 'transporte', 'contas', 'saude', 'fixo') THEN 'essencial'
    WHEN category IN ('lazer', 'restaurantes', 'streaming', 'compras', 'viagens', 'pets') THEN 'lazer'
    WHEN category IN ('poupanca', 'investimentos', 'previdencia', 'dividas', 'investimento') THEN 'investimento'
    ELSE 'essencial'
END
WHERE "group" IS NULL;

-- Set NOT NULL after filling existing data
ALTER TABLE expenses ALTER COLUMN "group" SET NOT NULL;

-- Add check constraint to ensure valid group values
ALTER TABLE expenses ADD CONSTRAINT check_expense_group 
    CHECK ("group" IN ('essencial', 'lazer', 'investimento'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses("group");
CREATE INDEX IF NOT EXISTS idx_expenses_user_group ON expenses(user_id, "group");
