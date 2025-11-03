package routes

import (
	"database/sql"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/handlers"
)

func SetupRoutes(db *sql.DB) {
	expenseHandler := handlers.ExpenseHandler{DB: db}
	summaryHandler := handlers.SummaryHandler{DB: db}

	http.HandleFunc("/expenses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			expenseHandler.CreateExpense(w, r)
		} else if r.Method == http.MethodGet {
			expenseHandler.GetExpenses(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/summary", summaryHandler.GetSummary)
}
