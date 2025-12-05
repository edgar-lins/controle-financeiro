package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
)

type MigrationHandler struct {
	DB *sql.DB
}

// CheckUnlinkedTransactions verifica se há transações sem conta vinculada
func (h *MigrationHandler) CheckUnlinkedTransactions(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	var unlinkedExpenses, unlinkedIncomes int
	var totalUnlinkedAmount float64

	// Conta gastos sem account_id
	h.DB.QueryRow(`
		SELECT COUNT(*), COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE user_id = $1 AND account_id IS NULL
	`, userID).Scan(&unlinkedExpenses, &totalUnlinkedAmount)

	// Soma rendas sem account_id
	var unlinkedIncomesAmount float64
	h.DB.QueryRow(`
		SELECT COUNT(*), COALESCE(SUM(amount), 0)
		FROM incomes
		WHERE user_id = $1 AND account_id IS NULL
	`, userID).Scan(&unlinkedIncomes, &unlinkedIncomesAmount)

	totalUnlinkedAmount += unlinkedIncomesAmount

	response := map[string]interface{}{
		"has_unlinked":        (unlinkedExpenses + unlinkedIncomes) > 0,
		"unlinked_expenses":   unlinkedExpenses,
		"unlinked_incomes":    unlinkedIncomes,
		"total_unlinked":      unlinkedExpenses + unlinkedIncomes,
		"total_amount_impact": totalUnlinkedAmount,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// MigrateUnlinkedTransactions migra transações sem conta para a Carteira Geral
func (h *MigrationHandler) MigrateUnlinkedTransactions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	// Cria/busca Carteira Geral
	accountHandler := &AccountHandler{DB: h.DB}
	defaultAccountID, err := accountHandler.GetOrCreateDefaultAccount(userID)
	if err != nil {
		http.Error(w, "Erro ao criar conta padrão", http.StatusInternalServerError)
		return
	}

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Migra gastos
	result, err := tx.Exec(`
		UPDATE expenses
		SET account_id = $1
		WHERE user_id = $2 AND account_id IS NULL
	`, defaultAccountID, userID)
	if err != nil {
		http.Error(w, "Erro ao migrar gastos", http.StatusInternalServerError)
		return
	}
	expensesMigrated, _ := result.RowsAffected()

	// Migra rendas
	result, err = tx.Exec(`
		UPDATE incomes
		SET account_id = $1
		WHERE user_id = $2 AND account_id IS NULL
	`, defaultAccountID, userID)
	if err != nil {
		http.Error(w, "Erro ao migrar rendas", http.StatusInternalServerError)
		return
	}
	incomesMigrated, _ := result.RowsAffected()

	// Recalcula saldo da Carteira Geral
	var totalIncomes, totalExpenses float64
	err = tx.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM incomes
		WHERE user_id = $1 AND account_id = $2
	`, userID, defaultAccountID).Scan(&totalIncomes)
	if err != nil {
		http.Error(w, "Erro ao calcular rendas", http.StatusInternalServerError)
		return
	}

	err = tx.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE user_id = $1 AND account_id = $2
	`, userID, defaultAccountID).Scan(&totalExpenses)
	if err != nil {
		http.Error(w, "Erro ao calcular gastos", http.StatusInternalServerError)
		return
	}

	newBalance := totalIncomes - totalExpenses

	_, err = tx.Exec(`
		UPDATE accounts
		SET balance = $1
		WHERE id = $2 AND user_id = $3
	`, newBalance, defaultAccountID, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar saldo", http.StatusInternalServerError)
		return
	}

	err = tx.Commit()
	if err != nil {
		http.Error(w, "Erro ao confirmar migração", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message":           "Transações migradas com sucesso",
		"expenses_migrated": expensesMigrated,
		"incomes_migrated":  incomesMigrated,
		"total_migrated":    expensesMigrated + incomesMigrated,
		"new_balance":       newBalance,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
