package testhelpers

import (
	"context"
	"database/sql"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"testing"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
)

// SetupTestDB conecta ao banco de teste e roda as migrations.
// Pula o teste se TEST_DATABASE_URL não estiver definido ou o banco for inacessível.
func SetupTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost port=5432 user=postgres password=postgres dbname=controle_financeiro_test sslmode=disable"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Skipf("banco de teste indisponível: %v", err)
	}
	if err = db.Ping(); err != nil {
		t.Skipf("banco de teste inacessível (defina TEST_DATABASE_URL): %v", err)
	}

	runMigrations(t, db)
	return db
}

func runMigrations(t *testing.T, db *sql.DB) {
	t.Helper()
	_, filename, _, _ := runtime.Caller(0)
	migrationsDir := filepath.Join(filepath.Dir(filename), "..", "..", "migrations")

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		t.Fatalf("erro ao ler migrations: %v", err)
	}

	var names []string
	for _, f := range files {
		if filepath.Ext(f.Name()) == ".sql" {
			names = append(names, f.Name())
		}
	}
	sort.Strings(names)

	for _, name := range names {
		content, err := os.ReadFile(filepath.Join(migrationsDir, name))
		if err != nil {
			t.Fatalf("erro ao ler migration %s: %v", name, err)
		}
		db.Exec(string(content)) // ignora erros de "já existe"
	}
}

// TruncateAll limpa todas as tabelas respeitando a ordem de FK.
func TruncateAll(t *testing.T, db *sql.DB) {
	t.Helper()
	tables := []string{
		"login_attempts",
		"password_reset_tokens",
		"transfers",
		"expenses",
		"incomes",
		"goals",
		"user_preferences",
		"accounts",
		"users",
	}
	for _, table := range tables {
		if _, err := db.Exec("TRUNCATE TABLE " + table + " RESTART IDENTITY CASCADE"); err != nil {
			t.Fatalf("erro ao truncar %s: %v", table, err)
		}
	}
}

// WithUserID injeta o userID no contexto da request, simulando o middleware JWT.
func WithUserID(r *http.Request, userID int) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.UserIDKey, userID)
	return r.WithContext(ctx)
}

// CreateTestUser insere um usuário e retorna seu ID.
func CreateTestUser(t *testing.T, db *sql.DB) int {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte("senha123"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("erro ao gerar hash: %v", err)
	}
	var id int
	err = db.QueryRow(
		`INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id`,
		"test@example.com", string(hash), "Test", "User",
	).Scan(&id)
	if err != nil {
		t.Fatalf("erro ao criar usuário de teste: %v", err)
	}
	return id
}

// CreateTestAccount insere uma conta corrente e retorna seu ID.
func CreateTestAccount(t *testing.T, db *sql.DB, userID int, balance float64) int64 {
	t.Helper()
	var id int64
	err := db.QueryRow(
		`INSERT INTO accounts (user_id, name, type, balance) VALUES ($1, $2, 'corrente', $3) RETURNING id`,
		userID, "Conta Teste", balance,
	).Scan(&id)
	if err != nil {
		t.Fatalf("erro ao criar conta de teste: %v", err)
	}
	return id
}

// AccountBalance lê o saldo atual de uma conta diretamente no banco.
func AccountBalance(t *testing.T, db *sql.DB, accountID int64) float64 {
	t.Helper()
	var balance float64
	if err := db.QueryRow(`SELECT balance FROM accounts WHERE id = $1`, accountID).Scan(&balance); err != nil {
		t.Fatalf("erro ao ler saldo da conta %d: %v", accountID, err)
	}
	return balance
}

// UserPasswordHash lê o hash de senha de um usuário diretamente no banco.
func UserPasswordHash(t *testing.T, db *sql.DB, userID int) string {
	t.Helper()
	var hash string
	if err := db.QueryRow(`SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&hash); err != nil {
		t.Fatalf("erro ao ler senha do usuário %d: %v", userID, err)
	}
	return hash
}
