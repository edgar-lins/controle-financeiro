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

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	query := `
		INSERT INTO expenses (description, amount, category, payment_method, date, user_id, account_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7) 
		RETURNING id;
	`

	err = tx.QueryRow(query, expense.Description, expense.Amount, expense.Category, expense.PaymentMethod, expense.Date, userID, expense.AccountID).Scan(&expense.ID)
	if err != nil {
		http.Error(w, "Erro ao inserir gasto no banco", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	// Update account balance if account_id is provided
	if expense.AccountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, expense.Amount, expense.AccountID, userID)
		if err != nil {
			http.Error(w, "Erro ao atualizar saldo da conta", http.StatusInternalServerError)
			fmt.Println("Erro:", err)
			return
		}
	}

	err = tx.Commit()
	if err != nil {
		http.Error(w, "Erro ao confirmar transação", http.StatusInternalServerError)
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
	rows, err := h.DB.Query(`SELECT id, description, amount, category, payment_method, date, account_id FROM expenses WHERE user_id = $1 ORDER BY date DESC`, userID)
	if err != nil {
		http.Error(w, "Erro ao buscar gastos no banco", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}
	defer rows.Close()

	var expenses []models.Expense
	for rows.Next() {
		var expense models.Expense
		err := rows.Scan(&expense.ID, &expense.Description, &expense.Amount, &expense.Category, &expense.PaymentMethod, &expense.Date, &expense.AccountID)
		if err != nil {
			http.Error(w, "Erro ao ler dados do banco", http.StatusInternalServerError)
			return
		}
		expenses = append(expenses, expense)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(expenses)
}

func (h *ExpenseHandler) UpdateExpense(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
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

	var expense models.Expense
	err := json.NewDecoder(r.Body).Decode(&expense)
	if err != nil {
		http.Error(w, "Erro ao ler corpo da requisição", http.StatusBadRequest)
		return
	}

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Get old expense data
	var oldAmount float64
	var oldAccountID *int64
	err = tx.QueryRow(`SELECT amount, account_id FROM expenses WHERE id = $1 AND user_id = $2`, id, userID).Scan(&oldAmount, &oldAccountID)
	if err != nil {
		http.Error(w, "Erro ao buscar gasto", http.StatusInternalServerError)
		return
	}

	// Update expense
	query := `UPDATE expenses SET description = $1, amount = $2, category = $3, payment_method = $4, account_id = $5 WHERE id = $6 AND user_id = $7`
	_, err = tx.Exec(query, expense.Description, expense.Amount, expense.Category, expense.PaymentMethod, expense.AccountID, id, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar gasto", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	// Adjust account balances
	// Restore old account balance
	if oldAccountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, oldAmount, oldAccountID, userID)
		if err != nil {
			http.Error(w, "Erro ao atualizar saldo da conta antiga", http.StatusInternalServerError)
			return
		}
	}

	// Deduct from new account balance
	if expense.AccountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, expense.Amount, expense.AccountID, userID)
		if err != nil {
			http.Error(w, "Erro ao atualizar saldo da nova conta", http.StatusInternalServerError)
			return
		}
	}

	err = tx.Commit()
	if err != nil {
		http.Error(w, "Erro ao confirmar transação", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Gasto atualizado com sucesso"}`))
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

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Get expense data before deleting to restore account balance
	var amount float64
	var accountID *int64
	err = tx.QueryRow(`SELECT amount, account_id FROM expenses WHERE id = $1 AND user_id = $2`, id, userID).Scan(&amount, &accountID)
	if err != nil {
		http.Error(w, "Erro ao buscar gasto", http.StatusInternalServerError)
		return
	}

	// Delete expense
	_, err = tx.Exec(`DELETE FROM expenses WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		http.Error(w, "Erro ao deletar gasto", http.StatusInternalServerError)
		return
	}

	// Restore account balance if account_id exists
	if accountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, amount, accountID, userID)
		if err != nil {
			http.Error(w, "Erro ao atualizar saldo da conta", http.StatusInternalServerError)
			return
		}
	}

	err = tx.Commit()
	if err != nil {
		http.Error(w, "Erro ao confirmar transação", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
