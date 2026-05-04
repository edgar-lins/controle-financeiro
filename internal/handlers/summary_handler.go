package handlers

import (
	"database/sql"
	"encoding/json"
	"log/slog"
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
	Salario         float64 `json:"salario"`      // salário fixo das preferências
	RendaExtra      float64 `json:"renda_extra"`  // rendas extras registradas no mês
	RendaTotal      float64 `json:"renda_total"`  // salario + renda_extra
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

	now := time.Now()
	cutoff := now.AddDate(0, -11, 0)
	cutoffDate := time.Date(cutoff.Year(), cutoff.Month(), 1, 0, 0, 0, 0, time.UTC)

	incomeMap := make(map[[2]int]float64)
	incomeRows, err := h.DB.Query(`
		SELECT EXTRACT(YEAR FROM date)::int, EXTRACT(MONTH FROM date)::int, COALESCE(SUM(amount), 0)
		FROM incomes
		WHERE user_id = $1 AND date >= $2
		GROUP BY 1, 2
	`, userID, cutoffDate)
	if err != nil {
		slog.Error("erro ao buscar histórico de rendas", "error", err, "userID", userID)
		http.Error(w, "Erro ao buscar histórico de rendas", http.StatusInternalServerError)
		return
	}
	defer incomeRows.Close()
	for incomeRows.Next() {
		var y, m int
		var total float64
		incomeRows.Scan(&y, &m, &total)
		incomeMap[[2]int{y, m}] = total
	}

	expenseMap := make(map[[2]int]float64)
	expenseRows, err := h.DB.Query(`
		SELECT EXTRACT(YEAR FROM date)::int, EXTRACT(MONTH FROM date)::int, COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE user_id = $1 AND date >= $2
		GROUP BY 1, 2
	`, userID, cutoffDate)
	if err != nil {
		slog.Error("erro ao buscar histórico de despesas", "error", err, "userID", userID)
		http.Error(w, "Erro ao buscar histórico de despesas", http.StatusInternalServerError)
		return
	}
	defer expenseRows.Close()
	for expenseRows.Next() {
		var y, m int
		var total float64
		expenseRows.Scan(&y, &m, &total)
		expenseMap[[2]int{y, m}] = total
	}

	monthlyData := make([]MonthlyData, 0, 12)
	for i := 11; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		y, m := t.Year(), int(t.Month())
		key := [2]int{y, m}
		income := incomeMap[key]
		expenses := expenseMap[key]
		monthlyData = append(monthlyData, MonthlyData{
			Month:    t.Format("Jan"),
			Year:     y,
			Income:   income,
			Expenses: expenses,
			Balance:  income - expenses,
			MonthNum: m,
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
		WHERE EXTRACT(MONTH FROM date) = $1
			AND EXTRACT(YEAR FROM date) = $2
			AND user_id = $3
	`, month, year, userID).Scan(&totalIncome)
	if err != nil {
		slog.Error("erro ao calcular renda total", "error", err, "userID", userID, "month", month, "year", year)
		http.Error(w, "Erro ao calcular renda", http.StatusInternalServerError)
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
		slog.Error("erro ao calcular gastos totais", "error", err, "userID", userID, "month", month, "year", year)
		http.Error(w, "Erro ao calcular gastos", http.StatusInternalServerError)
		return
	}

	var realFixos, realLazer, realInvest float64

	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE "group" = 'essencial'
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realFixos)

	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE "group" = 'lazer'
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realLazer)

	h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE "group" = 'investimento'
		AND EXTRACT(MONTH FROM date) = $1
		AND EXTRACT(YEAR FROM date) = $2
		AND user_id = $3
	`, month, year, userID).Scan(&realInvest)

	var expensesPercent, entertainmentPercent, investmentPercent, expectedMonthlyIncome float64
	expensesPercent, entertainmentPercent, investmentPercent = 50, 30, 20

	err = h.DB.QueryRow(`
		SELECT expenses_percent, entertainment_percent, investment_percent, expected_monthly_income
		FROM user_preferences
		WHERE user_id = $1
	`, userID).Scan(&expensesPercent, &entertainmentPercent, &investmentPercent, &expectedMonthlyIncome)
	if err != nil && err != sql.ErrNoRows {
		slog.Warn("erro ao buscar preferências do usuário", "error", err, "userID", userID)
	}

	// Salário fixo (preferências) + extras registrados no mês = base total do orçamento
	incomeBase := expectedMonthlyIncome + totalIncome

	var patrimonioTotal float64
	if err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(balance), 0)
		FROM accounts
		WHERE user_id = $1
	`, userID).Scan(&patrimonioTotal); err != nil {
		slog.Warn("erro ao calcular patrimônio total", "error", err, "userID", userID)
	}

	var saldoRestante float64
	if err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(balance), 0)
		FROM accounts
		WHERE user_id = $1 AND type = 'corrente'
	`, userID).Scan(&saldoRestante); err != nil {
		slog.Warn("erro ao calcular saldo restante", "error", err, "userID", userID)
	}

	mesNames := [...]string{"", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"}
	mesName := mesNames[month]

	summary := Summary{
		Mes:             mesName,
		Ano:             year,
		Salario:         expectedMonthlyIncome,
		RendaExtra:      totalIncome,
		RendaTotal:      incomeBase,
		GastoTotal:      totalExpenses,
		IdealFixos:      incomeBase * (expensesPercent / 100),
		IdealLazer:      incomeBase * (entertainmentPercent / 100),
		IdealInvest:     incomeBase * (investmentPercent / 100),
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
		slog.Error("erro ao buscar breakdown de despesas", "error", err, "userID", userID)
		http.Error(w, "Erro ao buscar breakdown", http.StatusInternalServerError)
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
