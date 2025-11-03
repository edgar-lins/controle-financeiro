package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

type SummaryHandler struct {
	DB *sql.DB
}

type Summary struct {
	Mes         string  `json:"mes"`
	Ano         int     `json:"ano"`
	RendaTotal  float64 `json:"renda_total"`
	GastoTotal  float64 `json:"gasto_total"`
	IdealFixos  float64 `json:"ideal_fixos"`
	IdealLazer  float64 `json:"ideal_lazer"`
	IdealInvest float64 `json:"ideal_invest"`
	RealFixos   float64 `json:"real_fixos"`
	RealLazer   float64 `json:"real_lazer"`
	RealInvest  float64 `json:"real_invest"`
}

func (h *SummaryHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	monthParam := r.URL.Query().Get("month")
	yearParam := r.URL.Query().Get("year")

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
		WHERE month = $1 AND year = $2
	`, month, year).Scan(&totalIncome)
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
	`, month, year).Scan(&totalExpenses)
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
	`, month, year).Scan(&realFixos)

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
	`, month, year).Scan(&realLazer)

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
	`, month, year).Scan(&realInvest)

	summary := Summary{
		Mes:         now.Month().String(),
		Ano:         year,
		RendaTotal:  totalIncome,
		GastoTotal:  totalExpenses,
		IdealFixos:  totalIncome * 0.5,
		IdealLazer:  totalIncome * 0.3,
		IdealInvest: totalIncome * 0.2,
		RealFixos:   realFixos,
		RealLazer:   realLazer,
		RealInvest:  realInvest,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}
