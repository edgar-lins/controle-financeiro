package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type SummaryHandler struct {
	DB *sql.DB
}

type Summary struct {
	TotalGasto   float64 `json:"total_gasto"`
	Investimento float64 `json:"investimento"`
	GastosFixos  float64 `json:"gastos_fixos"`
	LazerDesejos float64 `json:"lazer_desejos"`
}

func (h *SummaryHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var total float64
	err := h.DB.QueryRow(`SELECT COALESCE(SUM(amount), 0) FROM expenses`).Scan(&total)
	if err != nil {
		http.Error(w, "Erro ao calcular resumo", http.StatusInternalServerError)
		fmt.Println("Erro:", err)
		return
	}

	summary := Summary{
		TotalGasto:   total,
		Investimento: total * 0.20,
		GastosFixos:  total * 0.50,
		LazerDesejos: total * 0.30,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}
