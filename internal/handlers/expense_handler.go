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
		Installments  int     `json:"installments"`
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

	if strings.TrimSpace(req.Group) == "" {
		req.Group = "essencial"
	}
	switch req.Group {
	case "essencial", "lazer", "investimento":
	default:
		req.Group = "essencial"
	}

	if req.Installments < 1 {
		req.Installments = 1
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	if req.AccountID == nil {
		accountHandler := &AccountHandler{DB: h.DB}
		defaultAccountID, err := accountHandler.GetOrCreateDefaultAccount(userID)
		if err != nil {
			http.Error(w, "Erro ao criar conta padrão", http.StatusInternalServerError)
			return
		}
		req.AccountID = &defaultAccountID
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	installmentAmount := req.Amount
	if req.Installments > 1 {
		installmentAmount = req.Amount / float64(req.Installments)
	}

	insertFirstQuery := `
		INSERT INTO expenses (description, amount, category, "group", payment_method, date, user_id, account_id, installment_number, installment_total, installment_group_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id;
	`

	insertFollowQuery := `
		INSERT INTO expenses (description, amount, category, "group", payment_method, date, user_id, account_id, installment_number, installment_total, installment_group_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	// Cria a primeira parcela
	var firstID int64
	err = tx.QueryRow(insertFirstQuery,
		req.Description, installmentAmount, req.Category, req.Group,
		req.PaymentMethod, expenseDate, userID, req.AccountID,
		1, req.Installments, nil,
	).Scan(&firstID)
	if err != nil {
		http.Error(w, "Erro ao inserir gasto", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	// Define o group_id como o ID da primeira parcela
	if _, err = tx.Exec(`UPDATE expenses SET installment_group_id = $1 WHERE id = $1`, firstID); err != nil {
		http.Error(w, "Erro ao definir grupo de parcelas", http.StatusInternalServerError)
		return
	}

	// Cria as parcelas seguintes (sem debitar saldo)
	for i := 2; i <= req.Installments; i++ {
		installmentDate := expenseDate.AddDate(0, i-1, 0)
		_, err = tx.Exec(insertFollowQuery,
			req.Description, installmentAmount, req.Category, req.Group,
			req.PaymentMethod, installmentDate, userID, req.AccountID,
			i, req.Installments, firstID,
		)
		if err != nil {
			http.Error(w, "Erro ao inserir parcela", http.StatusInternalServerError)
			fmt.Println("Erro parcela:", err)
			return
		}
	}

	// Atualiza saldo apenas para compras à vista (parcela única)
	if req.Installments == 1 && req.AccountID != nil {
		_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`,
			req.Amount, req.AccountID, userID)
		if err != nil {
			http.Error(w, "Erro ao atualizar saldo da conta", http.StatusInternalServerError)
			return
		}
	}

	if err = tx.Commit(); err != nil {
		http.Error(w, "Erro ao confirmar transação", http.StatusInternalServerError)
		return
	}

	expense := models.Expense{
		ID:                firstID,
		Description:       req.Description,
		Amount:            installmentAmount,
		Category:          req.Category,
		Group:             req.Group,
		PaymentMethod:     req.PaymentMethod,
		Date:              expenseDate,
		AccountID:         req.AccountID,
		InstallmentNumber: 1,
		InstallmentTotal:  req.Installments,
		InstallmentGroupID: &firstID,
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
	allInstallments := r.URL.Query().Get("all_installments") == "true"

	baseQuery := `SELECT id, description, amount, category, "group", payment_method, date, account_id, installment_number, installment_total, installment_group_id FROM expenses WHERE user_id = $1`
	args := []interface{}{userID}

	if allInstallments {
		// Retorna apenas gastos parcelados, sem filtro de mês
		baseQuery += " AND installment_total > 1"
	} else {
		if monthParam != "" && yearParam != "" {
			monthVal, _ := strconv.Atoi(monthParam)
			yearVal, _ := strconv.Atoi(yearParam)
			// Usa range de datas explícito para evitar ambiguidade com a coluna "date"
			baseQuery += " AND date >= MAKE_DATE($" + strconv.Itoa(len(args)+1) + ", $" + strconv.Itoa(len(args)+2) + ", 1)"
			baseQuery += " AND date < MAKE_DATE($" + strconv.Itoa(len(args)+1) + ", $" + strconv.Itoa(len(args)+2) + ", 1) + INTERVAL '1 month'"
			args = append(args, yearVal, monthVal)
		} else if monthParam != "" {
			baseQuery += " AND EXTRACT(MONTH FROM date) = $" + strconv.Itoa(len(args)+1)
			monthVal, _ := strconv.Atoi(monthParam)
			args = append(args, monthVal)
		} else if yearParam != "" {
			baseQuery += " AND EXTRACT(YEAR FROM date) = $" + strconv.Itoa(len(args)+1)
			yearVal, _ := strconv.Atoi(yearParam)
			args = append(args, yearVal)
		}
	}

	baseQuery += " ORDER BY date ASC"

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
		err := rows.Scan(
			&expense.ID, &expense.Description, &expense.Amount, &expense.Category,
			&expense.Group, &expense.PaymentMethod, &expense.Date, &expense.AccountID,
			&expense.InstallmentNumber, &expense.InstallmentTotal, &expense.InstallmentGroupID,
		)
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

	if strings.TrimSpace(req.Group) == "" {
		req.Group = "essencial"
	}
	switch req.Group {
	case "essencial", "lazer", "investimento":
	default:
		req.Group = "essencial"
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var oldAmount float64
	var oldAccountID *int64
	var installmentTotal int
	err = tx.QueryRow(`SELECT amount, account_id, installment_total FROM expenses WHERE id = $1 AND user_id = $2`, id, userID).Scan(&oldAmount, &oldAccountID, &installmentTotal)
	if err != nil {
		http.Error(w, "Erro ao buscar gasto", http.StatusInternalServerError)
		return
	}

	query := `UPDATE expenses SET description = $1, amount = $2, category = $3, "group" = $4, payment_method = $5, date = $6, account_id = $7 WHERE id = $8 AND user_id = $9`
	_, err = tx.Exec(query, req.Description, req.Amount, req.Category, req.Group, req.PaymentMethod, expenseDate, req.AccountID, id, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar gasto", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	// Ajusta saldo apenas para gastos à vista
	if installmentTotal == 1 {
		if oldAccountID != nil {
			_, err = tx.Exec(`UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, oldAmount, oldAccountID, userID)
			if err != nil {
				http.Error(w, "Erro ao reverter saldo da conta antiga", http.StatusInternalServerError)
				return
			}
		}
		if req.AccountID != nil {
			_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, req.Amount, req.AccountID, userID)
			if err != nil {
				http.Error(w, "Erro ao atualizar saldo da nova conta", http.StatusInternalServerError)
				return
			}
		}
	}

	if err = tx.Commit(); err != nil {
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

	deleteGroup := r.URL.Query().Get("delete_group") == "true"
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var amount float64
	var accountID *int64
	var installmentTotal int
	var installmentGroupID *int64
	err = tx.QueryRow(`SELECT amount, account_id, installment_total, installment_group_id FROM expenses WHERE id = $1 AND user_id = $2`, id, userID).Scan(&amount, &accountID, &installmentTotal, &installmentGroupID)
	if err != nil {
		http.Error(w, "Erro ao buscar gasto", http.StatusInternalServerError)
		return
	}

	if deleteGroup && installmentGroupID != nil {
		// Deleta todas as parcelas do grupo
		_, err = tx.Exec(`DELETE FROM expenses WHERE installment_group_id = $1 AND user_id = $2`, installmentGroupID, userID)
		if err != nil {
			http.Error(w, "Erro ao deletar parcelas", http.StatusInternalServerError)
			return
		}
	} else {
		_, err = tx.Exec(`DELETE FROM expenses WHERE id = $1 AND user_id = $2`, id, userID)
		if err != nil {
			http.Error(w, "Erro ao deletar gasto", http.StatusInternalServerError)
			return
		}
		// Restaura saldo apenas para gastos à vista
		if installmentTotal == 1 && accountID != nil {
			_, err = tx.Exec(`UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, amount, accountID, userID)
			if err != nil {
				http.Error(w, "Erro ao restaurar saldo da conta", http.StatusInternalServerError)
				return
			}
		}
	}

	if err = tx.Commit(); err != nil {
		http.Error(w, "Erro ao confirmar transação", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
