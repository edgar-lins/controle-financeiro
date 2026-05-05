package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

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

	if strings.TrimSpace(acc.Name) == "" {
		http.Error(w, "Nome da conta é obrigatório", http.StatusBadRequest)
		return
	}
	validTypes := map[string]bool{"corrente": true, "poupanca": true, "cartao": true, "investimento": true}
	if !validTypes[acc.Type] {
		http.Error(w, "Tipo de conta inválido", http.StatusBadRequest)
		return
	}
	if acc.ClosingDay != nil && (*acc.ClosingDay < 1 || *acc.ClosingDay > 31) {
		http.Error(w, "Dia de fechamento deve ser entre 1 e 31", http.StatusBadRequest)
		return
	}
	if acc.DueDay != nil && (*acc.DueDay < 1 || *acc.DueDay > 31) {
		http.Error(w, "Dia de vencimento deve ser entre 1 e 31", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO accounts (user_id, name, type, balance, credit_limit, closing_day, due_day)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at`
	err := h.DB.QueryRow(query, userID, acc.Name, acc.Type, acc.Balance, acc.CreditLimit, acc.ClosingDay, acc.DueDay).Scan(&acc.ID, &acc.CreatedAt)
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

	rows, err := h.DB.Query(`
		SELECT id, name, type, balance, credit_limit, closing_day, due_day, created_at
		FROM accounts WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		http.Error(w, "Erro ao buscar contas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	accounts := []models.Account{}
	for rows.Next() {
		var acc models.Account
		if err := rows.Scan(&acc.ID, &acc.Name, &acc.Type, &acc.Balance, &acc.CreditLimit, &acc.ClosingDay, &acc.DueDay, &acc.CreatedAt); err != nil {
			http.Error(w, "Erro ao ler contas", http.StatusInternalServerError)
			return
		}
		acc.UserID = userID
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

	query := `
		UPDATE accounts
		SET name = $1, type = $2, balance = $3, credit_limit = $4, closing_day = $5, due_day = $6
		WHERE id = $7 AND user_id = $8`
	result, err := h.DB.Exec(query, acc.Name, acc.Type, acc.Balance, acc.CreditLimit, acc.ClosingDay, acc.DueDay, id, userID)
	if err != nil {
		// log removido para produção
		http.Error(w, "Erro ao atualizar conta", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		// log removido para produção
		http.Error(w, "Conta não encontrada", http.StatusNotFound)
		return
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
		// log removido para produção
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
		// log removido para produção
		http.Error(w, "Erro ao validar contas", http.StatusInternalServerError)
		return
	}
	if count != 2 {
		http.Error(w, "Contas inválidas", http.StatusForbidden)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		// log removido para produção
		http.Error(w, "Erro ao iniciar transferência", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Bloqueia a linha da conta de origem antes de ler o saldo,
	// prevenindo race condition com requisições simultâneas (SELECT FOR UPDATE).
	var currentBalance float64
	if err = tx.QueryRow(`
		SELECT balance FROM accounts WHERE user_id = $1 AND id = $2 FOR UPDATE
	`, userID, req.FromAccountID).Scan(&currentBalance); err != nil {
		http.Error(w, "Erro ao calcular saldo", http.StatusInternalServerError)
		return
	}

	if currentBalance < req.Amount {
		http.Error(w, "Saldo insuficiente para esta transferência", http.StatusBadRequest)
		return
	}

	dateValue := req.Date

	_, err = tx.Exec(`
		INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description, date)
		VALUES ($1, $2, $3, $4, $5, COALESCE(NULLIF($6,'')::date, CURRENT_DATE))
	`, userID, req.FromAccountID, req.ToAccountID, req.Amount, req.Description, dateValue)
	if err != nil {
		http.Error(w, "Erro ao registrar transferência", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`,
		req.Amount, req.FromAccountID, userID)
	if err != nil {
		http.Error(w, "Erro ao debitar conta de origem", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3`,
		req.Amount, req.ToAccountID, userID)
	if err != nil {
		http.Error(w, "Erro ao creditar conta de destino", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Erro ao concluir transferência", http.StatusInternalServerError)
		return
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
		// log removido para produção
		// Só retorna 409 se for erro de constraint
		if strings.Contains(err.Error(), "violates foreign key constraint") || strings.Contains(err.Error(), "constraint failed") {
			http.Error(w, "Não é possível deletar essa conta. Verifique se há transações vinculadas.", http.StatusConflict)
			return
		}
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
