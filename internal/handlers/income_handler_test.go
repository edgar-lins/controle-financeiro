package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/edgar-lins/controle-financeiro/internal/models"
	"github.com/edgar-lins/controle-financeiro/internal/testhelpers"
)

func TestCreateIncome_AddsToBalance(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	accountID := testhelpers.CreateTestAccount(t, db, userID, 0.0)

	handler := &IncomeHandler{DB: db}
	body := fmt.Sprintf(`{
		"description": "Salário",
		"amount": 5000.00,
		"date": "2026-04-05",
		"account_id": %d
	}`, accountID)

	req := httptest.NewRequest(http.MethodPost, "/incomes", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.CreateIncome(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d: %s", w.Code, w.Body.String())
	}

	// Verifica se criou no banco
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM incomes WHERE user_id = $1`, userID).Scan(&count)
	if count != 1 {
		t.Errorf("esperado 1 income, encontrado %d", count)
	}

	// Saldo deve ter aumentado
	if balance := testhelpers.AccountBalance(t, db, accountID); balance != 5000.0 {
		t.Errorf("esperado saldo 5000.00, encontrado %.2f", balance)
	}

	// Resposta deve conter o income criado com month e year corretos
	var income models.Income
	if err := json.NewDecoder(w.Body).Decode(&income); err != nil {
		t.Fatalf("erro ao decodificar resposta: %v", err)
	}
	if income.Month != 4 {
		t.Errorf("esperado month 4, encontrado %d", income.Month)
	}
	if income.Year != 2026 {
		t.Errorf("esperado year 2026, encontrado %d", income.Year)
	}
}

func TestDeleteIncome_RestoresBalance(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	accountID := testhelpers.CreateTestAccount(t, db, userID, 3000.0)

	// Insere um income diretamente
	var incomeID int
	db.QueryRow(
		`INSERT INTO incomes (description, amount, date, month, year, user_id, account_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
		"Freelance", 1000.0, "2026-04-10", 4, 2026, userID, accountID,
	).Scan(&incomeID)

	handler := &IncomeHandler{DB: db}
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/incomes/delete?id=%d", incomeID), nil)
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.DeleteIncome(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("esperado 204, recebido %d: %s", w.Code, w.Body.String())
	}

	// Saldo deve ser restaurado (3000 - 1000 = 2000, pois o income foi removido)
	if balance := testhelpers.AccountBalance(t, db, accountID); balance != 2000.0 {
		t.Errorf("esperado saldo 2000.00 após deletar income, encontrado %.2f", balance)
	}
}

func TestUpdateIncome_AdjustsBalanceDelta(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	accountID := testhelpers.CreateTestAccount(t, db, userID, 2000.0)

	// Income original de 1000
	var incomeID int
	db.QueryRow(
		`INSERT INTO incomes (description, amount, date, month, year, user_id, account_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
		"Salário", 1000.0, "2026-04-05", 4, 2026, userID, accountID,
	).Scan(&incomeID)

	// Atualiza para 1500
	handler := &IncomeHandler{DB: db}
	body := fmt.Sprintf(`{
		"description": "Salário ajustado",
		"amount": 1500.00,
		"date": "2026-04-05",
		"account_id": %d
	}`, accountID)

	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/incomes/update?id=%d", incomeID), strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.UpdateIncome(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d: %s", w.Code, w.Body.String())
	}

	// Saldo: 2000 - 1000 (reverte antigo) + 1500 (aplica novo) = 2500
	if balance := testhelpers.AccountBalance(t, db, accountID); balance != 2500.0 {
		t.Errorf("esperado saldo 2500.00, encontrado %.2f", balance)
	}
}
