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

type IncomeHandler struct {
	DB *sql.DB
}

func (h *IncomeHandler) CreateIncome(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		Date        string  `json:"date"`
		AccountID   *int64  `json:"account_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao ler o corpo da requisição", http.StatusBadRequest)
		return
	}

	incomeDate := time.Now().UTC()
	if strings.TrimSpace(req.Date) != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			http.Error(w, "Data inválida, use YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		incomeDate = parsed
	}

	income := models.Income{
		Description: req.Description,
		Amount:      req.Amount,
		Date:        incomeDate,
		Month:       int(incomeDate.Month()),
		Year:        incomeDate.Year(),
		AccountID:   req.AccountID,
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	// Se não tem account_id, cria/busca Carteira Geral
	if income.AccountID == nil {
		accountHandler := &AccountHandler{DB: h.DB}
		defaultAccountID, err := accountHandler.GetOrCreateDefaultAccount(userID)
		if err != nil {
			http.Error(w, "Erro ao criar conta padrão", http.StatusInternalServerError)
			fmt.Println("Erro ao criar conta padrão:", err)
			return
		}
		income.AccountID = &defaultAccountID
	}

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	query := `
		INSERT INTO incomes (description, amount, date, month, year, user_id, account_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id;
	`

	err = tx.QueryRow(query, income.Description, income.Amount, income.Date, income.Month, income.Year, userID, income.AccountID).Scan(&income.ID)
	if err != nil {
		http.Error(w, "Erro ao inserir renda", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	// Update account balance if account_id is provided
	if income.AccountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, income.Amount, income.AccountID, userID)
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
	json.NewEncoder(w).Encode(income)
}

func (h *IncomeHandler) GetIncomes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	monthParam := r.URL.Query().Get("month")
	yearParam := r.URL.Query().Get("year")

	baseQuery := `SELECT id, description, amount, date, month, year, account_id FROM incomes WHERE user_id = $1`
	args := []interface{}{userID}

	if monthParam != "" {
		baseQuery += " AND month = $" + strconv.Itoa(len(args)+1)
		monthVal, _ := strconv.Atoi(monthParam)
		args = append(args, monthVal)
	}

	if yearParam != "" {
		baseQuery += " AND year = $" + strconv.Itoa(len(args)+1)
		yearVal, _ := strconv.Atoi(yearParam)
		args = append(args, yearVal)
	}

	baseQuery += " ORDER BY date DESC"

	rows, err := h.DB.Query(baseQuery, args...)
	if err != nil {
		http.Error(w, "Erro ao buscar rendas", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}
	defer rows.Close()

	var incomes []models.Income
	for rows.Next() {
		var income models.Income
		if err := rows.Scan(&income.ID, &income.Description, &income.Amount, &income.Date, &income.Month, &income.Year, &income.AccountID); err != nil {
			http.Error(w, "Erro ao ler rendas", http.StatusInternalServerError)
			return
		}
		incomes = append(incomes, income)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incomes)
}

func (h *IncomeHandler) UpdateIncome(w http.ResponseWriter, r *http.Request) {
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
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		Date        string  `json:"date"`
		AccountID   *int64  `json:"account_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao ler corpo da requisição", http.StatusBadRequest)
		return
	}

	incomeDate := time.Now().UTC()
	if strings.TrimSpace(req.Date) != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			http.Error(w, "Data inválida, use YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		incomeDate = parsed
	}

	income := models.Income{
		Description: req.Description,
		Amount:      req.Amount,
		Date:        incomeDate,
		Month:       int(incomeDate.Month()),
		Year:        incomeDate.Year(),
		AccountID:   req.AccountID,
	}

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Get old income data
	var oldAmount float64
	var oldAccountID *int64
	err = tx.QueryRow(`SELECT amount, account_id FROM incomes WHERE id = $1 AND user_id = $2`, id, userID).Scan(&oldAmount, &oldAccountID)
	if err != nil {
		http.Error(w, "Erro ao buscar renda", http.StatusInternalServerError)
		return
	}

	// Update income
	query := `UPDATE incomes SET description = $1, amount = $2, date = $3, month = $4, year = $5, account_id = $6 WHERE id = $7 AND user_id = $8`
	_, err = tx.Exec(query, income.Description, income.Amount, income.Date, income.Month, income.Year, income.AccountID, id, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar renda", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	// Adjust account balances
	// Restore old account balance
	if oldAccountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, oldAmount, oldAccountID, userID)
		if err != nil {
			http.Error(w, "Erro ao atualizar saldo da conta antiga", http.StatusInternalServerError)
			return
		}
	}

	// Add to new account balance
	if income.AccountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, income.Amount, income.AccountID, userID)
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
	w.Write([]byte(`{"message": "Renda atualizada com sucesso"}`))
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

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Get income data before deleting to restore account balance
	var amount float64
	var accountID *int64
	err = tx.QueryRow(`SELECT amount, account_id FROM incomes WHERE id = $1 AND user_id = $2`, id, userID).Scan(&amount, &accountID)
	if err != nil {
		http.Error(w, "Erro ao buscar renda", http.StatusInternalServerError)
		return
	}

	// Delete income
	_, err = tx.Exec(`DELETE FROM incomes WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		http.Error(w, "Erro ao deletar renda", http.StatusInternalServerError)
		return
	}

	// Restore account balance if account_id exists
	if accountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, amount, accountID, userID)
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
