package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"sync"
	"time"

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

// Rate Limiter para proteção contra brute force
type RateLimiter struct {
	attempts map[string][]time.Time
	mu       sync.Mutex
}

var loginLimiter = &RateLimiter{
	attempts: make(map[string][]time.Time),
}

// IsAllowed verifica se um IP pode fazer uma tentativa de login
func (rl *RateLimiter) IsAllowed(ip string, maxAttempts int, windowMinutes int) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-time.Duration(windowMinutes) * time.Minute)

	// Filtrar tentativas antigas
	recent := []time.Time{}
	for _, t := range rl.attempts[ip] {
		if t.After(cutoff) {
			recent = append(recent, t)
		}
	}

	rl.attempts[ip] = recent

	if len(recent) >= maxAttempts {
		return false // Bloqueado
	}

	rl.attempts[ip] = append(rl.attempts[ip], now)
	return true // Permitido
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

	// Rate limiting: máx 5 tentativas por IP em 15 minutos
	clientIP := r.RemoteAddr
	if !loginLimiter.IsAllowed(clientIP, 5, 15) {
		w.Header().Set("Retry-After", "900") // 15 minutos em segundos
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
