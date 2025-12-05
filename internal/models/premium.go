package models

import "time"

type Account struct {
	ID        int64     `json:"id"`
	UserID    int       `json:"user_id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // corrente, poupanca, cartao, investimento
	Balance   float64   `json:"balance"`
	Opening   float64   `json:"opening_balance"` // saldo inicial informado pelo usuário
	CreatedAt time.Time `json:"created_at"`
}

type Goal struct {
	ID            int64      `json:"id"`
	UserID        int        `json:"user_id"`
	Name          string     `json:"name"`
	TargetAmount  float64    `json:"target_amount"`
	CurrentAmount float64    `json:"current_amount"`
	Deadline      *time.Time `json:"deadline,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	Progress      float64    `json:"progress"` // calculated field
}
