package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
	"github.com/edgar-lins/controle-financeiro/internal/models"
)

type AccountHandler struct {
	DB *sql.DB
}

func (h *AccountHandler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	var acc models.Account
	if err := json.NewDecoder(r.Body).Decode(&acc); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	opening := acc.Opening
	if opening == 0 {
		opening = acc.Balance
	}

	query := `INSERT INTO accounts (user_id, name, type, balance, opening_balance) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err := h.DB.QueryRow(query, userID, acc.Name, acc.Type, opening, opening).Scan(&acc.ID, &acc.CreatedAt)
	if err != nil {
		http.Error(w, "Erro ao criar conta", http.StatusInternalServerError)
		return
	}

	acc.UserID = userID
	acc.Balance = opening
	acc.Opening = opening
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(acc)
}

func (h *AccountHandler) GetAccounts(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	rows, err := h.DB.Query(`SELECT id, name, type, balance, opening_balance, created_at FROM accounts WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		http.Error(w, "Erro ao buscar contas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	accounts := []models.Account{}
	for rows.Next() {
		var acc models.Account
		if err := rows.Scan(&acc.ID, &acc.Name, &acc.Type, &acc.Balance, &acc.Opening, &acc.CreatedAt); err != nil {
			http.Error(w, "Erro ao ler contas", http.StatusInternalServerError)
			return
		}
		acc.UserID = userID

		effectiveOpening := acc.Opening
		if effectiveOpening == 0 {
			effectiveOpening = acc.Balance
		}

		// Recalcula o saldo dinamicamente baseado nas transações
		var totalIncomes, totalExpenses float64
		h.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM incomes
			WHERE user_id = $1 AND account_id = $2
		`, userID, acc.ID).Scan(&totalIncomes)

		h.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM expenses
			WHERE user_id = $1 AND account_id = $2
		`, userID, acc.ID).Scan(&totalExpenses)

		var incomingTransfers, outgoingTransfers float64
		h.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transfers
			WHERE user_id = $1 AND to_account_id = $2
		`, userID, acc.ID).Scan(&incomingTransfers)

		h.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transfers
			WHERE user_id = $1 AND from_account_id = $2
		`, userID, acc.ID).Scan(&outgoingTransfers)

		acc.Balance = (effectiveOpening + totalIncomes + incomingTransfers) - (totalExpenses + outgoingTransfers)
		accounts = append(accounts, acc)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(accounts)
}

