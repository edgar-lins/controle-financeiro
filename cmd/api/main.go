package main

import (
	"fmt"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/database"
	"github.com/rs/cors"

	"github.com/edgar-lins/controle-financeiro/internal/routes"
)

func main() {
	db := database.Connect()
	defer db.Close()

	routes.SetupRoutes(db)

	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	}).Handler(http.DefaultServeMux)

	fmt.Println("Servidor iniciado em http://localhost:8080")
	http.ListenAndServe(":8080", handler)
}
