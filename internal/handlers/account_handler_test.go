package handlers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/edgar-lins/controle-financeiro/internal/testhelpers"
)

func TestTransferFunds_UpdatesBothBalances(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	fromID := testhelpers.CreateTestAccount(t, db, userID, 1000.0)
	toID := testhelpers.CreateTestAccount(t, db, userID, 200.0)

	handler := &AccountHandler{DB: db}
	body := fmt.Sprintf(`{
		"from_account_id": %d,
		"to_account_id": %d,
		"amount": 300.00,
		"description": "Reserva"
	}`, fromID, toID)

	req := httptest.NewRequest(http.MethodPost, "/accounts/transfer", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.TransferFunds(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d: %s", w.Code, w.Body.String())
	}

	if from := testhelpers.AccountBalance(t, db, fromID); from != 700.0 {
		t.Errorf("conta origem: esperado 700.00, encontrado %.2f", from)
	}
	if to := testhelpers.AccountBalance(t, db, toID); to != 500.0 {
		t.Errorf("conta destino: esperado 500.00, encontrado %.2f", to)
	}

	// Deve registrar o transfer no banco
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM transfers WHERE user_id = $1`, userID).Scan(&count)
	if count != 1 {
		t.Errorf("esperado 1 transfer registrado, encontrado %d", count)
	}
}

func TestTransferFunds_InsufficientBalance(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	fromID := testhelpers.CreateTestAccount(t, db, userID, 50.0)
	toID := testhelpers.CreateTestAccount(t, db, userID, 0.0)

	handler := &AccountHandler{DB: db}
	body := fmt.Sprintf(`{
		"from_account_id": %d,
		"to_account_id": %d,
		"amount": 100.00
	}`, fromID, toID)

	req := httptest.NewRequest(http.MethodPost, "/accounts/transfer", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.TransferFunds(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("esperado 400 por saldo insuficiente, recebido %d", w.Code)
	}

	// Saldos não devem ter mudado
	if from := testhelpers.AccountBalance(t, db, fromID); from != 50.0 {
		t.Errorf("saldo origem não deveria ter mudado: %.2f", from)
	}
}

func TestTransferFunds_SameAccount(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	accountID := testhelpers.CreateTestAccount(t, db, userID, 500.0)

	handler := &AccountHandler{DB: db}
	body := fmt.Sprintf(`{
		"from_account_id": %d,
		"to_account_id": %d,
		"amount": 100.00
	}`, accountID, accountID)

	req := httptest.NewRequest(http.MethodPost, "/accounts/transfer", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.TransferFunds(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("esperado 400 para mesma conta, recebido %d", w.Code)
	}
}

func TestTransferFunds_CrossUserBlocked(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)

	// Segundo usuário com conta separada
	var otherUserID int
	db.QueryRow(
		`INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1,'x','Other','User') RETURNING id`,
		"other@example.com",
	).Scan(&otherUserID)
	otherAccountID := testhelpers.CreateTestAccount(t, db, otherUserID, 1000.0)
	myAccountID := testhelpers.CreateTestAccount(t, db, userID, 500.0)

	handler := &AccountHandler{DB: db}
	body := fmt.Sprintf(`{
		"from_account_id": %d,
		"to_account_id": %d,
		"amount": 100.00
	}`, myAccountID, otherAccountID)

	req := httptest.NewRequest(http.MethodPost, "/accounts/transfer", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.TransferFunds(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("esperado 403 para conta de outro usuário, recebido %d", w.Code)
	}
}
