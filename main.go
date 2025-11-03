package main

import (
	"fmt"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/database"
	"github.com/edgar-lins/controle-financeiro/internal/handlers"
)

func main() {
	db := database.Connect()
	defer db.Close()

	expenseHandler := handlers.ExpenseHandler{DB: db}

	http.HandleFunc("/expenses", expenseHandler.CreateExpense)

	fmt.Println("Servidor iniciado em http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
