package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/edgar-lins/controle-financeiro/internal/database"
	"github.com/edgar-lins/controle-financeiro/internal/routes"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		
		// Permitir localhost para desenvolvimento
		if origin == "http://localhost:5173" || 
		   origin == "http://localhost:3000" ||
		   origin == "http://localhost:8080" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if origin != "" {
			// Permitir qualquer origem (para produção/Vercel)
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
		
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	db := database.Connect()
	defer db.Close()

	routes.SetupRoutes(db)

	handler := corsMiddleware(http.DefaultServeMux)

	fmt.Println("Servidor iniciado em http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
