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

	auth := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.WithAuth(db, next)
	}

	// Auth endpoints (public)
	http.HandleFunc("/auth/signup", authHandler.Signup)
	http.HandleFunc("/auth/login", authHandler.Login)
	http.HandleFunc("/auth/forgot-password", authHandler.ForgotPassword)
	http.HandleFunc("/auth/reset-password", authHandler.ResetPassword)
	http.HandleFunc("/auth/delete-account", auth(authHandler.DeleteAccount))

	http.HandleFunc("/expenses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			auth(expenseHandler.CreateExpense)(w, r)
		} else if r.Method == http.MethodGet {
			auth(expenseHandler.GetExpenses)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/incomes", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			auth(incomeHandler.CreateIncome)(w, r)
		} else if r.Method == http.MethodGet {
			auth(incomeHandler.GetIncomes)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/summary", auth(summaryHandler.GetSummary))
	http.HandleFunc("/summary/history", auth(summaryHandler.GetMonthlyHistory))
	http.HandleFunc("/summary/breakdown", auth(summaryHandler.GetExpenseBreakdown))
	http.HandleFunc("/expenses/delete", auth(expenseHandler.DeleteExpense))
	http.HandleFunc("/expenses/update", auth(expenseHandler.UpdateExpense))
	http.HandleFunc("/expenses/recurring-pending", auth(expenseHandler.GetRecurringPending))
	http.HandleFunc("/expenses/confirm-recurring", auth(expenseHandler.ConfirmRecurring))
	http.HandleFunc("/incomes/delete", auth(incomeHandler.DeleteIncome))
	http.HandleFunc("/incomes/update", auth(incomeHandler.UpdateIncome))

	// Premium features - Accounts
	http.HandleFunc("/accounts", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			auth(accountHandler.CreateAccount)(w, r)
		} else if r.Method == http.MethodGet {
			auth(accountHandler.GetAccounts)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})
	http.HandleFunc("/accounts/transfer", auth(accountHandler.TransferFunds))
	http.HandleFunc("/accounts/delete", auth(accountHandler.DeleteAccount))
	http.HandleFunc("/accounts/update", auth(accountHandler.UpdateAccount))

	// Premium features - Goals
	http.HandleFunc("/goals", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			auth(goalHandler.CreateGoal)(w, r)
		} else if r.Method == http.MethodGet {
			auth(goalHandler.GetGoals)(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})
	http.HandleFunc("/goals/delete", auth(goalHandler.DeleteGoal))
	http.HandleFunc("/goals/update", auth(goalHandler.UpdateGoal))
	http.HandleFunc("/goals/add-money", auth(goalHandler.AddMoneyToGoal))

	// User Preferences
	http.HandleFunc("/preferences", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			auth(handlers.GetUserPreferences(db))(w, r)
		} else if r.Method == http.MethodPut {
			auth(handlers.UpdateUserPreferences(db))(w, r)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	// Migration endpoints
	http.HandleFunc("/migration/check", auth(migrationHandler.CheckUnlinkedTransactions))
	http.HandleFunc("/migration/migrate", auth(migrationHandler.MigrateUnlinkedTransactions))
}
