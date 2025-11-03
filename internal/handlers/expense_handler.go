package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

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

	query := `
		INSERT INTO expenses (description, amount, category, payment_method, date)
		VALUES ($1, $2, $3, $4, $5) 
		RETURNING id;
	`

	err = h.DB.QueryRow(query, expense.Description, expense.Amount, expense.Category, expense.PaymentMethod, expense.Date).Scan(&expense.ID)
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

	rows, err := h.DB.Query(`SELECT id, description, amount, category, payment_method, date FROM expenses ORDER BY date DESC`)
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
