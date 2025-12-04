package models

type UserPreferences struct {
	ID                   int     `json:"id"`
	UserID               int     `json:"user_id"`
	ExpensesPercent      float64 `json:"expenses_percent"`
	EntertainmentPercent float64 `json:"entertainment_percent"`
	InvestmentPercent    float64 `json:"investment_percent"`
	CreatedAt            string  `json:"created_at"`
	UpdatedAt            string  `json:"updated_at"`
}
