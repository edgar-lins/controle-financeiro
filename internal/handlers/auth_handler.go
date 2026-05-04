package handlers

import (
	"bytes"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/edgar-lins/controle-financeiro/internal/middleware"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB *sql.DB
}

type SignupRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type TokenResponse struct {
	Token     string `json:"token"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// isLoginAllowed registra a tentativa e retorna false se o IP excedeu o limite.
// Insere primeiro para eliminar a race condition entre leitura e escrita:
// mesmo com requisições concorrentes, o COUNT sempre reflete as tentativas reais.
func (h *AuthHandler) isLoginAllowed(ip string) bool {
	cutoff := time.Now().Add(-15 * time.Minute)

	h.DB.Exec(`DELETE FROM login_attempts WHERE ip = $1 AND attempted_at < $2`, ip, cutoff)
	h.DB.Exec(`INSERT INTO login_attempts (ip) VALUES ($1)`, ip)

	var count int
	h.DB.QueryRow(`SELECT COUNT(*) FROM login_attempts WHERE ip = $1`, ip).Scan(&count)

	return count <= 5
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Corpo inválido", http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		http.Error(w, "Todos os campos são obrigatórios", http.StatusBadRequest)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Erro ao criar usuário", http.StatusInternalServerError)
		return
	}
	_, err = h.DB.Exec(`INSERT INTO users(email, password_hash, first_name, last_name) VALUES($1, $2, $3, $4)`, req.Email, string(hash), req.FirstName, req.LastName)
	if err != nil {
		http.Error(w, "Erro ao salvar usuário", http.StatusConflict)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	clientIP := r.RemoteAddr
	if !h.isLoginAllowed(clientIP) {
		w.Header().Set("Retry-After", "900")
		http.Error(w, "Muitas tentativas de login. Tente novamente em 15 minutos.", http.StatusTooManyRequests)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Corpo inválido", http.StatusBadRequest)
		return
	}
	var id int
	var hash, firstName, lastName string
	err := h.DB.QueryRow(`SELECT id, password_hash, first_name, last_name FROM users WHERE email = $1`, req.Email).Scan(&id, &hash, &firstName, &lastName)
	if err != nil {
		http.Error(w, "Credenciais inválidas", http.StatusUnauthorized)
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		http.Error(w, "Credenciais inválidas", http.StatusUnauthorized)
		return
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-me"
	}
	claims := jwt.MapClaims{
		"sub": id,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{
		Token:     signed,
		FirstName: firstName,
		LastName:  lastName,
	})
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		// Sempre retorna 200 para não revelar se o email existe
		w.WriteHeader(http.StatusOK)
		return
	}

	var userID int
	var firstName string
	err := h.DB.QueryRow(`SELECT id, first_name FROM users WHERE email = $1`, req.Email).Scan(&userID, &firstName)
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Gera token seguro de 32 bytes (64 chars hex)
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}
	token := hex.EncodeToString(b)
	expiresAt := time.Now().Add(1 * time.Hour)

	// Remove tokens anteriores do usuário e insere o novo
	h.DB.Exec(`DELETE FROM password_reset_tokens WHERE user_id = $1`, userID)
	_, err = h.DB.Exec(`
		INSERT INTO password_reset_tokens (user_id, token, expires_at)
		VALUES ($1, $2, $3)
	`, userID, token, expiresAt)
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:5173"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", appURL, token)

	sendResetEmail(req.Email, firstName, resetLink)

	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}
	if req.Token == "" || len(req.Password) < 6 {
		http.Error(w, "Token ou senha inválidos", http.StatusBadRequest)
		return
	}

	var tokenID, userID int
	var expiresAt time.Time
	var used bool
	err := h.DB.QueryRow(`
		SELECT id, user_id, expires_at, used
		FROM password_reset_tokens
		WHERE token = $1
	`, req.Token).Scan(&tokenID, &userID, &expiresAt, &used)
	if err != nil || used || time.Now().After(expiresAt) {
		http.Error(w, "Token inválido ou expirado", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Erro ao processar senha", http.StatusInternalServerError)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	if _, err = tx.Exec(`UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2`, string(hash), userID); err != nil {
		http.Error(w, "Erro ao atualizar senha", http.StatusInternalServerError)
		return
	}
	if _, err = tx.Exec(`UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`, tokenID); err != nil {
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}
	if err = tx.Commit(); err != nil {
		http.Error(w, "Erro ao confirmar operação", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Password == "" {
		http.Error(w, "Senha obrigatória", http.StatusBadRequest)
		return
	}

	userIDVal := r.Context().Value(middleware.UserIDKey)
	userID, _ := userIDVal.(int)

	var hash string
	if err := h.DB.QueryRow(`SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&hash); err != nil {
		http.Error(w, "Erro ao verificar credenciais", http.StatusInternalServerError)
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		http.Error(w, "Senha incorreta", http.StatusUnauthorized)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Deleta na ordem certa para respeitar FKs
	tables := []string{
		"password_reset_tokens",
		"transfers",
		"expenses",
		"incomes",
		"goals",
		"user_preferences",
		"accounts",
	}
	for _, table := range tables {
		if _, err = tx.Exec(`DELETE FROM `+table+` WHERE user_id = $1`, userID); err != nil {
			http.Error(w, "Erro ao remover dados", http.StatusInternalServerError)
			return
		}
	}

	if _, err = tx.Exec(`DELETE FROM users WHERE id = $1`, userID); err != nil {
		http.Error(w, "Erro ao remover conta", http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		http.Error(w, "Erro ao confirmar operação", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func sendResetEmail(to, firstName, resetLink string) {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		slog.Info("reset link gerado (dev)", "to", to, "link", resetLink)
		return
	}

	fromEmail := os.Getenv("RESEND_FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "onboarding@resend.dev"
	}

	htmlBody := fmt.Sprintf(`
		<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0b1326;color:#e2e8f0;border-radius:16px">
			<h2 style="color:#5af0b3;margin-bottom:8px">Conto</h2>
			<p style="margin-bottom:24px">Olá, %s! Recebemos um pedido para redefinir sua senha.</p>
			<a href="%s" style="display:inline-block;background:#5af0b3;color:#0b1326;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none">
				Redefinir minha senha
			</a>
			<p style="margin-top:24px;font-size:13px;color:#94a3b8">
				Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.
			</p>
		</div>
	`, firstName, resetLink)

	payload, _ := json.Marshal(map[string]interface{}{
		"from":    fromEmail,
		"to":      []string{to},
		"subject": "Redefinir senha — Conto",
		"html":    htmlBody,
	})

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(payload))
	if err != nil {
		return
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	client.Do(req)
}
