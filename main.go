package main

import (
	"fmt"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/database"
)

func main() {
	db := database.Connect()
	defer db.Close()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Servidor Go do Controle Financeiro rodando 🚀")
	})

	fmt.Println("Servidor iniciado em http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
