package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
)

type SummaryHandler struct {
	DB *sql.DB
}

type Summary struct {
	Mes           string  `json:"mes"`
	Ano           int     `json:"ano"`
	RendaTotal    float64 `json:"renda_total"`
	GastoTotal    float64 `json:"gasto_total"`
	IdealFixos    float64 `json:"ideal_fixos"`
	IdealLazer    float64 `json:"ideal_lazer"`
	IdealInvest   float64 `json:"ideal_invest"`
	RealFixos     float64 `json:"real_fixos"`
	RealLazer     float64 `json:"real_lazer"`
	RealInvest    float64 `json:"real_invest"`
	SaldoRestante float64 `json:"saldo_restante"`
}

type MonthlyData struct {
	Month    string  `json:"month"`
	Year     int     `json:"year"`
	Income   float64 `json:"income"`
	Expenses float64 `json:"expenses"`
	Balance  float64 `json:"balance"`
	MonthNum int     `json:"month_num"`
}

func (h *SummaryHandler) GetMonthlyHistory(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	// Get last 12 months
	var monthlyData []MonthlyData
	now := time.Now()

	for i := 11; i >= 0; i-- {
		currentMonth := now.AddDate(0, -i, 0)
		month := int(currentMonth.Month())
		year := currentMonth.Year()

		var income, expenses float64

		h.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM incomes
			WHERE EXTRACT(MONTH FROM date) = $1
			AND EXTRACT(YEAR FROM date) = $2
			AND user_id = $3
		`, month, year, userID).Scan(&income)

		h.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM expenses
			WHERE EXTRACT(MONTH FROM date) = $1
			AND EXTRACT(YEAR FROM date) = $2
			AND user_id = $3
		`, month, year, userID).Scan(&expenses)

		monthlyData = append(monthlyData, MonthlyData{
			Month:    currentMonth.Format("Jan"),
			Year:     year,
			Income:   income,
			Expenses: expenses,
			Balance:  income - expenses,
			MonthNum: month,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(monthlyData)
}

func (h *SummaryHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	monthParam := r.URL.Query().Get("month")
	yearParam := r.URL.Query().Get("year")
	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	month := int(now.Month())
	year := now.Year()

	if monthParam != "" {
		if m, err := strconv.Atoi(monthParam); err == nil {
			month = m
		}
	}

	if yearParam != "" {
		if y, err := strconv.Atoi(yearParam); err == nil {
			year = y
		}
	}

	var totalIncome float64
	err := h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM incomes
		WHERE month = $1 AND year = $2 AND user_id = $3
	`, month, year, userID).Scan(&totalIncome)
	if err != nil {
		http.Error(w, "Erro ao calcular renda", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	var totalExpenses float64
	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE EXTRACT(MONTH FROM date) = $1
			AND EXTRACT(YEAR FROM date) = $2
			AND user_id = $3
	`, month, year, userID).Scan(&totalExpenses)
	if err != nil {
		http.Error(w, "Erro ao calcular gastos", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	// 🔹 Busca gastos por categoria (aceitando variações de texto)
	var realFixos, realLazer, realInvest float64

	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE (
			category ILIKE '%fix%' OR
			category ILIKE '%alug%' OR
			category ILIKE '%conta%' OR
			category ILIKE '%moradia%'
		)
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realFixos)

	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE (
			category ILIKE '%lazer%' OR
			category ILIKE '%divers%' OR
			category ILIKE '%entreten%'
		)
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realLazer)

	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE (
			category ILIKE '%invest%' OR
			category ILIKE '%poup%' OR
			category ILIKE '%reserva%'
		)
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realInvest)

	// Buscar preferências do usuário
	var expensesPercent, entertainmentPercent, investmentPercent float64
	expensesPercent, entertainmentPercent, investmentPercent = 50, 30, 20 // padrão

	err = h.DB.QueryRow(`
		SELECT expenses_percent, entertainment_percent, investment_percent
		FROM user_preferences
		WHERE user_id = $1
	`, userID).Scan(&expensesPercent, &entertainmentPercent, &investmentPercent)

	// Se não encontrar preferências, usa valores padrão (já definidos acima)
	if err != nil && err != sql.ErrNoRows {
		fmt.Println("Erro ao buscar preferências:", err)
	}

	summary := Summary{
		Mes:           now.Month().String(),
		Ano:           year,
		RendaTotal:    totalIncome,
		GastoTotal:    totalExpenses,
		IdealFixos:    totalIncome * (expensesPercent / 100),
		IdealLazer:    totalIncome * (entertainmentPercent / 100),
		IdealInvest:   totalIncome * (investmentPercent / 100),
		RealFixos:     realFixos,
		RealLazer:     realLazer,
		RealInvest:    realInvest,
		SaldoRestante: totalIncome - (realFixos + realLazer + realInvest),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}
