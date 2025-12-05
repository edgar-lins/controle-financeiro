package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func Connect() *sql.DB {
	// Carregar variáveis de ambiente
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	// Tenta carregar .env baseado no ambiente
	if env == "development" {
		_ = godotenv.Load(".env.development")
	}
	_ = godotenv.Load() // fallback para .env

	// Verifica se existe DATABASE_URL (Render/produção)
	databaseURL := os.Getenv("DATABASE_URL")

	var psqlInfo string
	if databaseURL != "" {
		// Usar DATABASE_URL do Render
		psqlInfo = databaseURL
	} else {
		// Usar variáveis individuais (desenvolvimento local)
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")

		psqlInfo = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			host, port, user, password, dbname)
	}

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("Banco inacessível:", err)
	}

	fmt.Println("✅ Conexão com o banco de dados estabelecida com sucesso!")
	return db
}
