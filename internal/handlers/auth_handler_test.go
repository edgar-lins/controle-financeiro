package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/edgar-lins/controle-financeiro/internal/testhelpers"
	"golang.org/x/crypto/bcrypt"
)

func TestLogin_ValidCredentials_ReturnsToken(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	hash, _ := bcrypt.GenerateFromPassword([]byte("senha123"), bcrypt.MinCost)
	db.Exec(`INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1,$2,'Test','User')`,
		"login@example.com", string(hash))

	handler := &AuthHandler{DB: db}
	body := `{"email":"login@example.com","password":"senha123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.Login(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d: %s", w.Code, w.Body.String())
	}

	var resp TokenResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("erro ao decodificar resposta: %v", err)
	}
	if resp.Token == "" {
		t.Error("token não deve ser vazio")
	}
	if resp.FirstName != "Test" {
		t.Errorf("esperado first_name 'Test', recebido '%s'", resp.FirstName)
	}
}

func TestLogin_WrongPassword_Returns401(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	hash, _ := bcrypt.GenerateFromPassword([]byte("correta"), bcrypt.MinCost)
	db.Exec(`INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1,$2,'Test','User')`,
		"wrong@example.com", string(hash))

	handler := &AuthHandler{DB: db}
	body := `{"email":"wrong@example.com","password":"errada"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.Login(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("esperado 401, recebido %d", w.Code)
	}
}

func TestLogin_RateLimiting_BlocksAfter5Attempts(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	hash, _ := bcrypt.GenerateFromPassword([]byte("senha123"), bcrypt.MinCost)
	db.Exec(`INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1,$2,'Rate','User')`,
		"rate@example.com", string(hash))

	handler := &AuthHandler{DB: db}

	// 5 tentativas com senha errada — devem passar pelo rate limiter
	for i := range 5 {
		body := `{"email":"rate@example.com","password":"errada"}`
		req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
		req.RemoteAddr = "10.0.0.1:9999" // IP fixo para garantir o bloqueio
		w := httptest.NewRecorder()
		handler.Login(w, req)

		if w.Code == http.StatusTooManyRequests {
			t.Fatalf("tentativa %d bloqueada prematuramente", i+1)
		}
	}

	// 6ª tentativa deve ser bloqueada com 429
	body := `{"email":"rate@example.com","password":"senha123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.RemoteAddr = "10.0.0.1:9999"
	w := httptest.NewRecorder()
	handler.Login(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Errorf("esperado 429 na 6ª tentativa, recebido %d", w.Code)
	}
}

func TestResetPassword_UpdatesPasswordChangedAt(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	oldHash := testhelpers.UserPasswordHash(t, db, userID)

	// Insere token de reset válido
	token := "abc123deadbeef"
	db.Exec(`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '1 hour')`,
		userID, token)

	handler := &AuthHandler{DB: db}
	body := fmt.Sprintf(`{"token":"%s","password":"novaSenha456"}`, token)
	req := httptest.NewRequest(http.MethodPost, "/auth/reset-password", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.ResetPassword(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d: %s", w.Code, w.Body.String())
	}

	// Hash de senha deve ter mudado
	newHash := testhelpers.UserPasswordHash(t, db, userID)
	if newHash == oldHash {
		t.Error("hash de senha não foi atualizado")
	}

	// password_changed_at deve ter sido preenchido
	var changedAt *string
	db.QueryRow(`SELECT password_changed_at::text FROM users WHERE id = $1`, userID).Scan(&changedAt)
	if changedAt == nil {
		t.Error("password_changed_at deveria estar preenchido após reset")
	}

	// Token deve estar marcado como usado
	var used bool
	db.QueryRow(`SELECT used FROM password_reset_tokens WHERE token = $1`, token).Scan(&used)
	if !used {
		t.Error("token deveria estar marcado como usado")
	}
}

func TestSignup_DuplicateEmail_Returns409(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	handler := &AuthHandler{DB: db}
	body := `{"email":"dup@example.com","password":"senha123","first_name":"A","last_name":"B"}`

	// Primeiro signup — deve funcionar
	req := httptest.NewRequest(http.MethodPost, "/auth/signup", strings.NewReader(body))
	w := httptest.NewRecorder()
	handler.Signup(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("esperado 201 no primeiro signup, recebido %d", w.Code)
	}

	// Segundo signup com mesmo email — deve falhar com 409
	req = httptest.NewRequest(http.MethodPost, "/auth/signup", strings.NewReader(body))
	w = httptest.NewRecorder()
	handler.Signup(w, req)
	if w.Code != http.StatusConflict {
		t.Errorf("esperado 409 para email duplicado, recebido %d", w.Code)
	}
}
