package routes

import (
	"database/sql"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/handlers"
)

func SetupRoutes(db *sql.DB) {
	expenseHandler := handlers.ExpenseHandler{DB: db}
	summaryHandler := handlers.SummaryHandler{DB: db}
	incomeHandler := handlers.IncomeHandler{DB: db}

	http.HandleFunc("/expenses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			expenseHandler.CreateExpense(w, r)
		} else if r.Method == http.MethodGet {
			expenseHandler.GetExpenses(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/incomes", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			incomeHandler.CreateIncome(w, r)
		} else if r.Method == http.MethodGet {
			incomeHandler.GetIncomes(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/summary", summaryHandler.GetSummary)
	http.HandleFunc("/expenses/delete", expenseHandler.DeleteExpense)
	http.HandleFunc("/incomes/delete", incomeHandler.DeleteIncome)

}
