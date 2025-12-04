package models

import "time"

type Expense struct {
	ID            int64     `json:"id"`
	Description   string    `json:"description"`
	Amount        float64   `json:"amount"`
	Category      string    `json:"category"`
	PaymentMethod string    `json:"payment_method"`
	Date          time.Time `json:"date"`
	AccountID     *int64    `json:"account_id"`
}
