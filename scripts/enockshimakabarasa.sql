--
-- PostgreSQL database dump
--

\restrict dRx0okpYbmaEtqXrc7M84gYEsaee2pCqKIZh6ikY6J6irY4K3cgNbTbO0rbrNO8

-- Dumped from database version 16.14 (Homebrew)
-- Dumped by pg_dump version 16.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.webhooks DROP CONSTRAINT IF EXISTS webhooks_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.salaries DROP CONSTRAINT IF EXISTS salaries_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recurring_templates DROP CONSTRAINT IF EXISTS recurring_templates_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_runs DROP CONSTRAINT IF EXISTS reconciliation_runs_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_transactions DROP CONSTRAINT IF EXISTS project_transactions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.other_transactions DROP CONSTRAINT IF EXISTS other_transactions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notification_log DROP CONSTRAINT IF EXISTS notification_log_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journal_entry_lines DROP CONSTRAINT IF EXISTS journal_entry_lines_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fixed_assets DROP CONSTRAINT IF EXISTS fixed_assets_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.debit_notes DROP CONSTRAINT IF EXISTS debit_notes_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.deals DROP CONSTRAINT IF EXISTS deals_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.credit_notes DROP CONSTRAINT IF EXISTS credit_notes_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_settings DROP CONSTRAINT IF EXISTS company_settings_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.capital_transactions DROP CONSTRAINT IF EXISTS capital_transactions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.budgets DROP CONSTRAINT IF EXISTS budgets_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.billing_history DROP CONSTRAINT IF EXISTS billing_history_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_statements DROP CONSTRAINT IF EXISTS bank_statements_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.articles DROP CONSTRAINT IF EXISTS articles_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_requests DROP CONSTRAINT IF EXISTS approval_requests_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.api_keys DROP CONSTRAINT IF EXISTS api_keys_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.webhooks DROP CONSTRAINT IF EXISTS webhooks_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_token_key;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.salaries DROP CONSTRAINT IF EXISTS salaries_pkey;
ALTER TABLE IF EXISTS ONLY public.recurring_templates DROP CONSTRAINT IF EXISTS recurring_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_runs DROP CONSTRAINT IF EXISTS reconciliation_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.project_transactions DROP CONSTRAINT IF EXISTS project_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.other_transactions DROP CONSTRAINT IF EXISTS other_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_log DROP CONSTRAINT IF EXISTS notification_log_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_entry_lines DROP CONSTRAINT IF EXISTS journal_entry_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_pkey;
ALTER TABLE IF EXISTS ONLY public.fixed_assets DROP CONSTRAINT IF EXISTS fixed_assets_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.debit_notes DROP CONSTRAINT IF EXISTS debit_notes_pkey;
ALTER TABLE IF EXISTS ONLY public.deals DROP CONSTRAINT IF EXISTS deals_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.credit_notes DROP CONSTRAINT IF EXISTS credit_notes_pkey;
ALTER TABLE IF EXISTS ONLY public.company_settings DROP CONSTRAINT IF EXISTS company_settings_tenant_id_key;
ALTER TABLE IF EXISTS ONLY public.company_settings DROP CONSTRAINT IF EXISTS company_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_pkey;
ALTER TABLE IF EXISTS ONLY public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.capital_transactions DROP CONSTRAINT IF EXISTS capital_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.budgets DROP CONSTRAINT IF EXISTS budgets_pkey;
ALTER TABLE IF EXISTS ONLY public.billing_history DROP CONSTRAINT IF EXISTS billing_history_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_statements DROP CONSTRAINT IF EXISTS bank_statements_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.articles DROP CONSTRAINT IF EXISTS articles_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_requests DROP CONSTRAINT IF EXISTS approval_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.api_keys DROP CONSTRAINT IF EXISTS api_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subscription_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.billing_history ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.webhooks;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.tenants;
DROP TABLE IF EXISTS public.supplier_payments;
DROP SEQUENCE IF EXISTS public.subscription_events_id_seq;
DROP TABLE IF EXISTS public.subscription_events;
DROP SEQUENCE IF EXISTS public.sessions_id_seq;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.sales_invoices;
DROP TABLE IF EXISTS public.salaries;
DROP TABLE IF EXISTS public.recurring_templates;
DROP TABLE IF EXISTS public.reconciliation_runs;
DROP TABLE IF EXISTS public.quotations;
DROP TABLE IF EXISTS public.purchase_orders;
DROP TABLE IF EXISTS public.purchase_invoices;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.project_transactions;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.other_transactions;
DROP TABLE IF EXISTS public.notification_preferences;
DROP TABLE IF EXISTS public.notification_log;
DROP TABLE IF EXISTS public.journal_entry_lines;
DROP TABLE IF EXISTS public.journal_entries;
DROP TABLE IF EXISTS public.inventory_transactions;
DROP TABLE IF EXISTS public.inventory_items;
DROP TABLE IF EXISTS public.fixed_assets;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.exchange_rates;
DROP TABLE IF EXISTS public.employees;
DROP TABLE IF EXISTS public.debit_notes;
DROP TABLE IF EXISTS public.deals;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.credit_notes;
DROP TABLE IF EXISTS public.company_settings;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.chart_of_accounts;
DROP TABLE IF EXISTS public.capital_transactions;
DROP TABLE IF EXISTS public.budgets;
DROP SEQUENCE IF EXISTS public.billing_history_id_seq;
DROP TABLE IF EXISTS public.billing_history;
DROP TABLE IF EXISTS public.bank_statements;
DROP TABLE IF EXISTS public.bank_accounts;
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.articles;
DROP TABLE IF EXISTS public.approval_workflows;
DROP TABLE IF EXISTS public.approval_requests;
DROP TABLE IF EXISTS public.api_keys;
DROP TABLE IF EXISTS public.admin_notifications;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    title text DEFAULT ''::text,
    message text NOT NULL,
    link text DEFAULT ''::text,
    is_read integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_name text DEFAULT ''::text NOT NULL,
    api_key text NOT NULL,
    permissions text DEFAULT 'read'::text,
    last_used_at timestamp without time zone,
    expires_at timestamp without time zone,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_requests (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    entity_amount real DEFAULT 0,
    requested_by uuid,
    status text DEFAULT 'pending'::text,
    approved_by uuid,
    approved_at text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: approval_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_workflows (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_name text DEFAULT ''::text NOT NULL,
    entity_type text NOT NULL,
    trigger_amount real DEFAULT 0,
    approver_role text DEFAULT 'admin'::text,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    slug text DEFAULT ''::text NOT NULL,
    content text DEFAULT ''::text,
    excerpt text DEFAULT ''::text,
    author text DEFAULT ''::text,
    status text DEFAULT 'draft'::text,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    entity_type text NOT NULL,
    imported_count integer DEFAULT 0,
    errors_count integer DEFAULT 0,
    error_details text DEFAULT '[]'::text,
    file_name text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_accounts (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_name text DEFAULT ''::text NOT NULL,
    account_number text DEFAULT ''::text,
    bank_name text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text,
    opening_balance real DEFAULT 0,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: bank_statements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_statements (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bank_account_id uuid NOT NULL,
    transaction_date text NOT NULL,
    description text DEFAULT ''::text,
    reference text DEFAULT ''::text,
    amount real DEFAULT 0 NOT NULL,
    type text DEFAULT 'DEBIT'::text NOT NULL,
    balance real DEFAULT 0,
    currency text DEFAULT 'USD'::text,
    status text DEFAULT 'unreconciled'::text,
    reconciliation_id uuid,
    matched_transaction_type text DEFAULT ''::text,
    matched_transaction_id text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: billing_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_history (
    id integer NOT NULL,
    user_id integer,
    amount numeric(10,2),
    plan_name character varying(100),
    payment_method character varying(50),
    transaction_id character varying(255),
    period_start timestamp without time zone,
    period_end timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id uuid,
    currency text DEFAULT 'USD'::text,
    status text DEFAULT 'completed'::text
);


--
-- Name: billing_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.billing_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: billing_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.billing_history_id_seq OWNED BY public.billing_history.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fiscal_year integer DEFAULT EXTRACT(year FROM now()) NOT NULL,
    period text DEFAULT 'MONTHLY'::text NOT NULL,
    category_type text DEFAULT 'REVENUE'::text NOT NULL,
    category_name text DEFAULT ''::text,
    amount real DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: capital_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capital_transactions (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text DEFAULT 'CAPITAL_INJECTION'::text NOT NULL,
    amount real DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    transaction_date text NOT NULL,
    description text DEFAULT ''::text,
    reference text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: chart_of_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_of_accounts (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    account_type text DEFAULT 'EXPENSE'::text NOT NULL,
    parent_id uuid,
    is_active integer DEFAULT 1,
    opening_balance real DEFAULT 0,
    description text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_name text DEFAULT ''::text NOT NULL,
    company_name text DEFAULT ''::text,
    contact_person text DEFAULT ''::text,
    email_address text DEFAULT ''::text,
    phone_number text DEFAULT ''::text,
    address text DEFAULT ''::text,
    bank_details text DEFAULT ''::text,
    tax_id text DEFAULT ''::text,
    payment_terms text DEFAULT 'Net 30'::text,
    supplier_category text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    country text DEFAULT ''::text,
    currency text DEFAULT ''::text
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text DEFAULT ''::text,
    address text DEFAULT ''::text,
    location text DEFAULT ''::text,
    country text DEFAULT 'Kenya'::text,
    phone text DEFAULT ''::text,
    email text DEFAULT ''::text,
    kra_pin text DEFAULT ''::text,
    logo_base64 text DEFAULT ''::text,
    paybill_number text DEFAULT ''::text,
    bank_name text DEFAULT ''::text,
    account_number text DEFAULT ''::text,
    bank_branch text DEFAULT ''::text,
    branch_code text DEFAULT ''::text,
    bank_code text DEFAULT ''::text,
    swift_code text DEFAULT ''::text,
    terms_conditions text DEFAULT ''::text,
    invoice_prefix text DEFAULT 'INV'::text,
    next_invoice_number integer DEFAULT 1,
    quotation_prefix text DEFAULT 'QTN'::text,
    next_quotation_number integer DEFAULT 1,
    last_invoice_month text DEFAULT ''::text,
    last_quotation_month text DEFAULT ''::text,
    smtp_host text DEFAULT ''::text,
    smtp_port text DEFAULT '587'::text,
    smtp_user text DEFAULT ''::text,
    smtp_pass text DEFAULT ''::text,
    vat_rate real DEFAULT 16,
    base_currency text DEFAULT 'USD'::text,
    income_tax_rate real DEFAULT 0,
    tax_filing_frequency text DEFAULT 'monthly'::text,
    credit_note_prefix text DEFAULT 'CN'::text,
    next_credit_note_number integer DEFAULT 1,
    last_credit_note_month text DEFAULT ''::text,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: credit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_notes (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    credit_note_number text DEFAULT ''::text,
    invoice_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    customer_name text NOT NULL,
    customer_email text DEFAULT ''::text,
    description text DEFAULT ''::text,
    quantity real DEFAULT 1,
    unit_price real DEFAULT 0,
    subtotal real DEFAULT 0,
    tax_vat real DEFAULT 0,
    discounts real DEFAULT 0,
    amount real DEFAULT 0 NOT NULL,
    reason text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    payment_terms text DEFAULT 'Net 30'::text,
    issue_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    vat_rate real DEFAULT 0,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    company_name text DEFAULT ''::text,
    contact_person text DEFAULT ''::text,
    email_address text DEFAULT ''::text,
    phone_number text DEFAULT ''::text,
    billing_address text DEFAULT ''::text,
    shipping_address text DEFAULT ''::text,
    tax_id text DEFAULT ''::text,
    country text DEFAULT ''::text,
    payment_terms text DEFAULT 'Net 30'::text,
    credit_limit real DEFAULT 0,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT ''::text
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_name text DEFAULT ''::text NOT NULL,
    customer_id uuid,
    contact_name text DEFAULT ''::text,
    contact_email text DEFAULT ''::text,
    contact_phone text DEFAULT ''::text,
    deal_value real DEFAULT 0,
    currency text DEFAULT 'USD'::text,
    pipeline_stage text DEFAULT 'lead'::text,
    probability integer DEFAULT 10,
    expected_close_date text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    status text DEFAULT 'open'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: debit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debit_notes (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    debit_note_number text DEFAULT ''::text,
    purchase_invoice_id uuid NOT NULL,
    client_id uuid NOT NULL,
    client_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity real DEFAULT 1,
    unit_price real DEFAULT 0,
    amount real DEFAULT 0 NOT NULL,
    reason text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    issue_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_code text DEFAULT ''::text,
    name text DEFAULT ''::text NOT NULL,
    date_of_birth text DEFAULT ''::text,
    national_id text DEFAULT ''::text,
    tax_pin text DEFAULT ''::text,
    phone text DEFAULT ''::text,
    email text DEFAULT ''::text,
    address text DEFAULT ''::text,
    department text DEFAULT ''::text,
    job_title text DEFAULT ''::text,
    date_of_hire text DEFAULT ''::text,
    employment_type text DEFAULT 'full-time'::text,
    bank_name text DEFAULT ''::text,
    account_number text DEFAULT ''::text,
    emergency_contact_name text DEFAULT ''::text,
    emergency_contact_phone text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    salary real DEFAULT 0,
    salary_encrypted text,
    national_id_encrypted text,
    bank_account_encrypted text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_currency text NOT NULL,
    target_currency text DEFAULT 'USD'::text NOT NULL,
    rate real DEFAULT 1 NOT NULL,
    rate_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_code text DEFAULT ''::text,
    category text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text,
    supplier_vendor text DEFAULT ''::text,
    invoice_receipt_number text DEFAULT ''::text,
    amount real DEFAULT 0 NOT NULL,
    tax_vat real DEFAULT 0,
    expense_date text NOT NULL,
    payment_method text DEFAULT 'cash'::text,
    paid_by text DEFAULT ''::text,
    status text DEFAULT 'pending'::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: fixed_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fixed_assets (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_name text DEFAULT ''::text NOT NULL,
    asset_type text DEFAULT 'Equipment'::text,
    purchase_date text NOT NULL,
    purchase_cost real DEFAULT 0 NOT NULL,
    useful_life_years real DEFAULT 5 NOT NULL,
    depreciation_method text DEFAULT 'straight-line'::text,
    salvage_value real DEFAULT 0,
    accumulated_depreciation real DEFAULT 0,
    book_value real DEFAULT 0,
    status text DEFAULT 'active'::text,
    disposal_date text DEFAULT ''::text,
    disposal_amount real DEFAULT 0,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    sku text DEFAULT ''::text,
    category text DEFAULT ''::text,
    unit_of_measure text DEFAULT 'pcs'::text,
    opening_stock real DEFAULT 0,
    current_stock real DEFAULT 0,
    unit_cost real DEFAULT 0,
    reorder_level real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    transaction_type text DEFAULT 'PURCHASE'::text NOT NULL,
    quantity real DEFAULT 0 NOT NULL,
    unit_cost real DEFAULT 0,
    total_cost real DEFAULT 0,
    reference_type text DEFAULT ''::text,
    reference_id text DEFAULT ''::text,
    transaction_date text NOT NULL,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_number text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    entry_date text NOT NULL,
    reference text DEFAULT ''::text,
    status text DEFAULT 'draft'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: journal_entry_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entry_lines (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    account_id uuid NOT NULL,
    description text DEFAULT ''::text,
    debit_amount real DEFAULT 0,
    credit_amount real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_log (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    notification_type text NOT NULL,
    title text DEFAULT ''::text,
    message text DEFAULT ''::text,
    channel text DEFAULT 'in_app'::text,
    is_read integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_notifications integer DEFAULT 1,
    sms_notifications integer DEFAULT 0,
    in_app_notifications integer DEFAULT 1,
    invoice_reminders integer DEFAULT 1,
    payment_confirmations integer DEFAULT 1,
    low_stock_alerts integer DEFAULT 1,
    approval_requests integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: other_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.other_transactions (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text DEFAULT 'OTHER_INCOME'::text NOT NULL,
    category text DEFAULT ''::text,
    description text DEFAULT ''::text,
    amount real DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    transaction_date text NOT NULL,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    customer_name text NOT NULL,
    amount real NOT NULL,
    payment_date text NOT NULL,
    payment_method text DEFAULT 'cash'::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: project_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_transactions (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    entity_type text DEFAULT 'expense'::text NOT NULL,
    entity_id text DEFAULT ''::text NOT NULL,
    amount real DEFAULT 0 NOT NULL,
    transaction_date text NOT NULL,
    description text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_name text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text,
    start_date text DEFAULT ''::text,
    end_date text DEFAULT ''::text,
    budget real DEFAULT 0,
    currency text DEFAULT 'USD'::text,
    customer_id uuid,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: purchase_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_invoices (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text DEFAULT ''::text,
    po_id uuid,
    client_id uuid NOT NULL,
    client_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity real DEFAULT 1,
    unit_price real DEFAULT 0,
    subtotal real DEFAULT 0,
    tax_vat real DEFAULT 0,
    discounts real DEFAULT 0,
    amount real DEFAULT 0 NOT NULL,
    payment_terms text DEFAULT 'Net 30'::text,
    status text DEFAULT 'unpaid'::text,
    issue_date text NOT NULL,
    due_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    vat_rate real DEFAULT 0,
    client_country text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    po_number text DEFAULT ''::text,
    client_id uuid NOT NULL,
    client_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity real DEFAULT 1,
    unit_price real DEFAULT 0,
    subtotal real DEFAULT 0,
    tax_vat real DEFAULT 0,
    amount real DEFAULT 0 NOT NULL,
    delivery_date text DEFAULT ''::text,
    status text DEFAULT 'pending'::text,
    notes text DEFAULT ''::text,
    issue_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    vat_rate real DEFAULT 0,
    client_country text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotations (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quotation_number text DEFAULT ''::text,
    customer_id uuid NOT NULL,
    customer_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity real DEFAULT 1,
    unit_price real DEFAULT 0,
    subtotal real DEFAULT 0,
    tax_vat real DEFAULT 0,
    amount real DEFAULT 0 NOT NULL,
    valid_until text DEFAULT ''::text,
    due_date text DEFAULT ''::text,
    status text DEFAULT 'draft'::text,
    notes text DEFAULT ''::text,
    items text DEFAULT '[]'::text,
    issue_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    vat_rate real DEFAULT 0,
    customer_country text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    discounts real DEFAULT 0
);


--
-- Name: reconciliation_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reconciliation_runs (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bank_account_id uuid NOT NULL,
    statement_balance real DEFAULT 0,
    system_balance real DEFAULT 0,
    difference real DEFAULT 0,
    start_date text NOT NULL,
    end_date text NOT NULL,
    status text DEFAULT 'in_progress'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: recurring_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_templates (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_name text DEFAULT ''::text NOT NULL,
    entity_type text DEFAULT 'invoice'::text NOT NULL,
    template_data text DEFAULT '{}'::text,
    frequency text DEFAULT 'monthly'::text NOT NULL,
    interval_count integer DEFAULT 1,
    next_run_date text NOT NULL,
    last_run_date text DEFAULT ''::text,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: salaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salaries (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    employee_name text NOT NULL,
    basic_salary real DEFAULT 0,
    allowances real DEFAULT 0,
    deductions real DEFAULT 0,
    overtime real DEFAULT 0,
    bonuses real DEFAULT 0,
    amount real DEFAULT 0 NOT NULL,
    amount_encrypted text,
    pay_date text NOT NULL,
    payment_method text DEFAULT 'bank'::text,
    payslip_reference text DEFAULT ''::text,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_invoices (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text DEFAULT ''::text,
    quotation_id uuid,
    customer_id uuid NOT NULL,
    customer_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity real DEFAULT 1,
    unit_price real DEFAULT 0,
    subtotal real DEFAULT 0,
    tax_vat real DEFAULT 0,
    discounts real DEFAULT 0,
    amount real DEFAULT 0 NOT NULL,
    payment_terms text DEFAULT 'Net 30'::text,
    status text DEFAULT 'unpaid'::text,
    items text DEFAULT '[]'::text,
    issue_date text NOT NULL,
    due_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    vat_rate real DEFAULT 0,
    exchange_rate real DEFAULT 1,
    customer_country text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    client_db character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id uuid
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: subscription_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_events (
    id integer NOT NULL,
    user_id integer,
    event_type character varying(100),
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id uuid
);


--
-- Name: subscription_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscription_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscription_events_id_seq OWNED BY public.subscription_events.id;


--
-- Name: supplier_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_payments (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    client_id uuid NOT NULL,
    client_name text NOT NULL,
    amount real NOT NULL,
    payment_date text NOT NULL,
    payment_method text DEFAULT 'cash'::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(50),
    role character varying(50) DEFAULT 'user'::character varying,
    verified boolean DEFAULT false,
    subscription_plan character varying(50) DEFAULT 'trial'::character varying,
    subscription_status character varying(50) DEFAULT 'inactive'::character varying,
    subscription_expiry timestamp without time zone,
    grace_period_end timestamp without time zone,
    last_reminder_sent timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id uuid,
    encryption_key text,
    card_last4 text,
    card_expiry text,
    paypal_email text,
    trial_start_date timestamp with time zone,
    trial_end_date timestamp with time zone,
    trial_used integer DEFAULT 0,
    password_hash text,
    license_status text DEFAULT 'active'::text,
    country text DEFAULT 'KE'::text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhooks (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_name text DEFAULT ''::text NOT NULL,
    url text NOT NULL,
    events text DEFAULT '[]'::text,
    secret text DEFAULT ''::text,
    is_active integer DEFAULT 1,
    last_triggered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: billing_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_history ALTER COLUMN id SET DEFAULT nextval('public.billing_history_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: subscription_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events ALTER COLUMN id SET DEFAULT nextval('public.subscription_events_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_notifications (id, type, title, message, link, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (tenant_id, id, key_name, api_key, permissions, last_used_at, expires_at, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: approval_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_requests (tenant_id, id, workflow_id, entity_type, entity_id, entity_amount, requested_by, status, approved_by, approved_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: approval_workflows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_workflows (tenant_id, id, workflow_name, entity_type, trigger_amount, approver_role, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articles (tenant_id, id, title, slug, content, excerpt, author, status, published_at, created_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (tenant_id, id, user_id, entity_type, imported_count, errors_count, error_details, file_name, created_at) FROM stdin;
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_accounts (tenant_id, id, account_name, account_number, bank_name, currency, opening_balance, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: bank_statements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_statements (tenant_id, id, bank_account_id, transaction_date, description, reference, amount, type, balance, currency, status, reconciliation_id, matched_transaction_type, matched_transaction_id, created_at) FROM stdin;
\.


--
-- Data for Name: billing_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_history (id, user_id, amount, plan_name, payment_method, transaction_id, period_start, period_end, created_at, tenant_id, currency, status) FROM stdin;
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budgets (tenant_id, id, fiscal_year, period, category_type, category_name, amount, created_at) FROM stdin;
\.


--
-- Data for Name: capital_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.capital_transactions (tenant_id, id, type, amount, currency, exchange_rate, transaction_date, description, reference, created_at) FROM stdin;
\.


--
-- Data for Name: chart_of_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chart_of_accounts (tenant_id, id, account_code, account_name, account_type, parent_id, is_active, opening_balance, description, created_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (tenant_id, id, supplier_name, company_name, contact_person, email_address, phone_number, address, bank_details, tax_id, payment_terms, supplier_category, notes, created_at, country, currency) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (tenant_id, id, company_name, address, location, country, phone, email, kra_pin, logo_base64, paybill_number, bank_name, account_number, bank_branch, branch_code, bank_code, swift_code, terms_conditions, invoice_prefix, next_invoice_number, quotation_prefix, next_quotation_number, last_invoice_month, last_quotation_month, smtp_host, smtp_port, smtp_user, smtp_pass, vat_rate, base_currency, income_tax_rate, tax_filing_frequency, credit_note_prefix, next_credit_note_number, last_credit_note_month, updated_at, created_at) FROM stdin;
92afe6fb-12e2-49c0-853a-1d09d9ec5e8b	fa9470e9-6299-4f86-9107-f139b4decfae	Dummy Company			KE													INV	1	QTN	1				587			16	KES	0	monthly	CN	1		2026-07-04 18:55:43.020453	2026-07-04 18:55:43.020453
\.


--
-- Data for Name: credit_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credit_notes (tenant_id, id, credit_note_number, invoice_id, customer_id, customer_name, customer_email, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, reason, notes, payment_terms, issue_date, created_at, vat_rate, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (tenant_id, id, customer_name, company_name, contact_person, email_address, phone_number, billing_address, shipping_address, tax_id, country, payment_terms, credit_limit, notes, created_at, currency) FROM stdin;
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deals (tenant_id, id, deal_name, customer_id, contact_name, contact_email, contact_phone, deal_value, currency, pipeline_stage, probability, expected_close_date, notes, status, created_at) FROM stdin;
\.


--
-- Data for Name: debit_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.debit_notes (tenant_id, id, debit_note_number, purchase_invoice_id, client_id, client_name, description, quantity, unit_price, amount, reason, notes, issue_date, created_at, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (tenant_id, id, employee_code, name, date_of_birth, national_id, tax_pin, phone, email, address, department, job_title, date_of_hire, employment_type, bank_name, account_number, emergency_contact_name, emergency_contact_phone, notes, salary, salary_encrypted, national_id_encrypted, bank_account_encrypted, created_at) FROM stdin;
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exchange_rates (tenant_id, id, source_currency, target_currency, rate, rate_date, created_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (tenant_id, id, expense_code, category, description, supplier_vendor, invoice_receipt_number, amount, tax_vat, expense_date, payment_method, paid_by, status, notes, created_at, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: fixed_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fixed_assets (tenant_id, id, asset_name, asset_type, purchase_date, purchase_cost, useful_life_years, depreciation_method, salvage_value, accumulated_depreciation, book_value, status, disposal_date, disposal_amount, notes, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_items (tenant_id, id, item_name, sku, category, unit_of_measure, opening_stock, current_stock, unit_cost, reorder_level, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_transactions (tenant_id, id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, transaction_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_entries (tenant_id, id, entry_number, description, entry_date, reference, status, created_at) FROM stdin;
\.


--
-- Data for Name: journal_entry_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_entry_lines (tenant_id, id, journal_entry_id, account_id, description, debit_amount, credit_amount, created_at) FROM stdin;
\.


--
-- Data for Name: notification_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_log (tenant_id, id, user_id, notification_type, title, message, channel, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (tenant_id, id, user_id, email_notifications, sms_notifications, in_app_notifications, invoice_reminders, payment_confirmations, low_stock_alerts, approval_requests, created_at) FROM stdin;
\.


--
-- Data for Name: other_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.other_transactions (tenant_id, id, type, category, description, amount, currency, exchange_rate, transaction_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (tenant_id, id, invoice_id, customer_id, customer_name, amount, payment_date, payment_method, notes, created_at, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: project_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_transactions (tenant_id, id, project_id, entity_type, entity_id, amount, transaction_date, description, created_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (tenant_id, id, project_name, description, start_date, end_date, budget, currency, customer_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_invoices (tenant_id, id, invoice_number, po_id, client_id, client_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, created_at, vat_rate, client_country, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (tenant_id, id, po_number, client_id, client_name, description, quantity, unit_price, subtotal, tax_vat, amount, delivery_date, status, notes, issue_date, created_at, vat_rate, client_country, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotations (tenant_id, id, quotation_number, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, amount, valid_until, due_date, status, notes, items, issue_date, created_at, vat_rate, customer_country, currency, exchange_rate, discounts) FROM stdin;
\.


--
-- Data for Name: reconciliation_runs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reconciliation_runs (tenant_id, id, bank_account_id, statement_balance, system_balance, difference, start_date, end_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: recurring_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recurring_templates (tenant_id, id, template_name, entity_type, template_data, frequency, interval_count, next_run_date, last_run_date, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: salaries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salaries (tenant_id, id, employee_id, employee_name, basic_salary, allowances, deductions, overtime, bonuses, amount, amount_encrypted, pay_date, payment_method, payslip_reference, status, created_at, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_invoices (tenant_id, id, invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, items, issue_date, due_date, created_at, vat_rate, exchange_rate, customer_country, currency) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, token, expires_at, client_db, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: subscription_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_events (id, user_id, event_type, description, metadata, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: supplier_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_payments (tenant_id, id, invoice_id, client_id, client_name, amount, payment_date, payment_method, notes, created_at, currency, exchange_rate) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, created_at) FROM stdin;
73f6c416-a84c-4e39-8167-e62b2fc4d169	default_tenant	2026-07-04 18:03:28.499591+03
92afe6fb-12e2-49c0-853a-1d09d9ec5e8b	dummy_client	2026-07-04 18:51:02.508833+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, first_name, last_name, phone, role, verified, subscription_plan, subscription_status, subscription_expiry, grace_period_end, last_reminder_sent, created_at, updated_at, tenant_id, encryption_key, card_last4, card_expiry, paypal_email, trial_start_date, trial_end_date, trial_used, password_hash, license_status, country) FROM stdin;
1	Evanromanoff@gmail.com	$2b$10$O0RsWK3eRukLlEh3tPRJ7eI.IUCB95Okd2m7kDs/KGCpWqIYtUKzq	\N	\N	\N	admin	t	premium	active	2027-07-04 16:21:34.186724	\N	\N	2026-07-04 16:21:34.186724	2026-07-04 16:21:34.186724	\N	\N	\N	\N	\N	\N	\N	0	$2b$10$O0RsWK3eRukLlEh3tPRJ7eI.IUCB95Okd2m7kDs/KGCpWqIYtUKzq	active	KE
2	Mambombaya1992@gmail.com	$2b$10$lfQk9jlDnq0vVe6xHG86H.80wOIGRJj0x91dECeDgd4wbSJtSpOFC	Mambombaya	User	\N	admin	t	premium	inactive	\N	\N	\N	2026-07-04 19:20:09.025827	2026-07-04 19:20:09.025827	92afe6fb-12e2-49c0-853a-1d09d9ec5e8b	\N	\N	\N	\N	\N	\N	0	$2b$10$Tx9EukygzPa.29KQfFYYmuoOQvrsQYFqxxbWCSE5rLEi4yXfXQh/q	active	KE
3	admin@test.com	$2b$10$/D9iMheDcCXySa5By.t.eexGg9Lsg6MkT6Fc0EgrccRLf6.F2gUZO	Admin	User	\N	admin	t	trial	active	\N	\N	\N	2025-10-27 16:24:57	2026-07-05 12:03:46.145598	73f6c416-a84c-4e39-8167-e62b2fc4d169	\N	\N	\N	\N	\N	\N	0	$2b$10$/D9iMheDcCXySa5By.t.eexGg9Lsg6MkT6Fc0EgrccRLf6.F2gUZO	trial	KE
4	evanromanoff+test@gmail.com	$2b$10$mKFqZSNdEqOQdWFdEUQ/wewTbmRWHq1P3ciH7TXpmVngBzhh26wBO	Evan	Romanoff	\N	admin	t	trial	active	\N	\N	\N	2025-12-31 21:29:43.154	2026-07-05 12:03:46.176777	73f6c416-a84c-4e39-8167-e62b2fc4d169	\N	\N	\N	\N	\N	\N	0	$2b$10$mKFqZSNdEqOQdWFdEUQ/wewTbmRWHq1P3ciH7TXpmVngBzhh26wBO	trial	KE
5	mambombaya1992@gmail.com	$2b$10$NjHevTMjmrgGvlga0IgneO42oKOju.l0jGLwdeEGM0P8Fsp8iXye.	Enock	Barasa	\N	admin	t	Premium	active	\N	\N	\N	2025-10-29 14:12:35.081	2026-07-05 12:03:46.178483	73f6c416-a84c-4e39-8167-e62b2fc4d169	\N	\N	\N	\N	\N	\N	0	$2b$10$NjHevTMjmrgGvlga0IgneO42oKOju.l0jGLwdeEGM0P8Fsp8iXye.	active	KE
6	digitalbaroz@gmail.com	$2b$10$15iNV3Getkw0G9dsCciF2.Vm5/rYKy2QNoyIIct.eXtdCy.BPbMqK	Digital	Baroz	\N	super_admin	t	Basic	active	\N	\N	\N	2025-12-29 07:33:51.237	2026-07-05 12:03:46.180496	73f6c416-a84c-4e39-8167-e62b2fc4d169	\N	\N	\N	\N	\N	\N	0	$2b$10$15iNV3Getkw0G9dsCciF2.Vm5/rYKy2QNoyIIct.eXtdCy.BPbMqK	trial	KE
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhooks (tenant_id, id, webhook_name, url, events, secret, is_active, last_triggered_at, created_at) FROM stdin;
\.


--
-- Name: billing_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.billing_history_id_seq', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: subscription_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_events_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: approval_workflows approval_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: bank_statements bank_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statements
    ADD CONSTRAINT bank_statements_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: billing_history billing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: capital_transactions capital_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capital_transactions
    ADD CONSTRAINT capital_transactions_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: chart_of_accounts chart_of_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: company_settings company_settings_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_tenant_id_key UNIQUE (tenant_id);


--
-- Name: credit_notes credit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: debit_notes debit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: fixed_assets fixed_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: journal_entry_lines journal_entry_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: other_transactions other_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.other_transactions
    ADD CONSTRAINT other_transactions_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: project_transactions project_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_transactions
    ADD CONSTRAINT project_transactions_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: purchase_invoices purchase_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: reconciliation_runs reconciliation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_runs
    ADD CONSTRAINT reconciliation_runs_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: recurring_templates recurring_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_templates
    ADD CONSTRAINT recurring_templates_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: salaries salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- Name: subscription_events subscription_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_pkey PRIMARY KEY (id);


--
-- Name: supplier_payments supplier_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: api_keys api_keys_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: approval_requests approval_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: approval_workflows approval_workflows_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: articles articles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: audit_log audit_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: bank_accounts bank_accounts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: bank_statements bank_statements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statements
    ADD CONSTRAINT bank_statements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: billing_history billing_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: budgets budgets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: capital_transactions capital_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capital_transactions
    ADD CONSTRAINT capital_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: chart_of_accounts chart_of_accounts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: clients clients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: company_settings company_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: credit_notes credit_notes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: customers customers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: deals deals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: debit_notes debit_notes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: employees employees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: exchange_rates exchange_rates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: expenses expenses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: fixed_assets fixed_assets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: inventory_items inventory_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: inventory_transactions inventory_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: journal_entries journal_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: journal_entry_lines journal_entry_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notification_log notification_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notification_preferences notification_preferences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: other_transactions other_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.other_transactions
    ADD CONSTRAINT other_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: payments payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: project_transactions project_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_transactions
    ADD CONSTRAINT project_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: projects projects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: purchase_invoices purchase_invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: purchase_orders purchase_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: quotations quotations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: reconciliation_runs reconciliation_runs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_runs
    ADD CONSTRAINT reconciliation_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: recurring_templates recurring_templates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_templates
    ADD CONSTRAINT recurring_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: salaries salaries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: sales_invoices sales_invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscription_events subscription_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: supplier_payments supplier_payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: webhooks webhooks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dRx0okpYbmaEtqXrc7M84gYEsaee2pCqKIZh6ikY6J6irY4K3cgNbTbO0rbrNO8

