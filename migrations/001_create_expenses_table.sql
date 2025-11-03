CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50),
    date DATE NOT NULL DEFAULT CURRENT_DATE
)