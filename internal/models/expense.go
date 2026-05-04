package models

import "time"

type Expense struct {
	ID                 int64     `json:"id"`
	Description        string    `json:"description"`
	Amount             float64   `json:"amount"`
	Category           string    `json:"category"`
	Group              string    `json:"group"`
	PaymentMethod      string    `json:"payment_method"`
	Date               time.Time `json:"date"`
	AccountID          *int64    `json:"account_id"`
	InstallmentNumber  int       `json:"installment_number"`
	InstallmentTotal   int       `json:"installment_total"`
	InstallmentGroupID *int64    `json:"installment_group_id,omitempty"`
	IsRecurring        bool      `json:"is_recurring"`
	RecurrenceDay      *int      `json:"recurrence_day,omitempty"`
}
