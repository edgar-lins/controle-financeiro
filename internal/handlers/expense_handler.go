package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
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

	var req struct {
		Description   string  `json:"description"`
		Amount        float64 `json:"amount"`
		Category      string  `json:"category"`
		Group         string  `json:"group"`
		PaymentMethod string  `json:"payment_method"`
		Date          string  `json:"date"`
		AccountID     *int64  `json:"account_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao ler corpo da requisição", http.StatusBadRequest)
		return
	}

	expenseDate := time.Now().UTC()
	if strings.TrimSpace(req.Date) != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			http.Error(w, "Data inválida, use YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		expenseDate = parsed
	}

	expense := models.Expense{
		Description:   req.Description,
		Amount:        req.Amount,
		Category:      req.Category,
		Group:         req.Group,
		PaymentMethod: req.PaymentMethod,
		Date:          expenseDate,
		AccountID:     req.AccountID,
	}

	// Default and validate group
	if strings.TrimSpace(expense.Group) == "" {
		expense.Group = "essencial"
	}
	switch expense.Group {
	case "essencial", "lazer", "investimento":
	default:
		expense.Group = "essencial"
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	// Se não tem account_id, cria/busca Carteira Geral
	if expense.AccountID == nil {
		accountHandler := &AccountHandler{DB: h.DB}
		defaultAccountID, err := accountHandler.GetOrCreateDefaultAccount(userID)
		if err != nil {
			http.Error(w, "Erro ao criar conta padrão", http.StatusInternalServerError)
			fmt.Println("Erro ao criar conta padrão:", err)
			return
		}
		expense.AccountID = &defaultAccountID
	}

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	query := `
		INSERT INTO expenses (description, amount, category, "group", payment_method, date, user_id, account_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
		RETURNING id;
	`

	err = tx.QueryRow(query, expense.Description, expense.Amount, expense.Category, expense.Group, expense.PaymentMethod, expense.Date, userID, expense.AccountID).Scan(&expense.ID)
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
	monthParam := r.URL.Query().Get("month")
	yearParam := r.URL.Query().Get("year")

	baseQuery := `SELECT id, description, amount, category, "group", payment_method, date, account_id FROM expenses WHERE user_id = $1`
	args := []interface{}{userID}

	if monthParam != "" {
		baseQuery += " AND EXTRACT(MONTH FROM date) = $" + strconv.Itoa(len(args)+1)
		monthVal, _ := strconv.Atoi(monthParam)
		args = append(args, monthVal)
	}

	if yearParam != "" {
		baseQuery += " AND EXTRACT(YEAR FROM date) = $" + strconv.Itoa(len(args)+1)
		yearVal, _ := strconv.Atoi(yearParam)
		args = append(args, yearVal)
	}

	baseQuery += " ORDER BY date DESC"

	rows, err := h.DB.Query(baseQuery, args...)
	if err != nil {
		http.Error(w, "Erro ao buscar gastos no banco", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}
	defer rows.Close()

	var expenses []models.Expense
	for rows.Next() {
		var expense models.Expense
		err := rows.Scan(&expense.ID, &expense.Description, &expense.Amount, &expense.Category, &expense.Group, &expense.PaymentMethod, &expense.Date, &expense.AccountID)
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

	var req struct {
		Description   string  `json:"description"`
		Amount        float64 `json:"amount"`
		Category      string  `json:"category"`
		Group         string  `json:"group"`
		PaymentMethod string  `json:"payment_method"`
		Date          string  `json:"date"`
		AccountID     *int64  `json:"account_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao ler corpo da requisição", http.StatusBadRequest)
		return
	}

	expenseDate := time.Now().UTC()
	if strings.TrimSpace(req.Date) != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			http.Error(w, "Data inválida, use YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		expenseDate = parsed
	}

	expense := models.Expense{
		Description:   req.Description,
		Amount:        req.Amount,
		Category:      req.Category,
		Group:         req.Group,
		PaymentMethod: req.PaymentMethod,
		Date:          expenseDate,
		AccountID:     req.AccountID,
	}

	if strings.TrimSpace(expense.Group) == "" {
		expense.Group = "essencial"
	}

	// Guard invalid values to satisfy check constraint
	switch expense.Group {
	case "essencial", "lazer", "investimento":
	default:
		expense.Group = "essencial"
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
	query := `UPDATE expenses SET description = $1, amount = $2, category = $3, "group" = $4, payment_method = $5, date = $6, account_id = $7 WHERE id = $8 AND user_id = $9`
	_, err = tx.Exec(query, expense.Description, expense.Amount, expense.Category, expense.Group, expense.PaymentMethod, expense.Date, expense.AccountID, id, userID)
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
