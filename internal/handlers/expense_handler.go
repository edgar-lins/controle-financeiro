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

type ExpenseHandler struct {
	DB *sql.DB
}

func (h *ExpenseHandler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var expense models.Expense
	err := json.NewDecoder(r.Body).Decode(&expense)
	if err != nil {
		http.Error(w, "Erro ao ler corpo da requisição", http.StatusBadRequest)
		return
	}

	if expense.Date.IsZero() {
		expense.Date = time.Now()
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	query := `
		INSERT INTO expenses (description, amount, category, payment_method, date, user_id)
		VALUES ($1, $2, $3, $4, $5, $6) 
		RETURNING id;
	`

	err = h.DB.QueryRow(query, expense.Description, expense.Amount, expense.Category, expense.PaymentMethod, expense.Date, userID).Scan(&expense.ID)
	if err != nil {
		http.Error(w, "Erro ao inserir gasto no banco", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expense)
}

func (h *ExpenseHandler) GetExpenses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	rows, err := h.DB.Query(`SELECT id, description, amount, category, payment_method, date FROM expenses WHERE user_id = $1 ORDER BY date DESC`, userID)
	if err != nil {
		http.Error(w, "Erro ao buscar gastos no banco", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}
	defer rows.Close()

	var expenses []models.Expense
	for rows.Next() {
		var expense models.Expense
		err := rows.Scan(&expense.ID, &expense.Description, &expense.Amount, &expense.Category, &expense.PaymentMethod, &expense.Date)
		if err != nil {
			http.Error(w, "Erro ao ler dados do banco", http.StatusInternalServerError)
			return
		}
		expenses = append(expenses, expense)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expenses)
}

func (h *ExpenseHandler) DeleteExpense(w http.ResponseWriter, r *http.Request) {
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
	_, err := h.DB.Exec(`DELETE FROM expenses WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		http.Error(w, "Erro ao deletar gasto", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
