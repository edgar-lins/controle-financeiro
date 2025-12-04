package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
	"github.com/edgar-lins/controle-financeiro/internal/models"
)

// GetUserPreferences retorna as preferências do usuário autenticado
func GetUserPreferences(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIDVal := r.Context().Value(middleware.UserIDKey)
		if userIDVal == nil {
			http.Error(w, "Erro ao obter userID do contexto", http.StatusInternalServerError)
			return
		}
		userID, ok := userIDVal.(int)
		if !ok {
			http.Error(w, "Erro ao converter userID para int", http.StatusInternalServerError)
			return
		}

		var prefs models.UserPreferences
		err := db.QueryRow(
			"SELECT id, user_id, expenses_percent, entertainment_percent, investment_percent, created_at, updated_at FROM user_preferences WHERE user_id = $1",
			userID,
		).Scan(&prefs.ID, &prefs.UserID, &prefs.ExpensesPercent, &prefs.EntertainmentPercent, &prefs.InvestmentPercent, &prefs.CreatedAt, &prefs.UpdatedAt)

		if err == sql.ErrNoRows {
			// Se não existir, retorna os valores padrão
			prefs = models.UserPreferences{
				UserID:               userID,
				ExpensesPercent:      50.0,
				EntertainmentPercent: 30.0,
				InvestmentPercent:    20.0,
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(prefs)
			return
		}

		if err != nil {
			http.Error(w, "Erro ao buscar preferências", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(prefs)
	}
}

// UpdateUserPreferences atualiza as preferências do usuário autenticado
func UpdateUserPreferences(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIDVal := r.Context().Value(middleware.UserIDKey)
		if userIDVal == nil {
			http.Error(w, "Erro ao obter userID do contexto", http.StatusInternalServerError)
			return
		}
		userID, ok := userIDVal.(int)
		if !ok {
			http.Error(w, "Erro ao converter userID para int", http.StatusInternalServerError)
			return
		}

		var req struct {
			ExpensesPercent      float64 `json:"expenses_percent"`
			EntertainmentPercent float64 `json:"entertainment_percent"`
			InvestmentPercent    float64 `json:"investment_percent"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Validação: total não pode passar de 100%
		total := req.ExpensesPercent + req.EntertainmentPercent + req.InvestmentPercent
		if total < 99.9 || total > 100.1 {
			http.Error(w, "Total deve ser 100%, atual: "+strconv.FormatFloat(total, 'f', 2, 64)+"%", http.StatusBadRequest)
			return
		}

		// Validação: nenhum valor pode ser negativo
		if req.ExpensesPercent < 0 || req.EntertainmentPercent < 0 || req.InvestmentPercent < 0 {
			http.Error(w, "Valores não podem ser negativos", http.StatusBadRequest)
			return
		}

		// Tenta fazer UPDATE, se não existir faz INSERT
		result, err := db.Exec(
			`UPDATE user_preferences 
			 SET expenses_percent = $1, entertainment_percent = $2, investment_percent = $3, updated_at = NOW()
			 WHERE user_id = $4`,
			req.ExpensesPercent, req.EntertainmentPercent, req.InvestmentPercent, userID,
		)

		if err != nil {
			http.Error(w, "Erro ao atualizar preferências", http.StatusInternalServerError)
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "Erro ao atualizar preferências", http.StatusInternalServerError)
			return
		}

		// Se não atualizou nada, faz INSERT
		if rowsAffected == 0 {
			_, err := db.Exec(
				`INSERT INTO user_preferences (user_id, expenses_percent, entertainment_percent, investment_percent)
				 VALUES ($1, $2, $3, $4)`,
				userID, req.ExpensesPercent, req.EntertainmentPercent, req.InvestmentPercent,
			)

			if err != nil {
				http.Error(w, "Erro ao criar preferências", http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":               "Preferências atualizadas com sucesso",
			"expenses_percent":      req.ExpensesPercent,
			"entertainment_percent": req.EntertainmentPercent,
			"investment_percent":    req.InvestmentPercent,
		})
	}
}
