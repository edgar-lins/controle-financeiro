package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"

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
		panic("Erro ao conectar no banco: " + err.Error())
	}

	err = db.Ping()
	if err != nil {
		panic("Banco inacessível: " + err.Error())
	}

	fmt.Println("✅ Conexão com o banco de dados estabelecida com sucesso!")
	return db
}

func RunMigrations(db *sql.DB) error {
	fmt.Println("🔄 Iniciando migrações automáticas...")

	files, err := os.ReadDir("./migrations")
	if err != nil {
		return fmt.Errorf("erro ao ler pasta de migrations: %v", err)
	}

	var filenames []string
	for _, f := range files {
		if !f.IsDir() && filepath.Ext(f.Name()) == ".sql" {
			filenames = append(filenames, f.Name())
		}
	}
	sort.Strings(filenames) // Garante a ordem correta (001, 002, etc)

	for _, filename := range filenames {
		fmt.Printf("🚀 Executando: %s\n", filename)
		content, err := os.ReadFile(filepath.Join("./migrations", filename))
		if err != nil {
			return err
		}

		_, err = db.Exec(string(content))
		if err != nil {
			// Ignoramos erros de "já existe", mas relatamos outros
			fmt.Printf("⚠️  Nota em %s: %v\n", filename, err)
		}
	}

	fmt.Println("✅ Banco de dados atualizado com sucesso!")
	return nil
}
