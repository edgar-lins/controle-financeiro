-- Adiciona tabela de preferências de distribuição financeira por usuário
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    expenses_percent DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    entertainment_percent DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    investment_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
