package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/edgar-lins/controle-financeiro/internal/models"
)

type IncomeHandler struct {
	DB *sql.DB
}

func (h *IncomeHandler) CreateIncome(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var income models.Income
	err := json.NewDecoder(r.Body).Decode(&income)
	if err != nil {
		http.Error(w, "Erro ao ler o corpo da requisição", http.StatusBadRequest)
		return
	}

	if income.Date.IsZero() {
		income.Date = time.Now()
	}
	income.Month = int(income.Date.Month())
	income.Year = income.Date.Year()

	query := `
		INSERT INTO incomes (description, amount, date, month, year)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id;
	`

	err = h.DB.QueryRow(query, income.Description, income.Amount, income.Date, income.Month, income.Year).Scan(&income.ID)
	if err != nil {
		http.Error(w, "Erro ao inserir renda", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(income)
}
