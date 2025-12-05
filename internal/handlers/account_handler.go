package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

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

	query := `INSERT INTO accounts (user_id, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err := h.DB.QueryRow(query, userID, acc.Name, acc.Type, acc.Balance).Scan(&acc.ID, &acc.CreatedAt)
	if err != nil {
		http.Error(w, "Erro ao criar conta", http.StatusInternalServerError)
		return
	}

	acc.UserID = userID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(acc)
}

func (h *AccountHandler) GetAccounts(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	rows, err := h.DB.Query(`SELECT id, name, type, balance, created_at FROM accounts WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		http.Error(w, "Erro ao buscar contas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	accounts := []models.Account{}
	for rows.Next() {
		var acc models.Account
		if err := rows.Scan(&acc.ID, &acc.Name, &acc.Type, &acc.Balance, &acc.CreatedAt); err != nil {
			http.Error(w, "Erro ao ler contas", http.StatusInternalServerError)
			return
		}
		acc.UserID = userID

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

		acc.Balance = totalIncomes - totalExpenses
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

	query := `UPDATE accounts SET name = $1, type = $2, balance = $3 WHERE id = $4 AND user_id = $5`
	_, err := h.DB.Exec(query, acc.Name, acc.Type, acc.Balance, id, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar conta", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Conta atualizada com sucesso"}`))
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
			INSERT INTO accounts (user_id, name, type, balance)
			VALUES ($1, 'Carteira Geral', 'corrente', 0)
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
	var totalIncomes, totalExpenses float64

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

	newBalance := totalIncomes - totalExpenses

	_, err = h.DB.Exec(`
		UPDATE accounts
		SET balance = $1
		WHERE id = $2 AND user_id = $3
	`, newBalance, accountID, userID)

	return err
}