func (h *AccountHandler) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	id := r.URL.Query().Get("id")

	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	var acc models.Account
	if err := json.NewDecoder(r.Body).Decode(&acc); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	opening := acc.Opening
	if opening == 0 {
		opening = acc.Balance
	}

	query := `UPDATE accounts SET name = $1, type = $2, opening_balance = $3, balance = $4 WHERE id = $5 AND user_id = $6`
	_, err := h.DB.Exec(query, acc.Name, acc.Type, opening, opening, id, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar conta", http.StatusInternalServerError)
		return
	}

	if accID, parseErr := strconv.ParseInt(id, 10, 64); parseErr == nil {
		if recalcErr := h.RecalculateAccountBalance(accID, userID); recalcErr != nil {
			log.Printf("update account recalc error user=%d acc=%d err=%v", userID, accID, recalcErr)
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Conta atualizada com sucesso"}`))
}

type transferRequest struct {
	FromAccountID int64   `json:"from_account_id"`
	ToAccountID   int64   `json:"to_account_id"`
	Amount        float64 `json:"amount"`
	Date          string  `json:"date"`
	Description   string  `json:"description"`
}

// TransferFunds moves money between two user accounts without affecting income/expense totals
func (h *AccountHandler) TransferFunds(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	var req transferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("transfer decode error user=%d err=%v", userID, err)
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	if req.FromAccountID == 0 || req.ToAccountID == 0 {
		http.Error(w, "Contas de origem e destino são obrigatórias", http.StatusBadRequest)
		return
	}

	if req.FromAccountID == req.ToAccountID {
		http.Error(w, "Escolha contas diferentes para transferir", http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Valor deve ser maior que zero", http.StatusBadRequest)
		return
	}

	// Validate that both accounts belong to the user
	var count int
	if err := h.DB.QueryRow(`
		SELECT COUNT(*) FROM accounts WHERE user_id = $1 AND id IN ($2, $3)
	`, userID, req.FromAccountID, req.ToAccountID).Scan(&count); err != nil {
		log.Printf("transfer account validation error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao validar contas", http.StatusInternalServerError)
		return
	}
	if count != 2 {
		http.Error(w, "Contas inválidas", http.StatusForbidden)
		return
	}

	// Calculate real balance of origin account (opening + incomes - expenses + incoming transfers - outgoing transfers)
	var openingBalance, storedBalance, totalIncomes, totalExpenses, incomingTransfers, outgoingTransfers float64
	if err := h.DB.QueryRow(`
		SELECT opening_balance, balance
		FROM accounts
		WHERE user_id = $1 AND id = $2
	`, userID, req.FromAccountID).Scan(&openingBalance, &storedBalance); err != nil {
		log.Printf("transfer opening sum error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao calcular saldo", http.StatusInternalServerError)
		return
	}
	if openingBalance == 0 {
		openingBalance = storedBalance
	}

	if err := h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM incomes
		WHERE user_id = $1 AND account_id = $2
	`, userID, req.FromAccountID).Scan(&totalIncomes); err != nil {
		log.Printf("transfer income sum error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao calcular saldo", http.StatusInternalServerError)
		return
	}

	if err := h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE user_id = $1 AND account_id = $2
	`, userID, req.FromAccountID).Scan(&totalExpenses); err != nil {
		log.Printf("transfer expense sum error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao calcular saldo", http.StatusInternalServerError)
		return
	}

	if err := h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM transfers
		WHERE user_id = $1 AND to_account_id = $2
	`, userID, req.FromAccountID).Scan(&incomingTransfers); err != nil {
		log.Printf("transfer incoming sum error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao calcular saldo", http.StatusInternalServerError)
		return
	}

	if err := h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM transfers
		WHERE user_id = $1 AND from_account_id = $2
	`, userID, req.FromAccountID).Scan(&outgoingTransfers); err != nil {
		log.Printf("transfer outgoing sum error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao calcular saldo", http.StatusInternalServerError)
		return
	}

	currentBalance := (openingBalance + totalIncomes + incomingTransfers) - (totalExpenses + outgoingTransfers)

	// Validate sufficient balance
	if currentBalance < req.Amount {
		http.Error(w, "Saldo insuficiente para esta transferência", http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		log.Printf("transfer tx begin error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao iniciar transferência", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	dateValue := req.Date
	if dateValue == "" {
		// use today's date if not provided
		dateValue = "" // handled by DEFAULT if empty
	}

	_, err = tx.Exec(`
		INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description, date)
		VALUES ($1, $2, $3, $4, $5, COALESCE(NULLIF($6,'')::date, CURRENT_DATE))
	`, userID, req.FromAccountID, req.ToAccountID, req.Amount, req.Description, dateValue)
	if err != nil {
		log.Printf("transfer insert error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao registrar transferência", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("transfer tx commit error user=%d err=%v", userID, err)
		http.Error(w, "Erro ao concluir transferência", http.StatusInternalServerError)
		return
	}

	// Recalculate balances after the transfer
	if err := h.RecalculateAccountBalance(req.FromAccountID, userID); err != nil {
		log.Printf("transfer recalc origin error user=%d acc=%d err=%v", userID, req.FromAccountID, err)
	}
	if err := h.RecalculateAccountBalance(req.ToAccountID, userID); err != nil {
		log.Printf("transfer recalc dest error user=%d acc=%d err=%v", userID, req.ToAccountID, err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message":"Transferência realizada com sucesso"}`))
}

func (h *AccountHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	id := r.URL.Query().Get("id")

	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	// Verifica se é a Carteira Geral
	var accountName string
	err := h.DB.QueryRow(`SELECT name FROM accounts WHERE id = $1 AND user_id = $2`, id, userID).Scan(&accountName)
	if err != nil {
		http.Error(w, "Conta não encontrada", http.StatusNotFound)
		return
	}

	if accountName == "Carteira Geral" {
		http.Error(w, "Não é possível deletar a Carteira Geral", http.StatusForbidden)
		return
	}

	_, err = h.DB.Exec(`DELETE FROM accounts WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		http.Error(w, "Erro ao deletar conta", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetOrCreateDefaultAccount busca ou cria uma "Carteira Geral" padrão para o usuário
func (h *AccountHandler) GetOrCreateDefaultAccount(userID int) (int64, error) {
	var accountID int64

	// Primeiro, tenta buscar uma carteira geral existente
	err := h.DB.QueryRow(`
		SELECT id FROM accounts 
		WHERE user_id = $1 AND name = 'Carteira Geral'
		ORDER BY created_at ASC
		LIMIT 1
	`, userID).Scan(&accountID)

	if err == sql.ErrNoRows {
		// Se não existe, cria uma nova
		err = h.DB.QueryRow(`
			INSERT INTO accounts (user_id, name, type, balance, opening_balance)
			VALUES ($1, 'Carteira Geral', 'corrente', 0, 0)
			RETURNING id
		`, userID).Scan(&accountID)

		if err != nil {
			return 0, err
		}
	} else if err != nil {
		return 0, err
	}

	return accountID, nil
}

// RecalculateAccountBalance recalcula o saldo de uma conta baseado em suas transações
func (h *AccountHandler) RecalculateAccountBalance(accountID int64, userID int) error {
	var openingBalance, storedBalance, totalIncomes, totalExpenses float64

	if err := h.DB.QueryRow(`
		SELECT opening_balance, balance
		FROM accounts
		WHERE user_id = $1 AND id = $2
	`, userID, accountID).Scan(&openingBalance, &storedBalance); err != nil {
		return err
	}

	if openingBalance == 0 {
		openingBalance = storedBalance
	}

	err := h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM incomes
		WHERE user_id = $1 AND account_id = $2
	`, userID, accountID).Scan(&totalIncomes)
	if err != nil {
		return err
	}

	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE user_id = $1 AND account_id = $2
	`, userID, accountID).Scan(&totalExpenses)
	if err != nil {
		return err
	}

	var incomingTransfers, outgoingTransfers float64

	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM transfers
		WHERE user_id = $1 AND to_account_id = $2
	`, userID, accountID).Scan(&incomingTransfers)
	if err != nil {
		return err
	}

	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM transfers
		WHERE user_id = $1 AND from_account_id = $2
	`, userID, accountID).Scan(&outgoingTransfers)
	if err != nil {
		return err
	}

	newBalance := (openingBalance + totalIncomes + incomingTransfers) - (totalExpenses + outgoingTransfers)

	_, err = h.DB.Exec(`
		UPDATE accounts
		SET balance = $1
		WHERE id = $2 AND user_id = $3
	`, newBalance, accountID, userID)

	return err
}
