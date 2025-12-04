package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
	"github.com/edgar-lins/controle-financeiro/internal/models"
)

type GoalHandler struct {
	DB *sql.DB
}

func (h *GoalHandler) CreateGoal(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	var goalReq struct {
		Name          string  `json:"name"`
		TargetAmount  float64 `json:"target_amount"`
		CurrentAmount float64 `json:"current_amount"`
		Deadline      string  `json:"deadline"`
	}
	if err := json.NewDecoder(r.Body).Decode(&goalReq); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	var deadline *time.Time
	if goalReq.Deadline != "" {
		parsedDate, err := time.Parse("2006-01-02", goalReq.Deadline)
		if err != nil {
			http.Error(w, "Formato de data inválido", http.StatusBadRequest)
			return
		}
		deadline = &parsedDate
	}

	goal := models.Goal{
		Name:          goalReq.Name,
		TargetAmount:  goalReq.TargetAmount,
		CurrentAmount: goalReq.CurrentAmount,
		Deadline:      deadline,
	}

	query := `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err := h.DB.QueryRow(query, userID, goal.Name, goal.TargetAmount, goal.CurrentAmount, goal.Deadline).Scan(&goal.ID, &goal.CreatedAt)
	if err != nil {
		http.Error(w, "Erro ao criar meta", http.StatusInternalServerError)
		return
	}

	goal.UserID = userID
	if goal.TargetAmount > 0 {
		goal.Progress = (goal.CurrentAmount / goal.TargetAmount) * 100
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(goal)
}

func (h *GoalHandler) GetGoals(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	rows, err := h.DB.Query(`
		SELECT id, name, target_amount, current_amount, deadline, created_at, completed_at 
		FROM goals 
		WHERE user_id = $1 
		ORDER BY completed_at NULLS FIRST, created_at DESC
	`, userID)
	if err != nil {
		http.Error(w, "Erro ao buscar metas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	goals := []models.Goal{}
	for rows.Next() {
		var goal models.Goal
		if err := rows.Scan(&goal.ID, &goal.Name, &goal.TargetAmount, &goal.CurrentAmount, &goal.Deadline, &goal.CreatedAt, &goal.CompletedAt); err != nil {
			http.Error(w, "Erro ao ler metas", http.StatusInternalServerError)
			return
		}
		goal.UserID = userID
		if goal.TargetAmount > 0 {
			goal.Progress = (goal.CurrentAmount / goal.TargetAmount) * 100
			if goal.Progress > 100 {
				goal.Progress = 100
			}
		}
		goals = append(goals, goal)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(goals)
}

func (h *GoalHandler) UpdateGoal(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	id := r.URL.Query().Get("id")

	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	var goalReq struct {
		Name          string  `json:"name"`
		TargetAmount  float64 `json:"target_amount"`
		CurrentAmount float64 `json:"current_amount"`
		Deadline      string  `json:"deadline"`
	}
	if err := json.NewDecoder(r.Body).Decode(&goalReq); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	var deadline *time.Time
	if goalReq.Deadline != "" {
		parsedDate, err := time.Parse("2006-01-02", goalReq.Deadline)
		if err != nil {
			http.Error(w, "Formato de data inválido", http.StatusBadRequest)
			return
		}
		deadline = &parsedDate
	}

	// Mark as completed if reached target
	var completedAt *time.Time
	if goalReq.CurrentAmount >= goalReq.TargetAmount {
		now := time.Now()
		completedAt = &now
	}

	_, err := h.DB.Exec(`
		UPDATE goals 
		SET name = $1, target_amount = $2, current_amount = $3, deadline = $4, completed_at = $5
		WHERE id = $6 AND user_id = $7
	`, goalReq.Name, goalReq.TargetAmount, goalReq.CurrentAmount, deadline, completedAt, id, userID)

	if err != nil {
		http.Error(w, "Erro ao atualizar meta", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Meta atualizada com sucesso"}`))
}

func (h *GoalHandler) AddMoneyToGoal(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	id := r.URL.Query().Get("id")

	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	var req struct {
		Amount    float64 `json:"amount"`
		AccountID int64   `json:"account_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar transação", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Get current goal data
	var currentAmount, targetAmount float64
	err = tx.QueryRow(`SELECT current_amount, target_amount FROM goals WHERE id = $1 AND user_id = $2`, id, userID).Scan(&currentAmount, &targetAmount)
	if err != nil {
		http.Error(w, "Erro ao buscar meta", http.StatusInternalServerError)
		return
	}

	// Update goal current_amount
	newCurrentAmount := currentAmount + req.Amount
	var completedAt *time.Time
	if newCurrentAmount >= targetAmount {
		now := time.Now()
		completedAt = &now
	}

	_, err = tx.Exec(`UPDATE goals SET current_amount = $1, completed_at = $2 WHERE id = $3 AND user_id = $4`, newCurrentAmount, completedAt, id, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar meta", http.StatusInternalServerError)
		return
	}

	// Deduct from account balance
	_, err = tx.Exec(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, req.Amount, req.AccountID, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar saldo da conta", http.StatusInternalServerError)
		return
	}

	err = tx.Commit()
	if err != nil {
		http.Error(w, "Erro ao confirmar transação", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Valor adicionado com sucesso"}`))
}

func (h *GoalHandler) DeleteGoal(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)
	id := r.URL.Query().Get("id")

	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec(`DELETE FROM goals WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		http.Error(w, "Erro ao deletar meta", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
