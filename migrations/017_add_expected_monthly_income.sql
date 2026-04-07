ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS expected_monthly_income DECIMAL(12,2) NOT NULL DEFAULT 0;
