-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_bm" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_shariah_compliant" BOOLEAN NOT NULL DEFAULT false,
    "official_website" TEXT NOT NULL,
    "sme_portal_url" TEXT,
    "cgc_partner" BOOLEAN NOT NULL DEFAULT false,
    "sjpp_partner" BOOLEAN NOT NULL DEFAULT false,
    "bnm_fund_partner" BOOLEAN NOT NULL DEFAULT false,
    "personal_dsr_low_threshold" REAL,
    "personal_dsr_high_threshold" REAL,
    "personal_income_cutoff" REAL,
    "personal_min_ctos" INTEGER,
    "personal_approval_rate_pct" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bank_id" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "product_name_en" TEXT NOT NULL,
    "product_name_zh" TEXT NOT NULL,
    "loan_structure" TEXT NOT NULL,
    "collateral_requirement" TEXT NOT NULL,
    "guarantee_scheme" TEXT NOT NULL,
    "is_shariah" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "block_a_json" TEXT,
    "block_b_json" TEXT,
    "block_c_summary" TEXT,
    "block_a_completion_pct" REAL NOT NULL DEFAULT 0,
    "block_b_completion_pct" REAL NOT NULL DEFAULT 0,
    "last_verified_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Product_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "Bank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "ssm_number" TEXT NOT NULL,
    "company_type" TEXT NOT NULL,
    "industry_category" TEXT NOT NULL,
    "industry_subcategory" TEXT,
    "incorporation_date" DATETIME NOT NULL,
    "registered_address" TEXT NOT NULL,
    "operating_address" TEXT,
    "bumiputera_status" BOOLEAN NOT NULL DEFAULT false,
    "primary_contact_name" TEXT NOT NULL,
    "primary_contact_ic" TEXT NOT NULL,
    "primary_contact_phone" TEXT NOT NULL,
    "primary_contact_email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "case_reference" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "purpose_description" TEXT,
    "requested_amount" REAL NOT NULL,
    "acceptable_max_monthly_repayment" REAL,
    "preferred_tenure_months" INTEGER,
    "urgency" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'INTAKE',
    "follow_up_date" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Case_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseFinancials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "case_id" TEXT NOT NULL,
    "annual_revenue_y1" REAL,
    "annual_revenue_y2" REAL,
    "annual_revenue_y3" REAL,
    "net_profit_y1" REAL,
    "net_profit_y2" REAL,
    "net_profit_y3" REAL,
    "ebitda_y1" REAL,
    "ebitda_y2" REAL,
    "has_audited_accounts" BOOLEAN NOT NULL DEFAULT false,
    "has_tax_filing" BOOLEAN NOT NULL DEFAULT false,
    "avg_monthly_inflow_6m" REAL,
    "avg_monthly_inflow_12m" REAL,
    "avg_monthly_ending_balance" REAL,
    "bounce_cheque_count_12m" INTEGER,
    "cash_inflow_pct" REAL,
    "single_customer_concentration_pct" REAL,
    "total_existing_monthly_repayment" REAL,
    "total_existing_outstanding" REAL,
    "ctos_score" INTEGER,
    "ctos_grade" TEXT,
    "ccris_status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "ccris_notes" TEXT,
    "effective_monthly_inflow" REAL,
    "calculated_dscr" REAL,
    "calculated_fcf" REAL,
    "total_debt_to_annual_revenue_pct" REAL,
    "debt_service_coverage" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "CaseFinancials_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankAccountSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financials_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number_last4" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "avg_monthly_inflow" REAL,
    "avg_monthly_outflow" REAL,
    "avg_ending_balance" REAL,
    "months_of_data" INTEGER NOT NULL,
    "bounce_count" INTEGER NOT NULL DEFAULT 0,
    "concentration_risk" BOOLEAN NOT NULL DEFAULT false,
    "cash_inflow_pct" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "BankAccountSummary_financials_id_fkey" FOREIGN KEY ("financials_id") REFERENCES "CaseFinancials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExistingLoan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financials_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "outstanding_balance" REAL NOT NULL,
    "monthly_repayment" REAL NOT NULL,
    "maturity_date" DATETIME,
    "is_secured" BOOLEAN NOT NULL DEFAULT false,
    "collateral_description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ExistingLoan_financials_id_fkey" FOREIGN KEY ("financials_id") REFERENCES "CaseFinancials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collateral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financials_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_market_value" REAL NOT NULL,
    "existing_encumbrance" REAL NOT NULL,
    "net_equity" REAL NOT NULL,
    "valuation_date" DATETIME,
    "title_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Collateral_financials_id_fkey" FOREIGN KEY ("financials_id") REFERENCES "CaseFinancials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DirectorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "case_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "ic_number" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employer_type" TEXT NOT NULL,
    "employer_name" TEXT NOT NULL,
    "epf_continuous_months" INTEGER,
    "epf_last_contribution_month" TEXT,
    "epf_account2_balance" REAL,
    "ctos_score" INTEGER,
    "ccris_status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "ccris_notes" TEXT,
    "income_items_json" TEXT,
    "personal_loans_json" TEXT,
    "total_recognized_monthly_income" REAL,
    "total_personal_monthly_commitment" REAL,
    "calculated_personal_dsr" REAL,
    "personal_credit_score" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "DirectorProfile_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchingResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "case_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "overall_score" TEXT NOT NULL,
    "estimated_amount_min" REAL,
    "estimated_amount_max" REAL,
    "estimated_monthly_repayment_min" REAL,
    "estimated_monthly_repayment_max" REAL,
    "estimated_approval_probability" REAL,
    "eligibility_flags_json" TEXT,
    "risk_flags_json" TEXT,
    "requirement_gaps_json" TEXT,
    "amount_breakdown_json" TEXT,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "selected_amount" REAL,
    "selected_tenure_months" INTEGER,
    "advisor_override_notes" TEXT,
    "calculated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchingResult_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchingResult_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "step_type" TEXT,
    "raw_text" TEXT NOT NULL,
    "raw_value" TEXT,
    "normalized_value" TEXT,
    "source_url" TEXT,
    "source_channel" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_date" DATETIME,
    "language" TEXT NOT NULL DEFAULT 'ZH',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FieldEvidence_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "step_type" TEXT,
    "final_value" TEXT,
    "value_type" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "decision_basis" TEXT NOT NULL,
    "supporting_evidence_ids" TEXT NOT NULL DEFAULT '[]',
    "human_overridden" BOOLEAN NOT NULL DEFAULT false,
    "override_by" TEXT,
    "override_reason" TEXT,
    "override_at" DATETIME,
    "combined_sources" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "FieldDecision_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldDecisionEvidence" (
    "decision_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,

    PRIMARY KEY ("decision_id", "evidence_id"),
    CONSTRAINT "FieldDecisionEvidence_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "FieldDecision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FieldDecisionEvidence_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "FieldEvidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADVISOR',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Bank_code_key" ON "Bank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_bank_id_product_code_key" ON "Product"("bank_id", "product_code");

-- CreateIndex
CREATE UNIQUE INDEX "Client_ssm_number_key" ON "Client"("ssm_number");

-- CreateIndex
CREATE UNIQUE INDEX "Case_case_reference_key" ON "Case"("case_reference");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_advisor_id_idx" ON "Case"("advisor_id");

-- CreateIndex
CREATE INDEX "Case_follow_up_date_idx" ON "Case"("follow_up_date");

-- CreateIndex
CREATE UNIQUE INDEX "CaseFinancials_case_id_key" ON "CaseFinancials"("case_id");

-- CreateIndex
CREATE INDEX "BankAccountSummary_financials_id_idx" ON "BankAccountSummary"("financials_id");

-- CreateIndex
CREATE INDEX "ExistingLoan_financials_id_idx" ON "ExistingLoan"("financials_id");

-- CreateIndex
CREATE INDEX "Collateral_financials_id_idx" ON "Collateral"("financials_id");

-- CreateIndex
CREATE INDEX "DirectorProfile_case_id_idx" ON "DirectorProfile"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "DirectorProfile_case_id_ic_number_key" ON "DirectorProfile"("case_id", "ic_number");

-- CreateIndex
CREATE INDEX "MatchingResult_overall_score_idx" ON "MatchingResult"("overall_score");

-- CreateIndex
CREATE UNIQUE INDEX "MatchingResult_case_id_product_id_key" ON "MatchingResult"("case_id", "product_id");

-- CreateIndex
CREATE INDEX "FieldEvidence_product_id_field_name_idx" ON "FieldEvidence"("product_id", "field_name");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDecision_product_id_field_name_step_type_key" ON "FieldDecision"("product_id", "field_name", "step_type");

-- CreateIndex
CREATE INDEX "FieldDecisionEvidence_evidence_id_idx" ON "FieldDecisionEvidence"("evidence_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
