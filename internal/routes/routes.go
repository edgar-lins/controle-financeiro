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
	accountHandler := handlers.AccountHandler{DB: db}
	goalHandler := handlers.GoalHandler{DB: db}
	migrationHandler := handlers.MigrationHandler{DB: db}

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
	http.HandleFunc("/summary/history", middleware.WithAuth(summaryHandler.GetMonthlyHistory))
	http.HandleFunc("/expenses/delete", middleware.WithAuth(expenseHandler.DeleteExpense))
	http.HandleFunc("/expenses/update", middleware.WithAuth(expenseHandler.UpdateExpense))
	http.HandleFunc("/incomes/delete", middleware.WithAuth(incomeHandler.DeleteIncome))
	http.HandleFunc("/incomes/update", middleware.WithAuth(incomeHandler.UpdateIncome))

	// Premium features - Accounts
	http.HandleFunc("/accounts", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.WithAuth(accountHandler.CreateAccount)(w, r)
		} else if r.Method == http.MethodGet {
			middleware.WithAuth(accountHandler.GetAccounts)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})
	http.HandleFunc("/accounts/transfer", middleware.WithAuth(accountHandler.TransferFunds))
	http.HandleFunc("/accounts/delete", middleware.WithAuth(accountHandler.DeleteAccount))
	http.HandleFunc("/accounts/update", middleware.WithAuth(accountHandler.UpdateAccount))

	// Premium features - Goals
	http.HandleFunc("/goals", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.WithAuth(goalHandler.CreateGoal)(w, r)
		} else if r.Method == http.MethodGet {
			middleware.WithAuth(goalHandler.GetGoals)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})
	http.HandleFunc("/goals/delete", middleware.WithAuth(goalHandler.DeleteGoal))
	http.HandleFunc("/goals/update", middleware.WithAuth(goalHandler.UpdateGoal))
	http.HandleFunc("/goals/add-money", middleware.WithAuth(goalHandler.AddMoneyToGoal))

	// User Preferences
	http.HandleFunc("/preferences", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			middleware.WithAuth(handlers.GetUserPreferences(db))(w, r)
		} else if r.Method == http.MethodPut {
			middleware.WithAuth(handlers.UpdateUserPreferences(db))(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	// Migration endpoints
	http.HandleFunc("/migration/check", middleware.WithAuth(migrationHandler.CheckUnlinkedTransactions))
	http.HandleFunc("/migration/migrate", middleware.WithAuth(migrationHandler.MigrateUnlinkedTransactions))

}
