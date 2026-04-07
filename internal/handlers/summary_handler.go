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
	Mes             string  `json:"mes"`
	Ano             int     `json:"ano"`
	RendaTotal      float64 `json:"renda_total"`
	GastoTotal      float64 `json:"gasto_total"`
	IdealFixos      float64 `json:"ideal_fixos"`
	IdealLazer      float64 `json:"ideal_lazer"`
	IdealInvest     float64 `json:"ideal_invest"`
	RealFixos       float64 `json:"real_fixos"`
	RealLazer       float64 `json:"real_lazer"`
	RealInvest      float64 `json:"real_invest"`
	SaldoRestante   float64 `json:"saldo_restante"`
	PatrimonioTotal float64 `json:"patrimonio_total"`
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

	// 🔹 Busca gastos por grupo (50/30/20) usando o campo group
	var realFixos, realLazer, realInvest float64

	// Essenciais (50%)
	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE "group" = 'essencial'
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realFixos)

	// Lazer (30%)
	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE "group" = 'lazer'
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realLazer)

	// Investimento (20%)
	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE "group" = 'investimento'
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

	// Calcular patrimônio total (soma de TODAS as contas)
	var patrimonioTotal float64
	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(balance), 0)
		FROM accounts
		WHERE user_id = $1
	`, userID).Scan(&patrimonioTotal)
	if err != nil {
		fmt.Println("Erro ao calcular patrimônio total:", err)
	}

	// Saldo disponível = apenas contas corrente (cartão é dívida, não saldo)
	var saldoRestante float64
	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(balance), 0)
		FROM accounts
		WHERE user_id = $1 AND type = 'corrente'
	`, userID).Scan(&saldoRestante)
	if err != nil {
		fmt.Println("Erro ao calcular saldo restante:", err)
	}

	mesNames := [...]string{"", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"}
	mesName := mesNames[month]

	summary := Summary{
		Mes:             mesName,
		Ano:             year,
		RendaTotal:      totalIncome,
		GastoTotal:      totalExpenses,
		IdealFixos:      totalIncome * (expensesPercent / 100),
		IdealLazer:      totalIncome * (entertainmentPercent / 100),
		IdealInvest:     totalIncome * (investmentPercent / 100),
		RealFixos:       realFixos,
		RealLazer:       realLazer,
		RealInvest:      realInvest,
		SaldoRestante:   saldoRestante,
		PatrimonioTotal: patrimonioTotal,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

type CategoryBreakdown struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

type GroupBreakdown struct {
	Group      string              `json:"group"`
	Total      float64             `json:"total"`
	Categories []CategoryBreakdown `json:"categories"`
}

func (h *SummaryHandler) GetExpenseBreakdown(w http.ResponseWriter, r *http.Request) {
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

	rows, err := h.DB.Query(`
		SELECT "group", category, COALESCE(SUM(amount), 0) as total
		FROM expenses
		WHERE EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
		GROUP BY "group", category
		ORDER BY "group", total DESC
	`, month, year, userID)

	if err != nil {
		http.Error(w, "Erro ao buscar breakdown", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}
	defer rows.Close()

	groupMap := make(map[string]*GroupBreakdown)

	for rows.Next() {
		var group, category string
		var amount float64

		if err := rows.Scan(&group, &category, &amount); err != nil {
			continue
		}

		if groupMap[group] == nil {
			groupMap[group] = &GroupBreakdown{
				Group:      group,
				Total:      0,
				Categories: []CategoryBreakdown{},
			}
		}

		groupMap[group].Total += amount
		groupMap[group].Categories = append(groupMap[group].Categories, CategoryBreakdown{
			Category: category,
			Amount:   amount,
		})
	}

	result := []GroupBreakdown{}
	for _, gb := range groupMap {
		result = append(result, *gb)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
