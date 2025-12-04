package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
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

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	query := `
		INSERT INTO incomes (description, amount, date, month, year, user_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id;
	`

	err = h.DB.QueryRow(query, income.Description, income.Amount, income.Date, income.Month, income.Year, userID).Scan(&income.ID)
	if err != nil {
		http.Error(w, "Erro ao inserir renda", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(income)
}

func (h *IncomeHandler) GetIncomes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	rows, err := h.DB.Query(`SELECT id, description, amount, date, month, year FROM incomes WHERE user_id = $1 ORDER BY date DESC`, userID)
	if err != nil {
		http.Error(w, "Erro ao buscar rendas", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}
	defer rows.Close()

	var incomes []models.Income
	for rows.Next() {
		var income models.Income
		if err := rows.Scan(&income.ID, &income.Description, &income.Amount, &income.Date, &income.Month, &income.Year); err != nil {
			http.Error(w, "Erro ao ler rendas", http.StatusInternalServerError)
			return
		}
		incomes = append(incomes, income)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incomes)
}

func (h *IncomeHandler) DeleteIncome(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	_, err := h.DB.Exec(`DELETE FROM incomes WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		http.Error(w, "Erro ao deletar renda", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
