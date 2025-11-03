package models

import "time"

type Income struct {
	ID          int       `json:"id"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	Date        time.Time `json:"date"`
	Month       int       `json:"month"`
	Year        int       `json:"year"`
}
