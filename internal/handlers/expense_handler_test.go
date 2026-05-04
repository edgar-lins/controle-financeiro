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

func TestCreateExpense_Single_DeductBalance(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	accountID := testhelpers.CreateTestAccount(t, db, userID, 1000.0)

	handler := &ExpenseHandler{DB: db}
	body := fmt.Sprintf(`{
		"description": "Aluguel",
		"amount": 500.00,
		"category": "moradia",
		"group": "essencial",
		"payment_method": "pix",
		"date": "2026-04-01",
		"account_id": %d,
		"installments": 1
	}`, accountID)

	req := httptest.NewRequest(http.MethodPost, "/expenses", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.CreateExpense(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d: %s", w.Code, w.Body.String())
	}

	// Deve criar exatamente 1 linha na tabela
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM expenses WHERE user_id = $1`, userID).Scan(&count)
	if count != 1 {
		t.Errorf("esperado 1 expense, encontrado %d", count)
	}

	// Saldo deve ser debitado (1000 - 500 = 500)
	if balance := testhelpers.AccountBalance(t, db, accountID); balance != 500.0 {
		t.Errorf("esperado saldo 500.00, encontrado %.2f", balance)
	}
}

func TestCreateExpense_Installments_NoBalanceDeduction(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	accountID := testhelpers.CreateTestAccount(t, db, userID, 1000.0)

	handler := &ExpenseHandler{DB: db}
	body := fmt.Sprintf(`{
		"description": "Notebook",
		"amount": 3000.00,
		"category": "outros",
		"group": "essencial",
		"payment_method": "credito",
		"date": "2026-04-01",
		"account_id": %d,
		"installments": 3
	}`, accountID)

	req := httptest.NewRequest(http.MethodPost, "/expenses", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.CreateExpense(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d: %s", w.Code, w.Body.String())
	}

	// Deve criar 3 parcelas
	var count int
	db.QueryRow(`SELECT COUNT(*) FROM expenses WHERE user_id = $1`, userID).Scan(&count)
	if count != 3 {
		t.Fatalf("esperado 3 parcelas, encontrado %d", count)
	}

	// Cada parcela deve ter valor = 3000/3 = 1000
	rows, _ := db.Query(`SELECT amount FROM expenses WHERE user_id = $1 ORDER BY installment_number`, userID)
	defer rows.Close()
	for rows.Next() {
		var amount float64
		rows.Scan(&amount)
		if amount != 1000.0 {
			t.Errorf("esperado valor por parcela 1000.00, encontrado %.2f", amount)
		}
	}

	// Parcelado não debita saldo
	if balance := testhelpers.AccountBalance(t, db, accountID); balance != 1000.0 {
		t.Errorf("esperado saldo inalterado (1000.00), encontrado %.2f", balance)
	}

	// Todas as parcelas devem compartilhar o mesmo installment_group_id
	var distinctGroups int
	db.QueryRow(`SELECT COUNT(DISTINCT installment_group_id) FROM expenses WHERE user_id = $1`, userID).Scan(&distinctGroups)
	if distinctGroups != 1 {
		t.Errorf("esperado 1 installment_group_id único, encontrado %d", distinctGroups)
	}
}

func TestCreateExpense_Installments_SequentialDates(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)
	accountID := testhelpers.CreateTestAccount(t, db, userID, 5000.0)

	handler := &ExpenseHandler{DB: db}
	body := fmt.Sprintf(`{
		"description": "TV",
		"amount": 2400.00,
		"category": "outros",
		"group": "lazer",
		"payment_method": "credito",
		"date": "2026-04-01",
		"account_id": %d,
		"installments": 3
	}`, accountID)

	req := httptest.NewRequest(http.MethodPost, "/expenses", strings.NewReader(body))
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.CreateExpense(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d", w.Code)
	}

	// Parcelas devem ter meses consecutivos: abr, mai, jun
	rows, _ := db.Query(`SELECT installment_number, date FROM expenses WHERE user_id = $1 ORDER BY installment_number`, userID)
	defer rows.Close()

	type row struct {
		num  int
		month int
	}
	var results []row
	for rows.Next() {
		var r row
		var date string
		rows.Scan(&r.num, &date)
		// extrai o mês da data (formato YYYY-MM-DD)
		var month int
		fmt.Sscanf(date[5:7], "%d", &month)
		r.month = month
		results = append(results, r)
	}

	if len(results) != 3 {
		t.Fatalf("esperado 3 parcelas, encontrado %d", len(results))
	}
	// Parcela 1 = abril(4), 2 = maio(5), 3 = junho(6)
	for i, r := range results {
		expectedMonth := 4 + i
		if r.month != expectedMonth {
			t.Errorf("parcela %d: esperado mês %d, encontrado %d", r.num, expectedMonth, r.month)
		}
	}
}

func TestGetExpenses_FilterByMonth(t *testing.T) {
	db := testhelpers.SetupTestDB(t)
	testhelpers.TruncateAll(t, db)

	userID := testhelpers.CreateTestUser(t, db)

	// Insere 2 expenses: um em abril, outro em maio
	db.Exec(`INSERT INTO expenses (description, amount, category, "group", payment_method, date, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		"Abril", 100, "outros", "essencial", "pix", "2026-04-15", userID)
	db.Exec(`INSERT INTO expenses (description, amount, category, "group", payment_method, date, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		"Maio", 200, "outros", "essencial", "pix", "2026-05-10", userID)

	handler := &ExpenseHandler{DB: db}
	req := httptest.NewRequest(http.MethodGet, "/expenses?month=4&year=2026", nil)
	req = testhelpers.WithUserID(req, userID)
	w := httptest.NewRecorder()

	handler.GetExpenses(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebido %d", w.Code)
	}

	var expenses []models.Expense
	if err := json.NewDecoder(w.Body).Decode(&expenses); err != nil {
		t.Fatalf("erro ao decodificar resposta: %v", err)
	}
	if len(expenses) != 1 {
		t.Errorf("esperado 1 expense em abril, encontrado %d", len(expenses))
	}
	if len(expenses) > 0 && expenses[0].Description != "Abril" {
		t.Errorf("esperado expense 'Abril', encontrado '%s'", expenses[0].Description)
	}
}
