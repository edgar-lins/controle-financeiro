package routes

import (
	"database/sql"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/handlers"
	"github.com/edgar-lins/controle-financeiro/internal/middleware"
)

func SetupRoutes(db *sql.DB) {
	expenseHandler := handlers.ExpenseHandler{DB: db}
	summaryHandler := handlers.SummaryHandler{DB: db}
	incomeHandler := handlers.IncomeHandler{DB: db}
	authHandler := handlers.AuthHandler{DB: db}

	// Auth endpoints (public)
	http.HandleFunc("/auth/signup", authHandler.Signup)
	http.HandleFunc("/auth/login", authHandler.Login)

	http.HandleFunc("/expenses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.WithAuth(expenseHandler.CreateExpense)(w, r)
		} else if r.Method == http.MethodGet {
			middleware.WithAuth(expenseHandler.GetExpenses)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/incomes", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.WithAuth(incomeHandler.CreateIncome)(w, r)
		} else if r.Method == http.MethodGet {
			middleware.WithAuth(incomeHandler.GetIncomes)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/summary", middleware.WithAuth(summaryHandler.GetSummary))
	http.HandleFunc("/expenses/delete", middleware.WithAuth(expenseHandler.DeleteExpense))
	http.HandleFunc("/incomes/delete", middleware.WithAuth(incomeHandler.DeleteIncome))

}
