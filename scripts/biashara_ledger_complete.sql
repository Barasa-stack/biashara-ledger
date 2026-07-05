--
-- PostgreSQL database dump
--

\restrict hz3vs768SBivF8r1Z9a2dm5qKpPBp4qOZeM3rmBM43oWWapz8FHscg16YiXhSSg

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

ALTER TABLE IF EXISTS ONLY public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_quotation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.salaries DROP CONSTRAINT IF EXISTS salaries_employee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_po_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.offline_sessions DROP CONSTRAINT IF EXISTS offline_sessions_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_payments DROP CONSTRAINT IF EXISTS fk_sp_invoice;
ALTER TABLE IF EXISTS ONLY public.supplier_payments DROP CONSTRAINT IF EXISTS fk_sp_client;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS fk_sales_invoices_customer;
ALTER TABLE IF EXISTS ONLY public.salaries DROP CONSTRAINT IF EXISTS fk_salaries_employee;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS fk_quotations_customer;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS fk_po_client;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS fk_pi_po;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS fk_pi_client;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS fk_payments_invoice;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS fk_payments_customer;
ALTER TABLE IF EXISTS ONLY public.debit_notes DROP CONSTRAINT IF EXISTS fk_dn_pi;
ALTER TABLE IF EXISTS ONLY public.debit_notes DROP CONSTRAINT IF EXISTS fk_dn_client;
ALTER TABLE IF EXISTS ONLY public.credit_notes DROP CONSTRAINT IF EXISTS fk_credit_notes_invoice;
ALTER TABLE IF EXISTS ONLY public.credit_notes DROP CONSTRAINT IF EXISTS fk_credit_notes_customer;
ALTER TABLE IF EXISTS ONLY public.debit_notes DROP CONSTRAINT IF EXISTS debit_notes_purchase_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.debit_notes DROP CONSTRAINT IF EXISTS debit_notes_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.credit_notes DROP CONSTRAINT IF EXISTS credit_notes_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.credit_notes DROP CONSTRAINT IF EXISTS credit_notes_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.billing_history DROP CONSTRAINT IF EXISTS billing_history_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.admin_license_keys DROP CONSTRAINT IF EXISTS admin_license_keys_client_id_fkey;
DROP INDEX IF EXISTS public.idx_users_tenant_id;
DROP INDEX IF EXISTS public.idx_supplier_payments_tenant_id;
DROP INDEX IF EXISTS public.idx_supplier_payments_invoice_id;
DROP INDEX IF EXISTS public.idx_supplier_payments_date;
DROP INDEX IF EXISTS public.idx_subscription_events_tenant_id;
DROP INDEX IF EXISTS public.idx_sp_invoice;
DROP INDEX IF EXISTS public.idx_sp_client;
DROP INDEX IF EXISTS public.idx_si_status;
DROP INDEX IF EXISTS public.idx_si_date;
DROP INDEX IF EXISTS public.idx_sessions_user;
DROP INDEX IF EXISTS public.idx_sessions_token;
DROP INDEX IF EXISTS public.idx_sessions_tenant_id;
DROP INDEX IF EXISTS public.idx_sales_invoices_tenant_id;
DROP INDEX IF EXISTS public.idx_sales_invoices_status;
DROP INDEX IF EXISTS public.idx_sales_invoices_date;
DROP INDEX IF EXISTS public.idx_sales_invoices_customer_id;
DROP INDEX IF EXISTS public.idx_sales_invoices_customer;
DROP INDEX IF EXISTS public.idx_salaries_tenant_id;
DROP INDEX IF EXISTS public.idx_salaries_status;
DROP INDEX IF EXISTS public.idx_salaries_employee_id;
DROP INDEX IF EXISTS public.idx_salaries_employee;
DROP INDEX IF EXISTS public.idx_salaries_date;
DROP INDEX IF EXISTS public.idx_rr_ba;
DROP INDEX IF EXISTS public.idx_quotations_tenant_id;
DROP INDEX IF EXISTS public.idx_quotations_customer_id;
DROP INDEX IF EXISTS public.idx_quotations_customer;
DROP INDEX IF EXISTS public.idx_purchase_orders_tenant_id;
DROP INDEX IF EXISTS public.idx_purchase_invoices_tenant_id;
DROP INDEX IF EXISTS public.idx_purchase_invoices_status;
DROP INDEX IF EXISTS public.idx_purchase_invoices_date;
DROP INDEX IF EXISTS public.idx_pt_project;
DROP INDEX IF EXISTS public.idx_projects_customer;
DROP INDEX IF EXISTS public.idx_po_client;
DROP INDEX IF EXISTS public.idx_pi_status;
DROP INDEX IF EXISTS public.idx_pi_po;
DROP INDEX IF EXISTS public.idx_pi_client;
DROP INDEX IF EXISTS public.idx_payments_tenant_id;
DROP INDEX IF EXISTS public.idx_payments_invoice_id;
DROP INDEX IF EXISTS public.idx_payments_invoice;
DROP INDEX IF EXISTS public.idx_payments_date;
DROP INDEX IF EXISTS public.idx_payments_customer;
DROP INDEX IF EXISTS public.idx_nl_user;
DROP INDEX IF EXISTS public.idx_nl_read;
DROP INDEX IF EXISTS public.idx_jel_je;
DROP INDEX IF EXISTS public.idx_jel_account;
DROP INDEX IF EXISTS public.idx_je_status;
DROP INDEX IF EXISTS public.idx_je_date;
DROP INDEX IF EXISTS public.idx_it_item;
DROP INDEX IF EXISTS public.idx_expenses_tenant_id;
DROP INDEX IF EXISTS public.idx_expenses_status;
DROP INDEX IF EXISTS public.idx_expenses_date;
DROP INDEX IF EXISTS public.idx_employees_tenant_id;
DROP INDEX IF EXISTS public.idx_employees_id;
DROP INDEX IF EXISTS public.idx_dn_pi;
DROP INDEX IF EXISTS public.idx_dn_client;
DROP INDEX IF EXISTS public.idx_debit_notes_tenant_id;
DROP INDEX IF EXISTS public.idx_debit_notes_date;
DROP INDEX IF EXISTS public.idx_deals_customer;
DROP INDEX IF EXISTS public.idx_customers_tenant_id;
DROP INDEX IF EXISTS public.idx_customers_name;
DROP INDEX IF EXISTS public.idx_customers_id;
DROP INDEX IF EXISTS public.idx_credit_notes_tenant_id;
DROP INDEX IF EXISTS public.idx_credit_notes_invoice;
DROP INDEX IF EXISTS public.idx_credit_notes_date;
DROP INDEX IF EXISTS public.idx_credit_notes_customer;
DROP INDEX IF EXISTS public.idx_company_settings_tenant_id;
DROP INDEX IF EXISTS public.idx_coa_parent;
DROP INDEX IF EXISTS public.idx_clients_tenant_id;
DROP INDEX IF EXISTS public.idx_clients_name;
DROP INDEX IF EXISTS public.idx_clients_id;
DROP INDEX IF EXISTS public.idx_bs_ba;
DROP INDEX IF EXISTS public.idx_billing_history_tenant_id;
DROP INDEX IF EXISTS public.idx_ar_requestor;
DROP INDEX IF EXISTS public.idx_ar_approver;
DROP INDEX IF EXISTS public.idx_al_entity;
DROP INDEX IF EXISTS public.idx_al_date;
ALTER TABLE IF EXISTS ONLY public.webhooks DROP CONSTRAINT IF EXISTS webhooks_pkey;
ALTER TABLE IF EXISTS ONLY public.verification_codes DROP CONSTRAINT IF EXISTS verification_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS uq_je_number;
ALTER TABLE IF EXISTS ONLY public.chart_of_accounts DROP CONSTRAINT IF EXISTS uq_coa_code;
ALTER TABLE IF EXISTS ONLY public.api_keys DROP CONSTRAINT IF EXISTS uq_api_keys_key;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.sync_queue DROP CONSTRAINT IF EXISTS sync_queue_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_token_key;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.salaries DROP CONSTRAINT IF EXISTS salaries_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_name_key;
ALTER TABLE IF EXISTS ONLY public.recurring_templates DROP CONSTRAINT IF EXISTS recurring_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_runs DROP CONSTRAINT IF EXISTS reconciliation_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.rate_limits DROP CONSTRAINT IF EXISTS rate_limits_pkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.project_transactions DROP CONSTRAINT IF EXISTS project_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.other_transactions DROP CONSTRAINT IF EXISTS other_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.offline_sessions DROP CONSTRAINT IF EXISTS offline_sessions_session_token_key;
ALTER TABLE IF EXISTS ONLY public.offline_sessions DROP CONSTRAINT IF EXISTS offline_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_log DROP CONSTRAINT IF EXISTS notification_log_pkey;
ALTER TABLE IF EXISTS ONLY public.licenses DROP CONSTRAINT IF EXISTS licenses_pkey;
ALTER TABLE IF EXISTS ONLY public.licenses DROP CONSTRAINT IF EXISTS licenses_license_key_key;
ALTER TABLE IF EXISTS ONLY public.licenses DROP CONSTRAINT IF EXISTS licenses_license_id_key;
ALTER TABLE IF EXISTS ONLY public.license_keys DROP CONSTRAINT IF EXISTS license_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.license_keys DROP CONSTRAINT IF EXISTS license_keys_license_key_key;
ALTER TABLE IF EXISTS ONLY public.license_installations DROP CONSTRAINT IF EXISTS license_installations_pkey;
ALTER TABLE IF EXISTS ONLY public.license_activations DROP CONSTRAINT IF EXISTS license_activations_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_entry_lines DROP CONSTRAINT IF EXISTS journal_entry_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_pkey;
ALTER TABLE IF EXISTS ONLY public.fixed_assets DROP CONSTRAINT IF EXISTS fixed_assets_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS email_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.electron_activity DROP CONSTRAINT IF EXISTS electron_activity_pkey;
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
ALTER TABLE IF EXISTS ONLY public.backups DROP CONSTRAINT IF EXISTS backups_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_requests DROP CONSTRAINT IF EXISTS approval_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.app_updates DROP CONSTRAINT IF EXISTS app_updates_pkey;
ALTER TABLE IF EXISTS ONLY public.api_keys DROP CONSTRAINT IF EXISTS api_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics DROP CONSTRAINT IF EXISTS analytics_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_users DROP CONSTRAINT IF EXISTS admin_users_username_key;
ALTER TABLE IF EXISTS ONLY public.admin_users DROP CONSTRAINT IF EXISTS admin_users_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_license_keys DROP CONSTRAINT IF EXISTS admin_license_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_license_keys DROP CONSTRAINT IF EXISTS admin_license_keys_license_key_key;
ALTER TABLE IF EXISTS ONLY public.admin_clients DROP CONSTRAINT IF EXISTS admin_clients_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_clients DROP CONSTRAINT IF EXISTS admin_clients_license_key_key;
ALTER TABLE IF EXISTS ONLY public.admin_clients DROP CONSTRAINT IF EXISTS admin_clients_email_key;
ALTER TABLE IF EXISTS ONLY public.admin_clients DROP CONSTRAINT IF EXISTS admin_clients_database_name_key;
ALTER TABLE IF EXISTS public.verification_codes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sync_queue ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.supplier_payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subscription_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.salaries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.purchase_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.purchase_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.offline_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.licenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.license_keys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.license_installations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.license_activations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.electron_activity ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.debit_notes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.credit_notes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clients ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.billing_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.backups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_updates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.analytics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_license_keys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_clients ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.webhooks;
DROP SEQUENCE IF EXISTS public.verification_codes_id_seq;
DROP TABLE IF EXISTS public.verification_codes;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.tenants;
DROP SEQUENCE IF EXISTS public.sync_queue_id_seq;
DROP TABLE IF EXISTS public.sync_queue;
DROP SEQUENCE IF EXISTS public.supplier_payments_id_seq;
DROP TABLE IF EXISTS public.supplier_payments;
DROP SEQUENCE IF EXISTS public.subscription_events_id_seq;
DROP TABLE IF EXISTS public.subscription_events;
DROP SEQUENCE IF EXISTS public.sessions_id_seq;
DROP TABLE IF EXISTS public.sessions;
DROP SEQUENCE IF EXISTS public.sales_invoices_id_seq;
DROP TABLE IF EXISTS public.sales_invoices;
DROP SEQUENCE IF EXISTS public.salaries_id_seq;
DROP TABLE IF EXISTS public.salaries;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.recurring_templates;
DROP TABLE IF EXISTS public.reconciliation_runs;
DROP TABLE IF EXISTS public.rate_limits;
DROP SEQUENCE IF EXISTS public.quotations_id_seq;
DROP TABLE IF EXISTS public.quotations;
DROP SEQUENCE IF EXISTS public.purchase_orders_id_seq;
DROP TABLE IF EXISTS public.purchase_orders;
DROP SEQUENCE IF EXISTS public.purchase_invoices_id_seq;
DROP TABLE IF EXISTS public.purchase_invoices;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.project_transactions;
DROP SEQUENCE IF EXISTS public.payments_id_seq;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.other_transactions;
DROP SEQUENCE IF EXISTS public.offline_sessions_id_seq;
DROP TABLE IF EXISTS public.offline_sessions;
DROP TABLE IF EXISTS public.notification_preferences;
DROP TABLE IF EXISTS public.notification_log;
DROP SEQUENCE IF EXISTS public.licenses_id_seq;
DROP TABLE IF EXISTS public.licenses;
DROP SEQUENCE IF EXISTS public.license_keys_id_seq;
DROP TABLE IF EXISTS public.license_keys;
DROP SEQUENCE IF EXISTS public.license_installations_id_seq;
DROP TABLE IF EXISTS public.license_installations;
DROP SEQUENCE IF EXISTS public.license_activations_id_seq;
DROP TABLE IF EXISTS public.license_activations;
DROP TABLE IF EXISTS public.journal_entry_lines;
DROP TABLE IF EXISTS public.journal_entries;
DROP TABLE IF EXISTS public.inventory_transactions;
DROP TABLE IF EXISTS public.inventory_items;
DROP TABLE IF EXISTS public.fixed_assets;
DROP SEQUENCE IF EXISTS public.expenses_id_seq;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.exchange_rates;
DROP SEQUENCE IF EXISTS public.employees_id_seq;
DROP TABLE IF EXISTS public.employees;
DROP SEQUENCE IF EXISTS public.email_logs_id_seq;
DROP TABLE IF EXISTS public.email_logs;
DROP SEQUENCE IF EXISTS public.electron_activity_id_seq;
DROP TABLE IF EXISTS public.electron_activity;
DROP SEQUENCE IF EXISTS public.debit_notes_id_seq;
DROP TABLE IF EXISTS public.debit_notes;
DROP TABLE IF EXISTS public.deals;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.credit_notes_id_seq;
DROP TABLE IF EXISTS public.credit_notes;
DROP SEQUENCE IF EXISTS public.company_settings_id_seq;
DROP TABLE IF EXISTS public.company_settings;
DROP SEQUENCE IF EXISTS public.clients_id_seq;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.chart_of_accounts;
DROP TABLE IF EXISTS public.capital_transactions;
DROP TABLE IF EXISTS public.budgets;
DROP SEQUENCE IF EXISTS public.billing_history_id_seq;
DROP TABLE IF EXISTS public.billing_history;
DROP TABLE IF EXISTS public.bank_statements;
DROP TABLE IF EXISTS public.bank_accounts;
DROP SEQUENCE IF EXISTS public.backups_id_seq;
DROP TABLE IF EXISTS public.backups;
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.approval_workflows;
DROP TABLE IF EXISTS public.approval_requests;
DROP SEQUENCE IF EXISTS public.app_updates_id_seq;
DROP TABLE IF EXISTS public.app_updates;
DROP TABLE IF EXISTS public.api_keys;
DROP SEQUENCE IF EXISTS public.analytics_id_seq;
DROP TABLE IF EXISTS public.analytics;
DROP SEQUENCE IF EXISTS public.admin_users_id_seq;
DROP TABLE IF EXISTS public.admin_users;
DROP SEQUENCE IF EXISTS public.admin_license_keys_id_seq;
DROP TABLE IF EXISTS public.admin_license_keys;
DROP SEQUENCE IF EXISTS public.admin_clients_id_seq;
DROP TABLE IF EXISTS public.admin_clients;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_clients (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    database_name character varying(255) NOT NULL,
    license_key character varying(255),
    max_users integer DEFAULT 5,
    is_active boolean DEFAULT true,
    is_trial boolean DEFAULT true,
    trial_start_date timestamp without time zone,
    trial_end_date timestamp without time zone,
    expires_at timestamp without time zone,
    last_active timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    plan character varying(50) DEFAULT 'basic'::character varying
);


--
-- Name: admin_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_clients_id_seq OWNED BY public.admin_clients.id;


--
-- Name: admin_license_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_license_keys (
    id integer NOT NULL,
    license_key character varying(255) NOT NULL,
    client_id integer,
    plan character varying(50) DEFAULT 'standard'::character varying,
    is_used boolean DEFAULT false,
    activated_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hardware_fingerprint text DEFAULT ''::text,
    last_heartbeat timestamp with time zone,
    last_ip character varying(45) DEFAULT ''::character varying,
    is_active boolean DEFAULT true
);


--
-- Name: admin_license_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_license_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_license_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_license_keys_id_seq OWNED BY public.admin_license_keys.id;


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password_hash text NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_change_required integer DEFAULT 1
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics (
    id integer NOT NULL,
    license_id character varying(255),
    event character varying(100),
    app_version character varying(50),
    os_version character varying(50),
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_id_seq OWNED BY public.analytics.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    tenant_id text NOT NULL,
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
-- Name: app_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_updates (
    id integer NOT NULL,
    version character varying(50) NOT NULL,
    changes jsonb DEFAULT '[]'::jsonb,
    release_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: app_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_updates_id_seq OWNED BY public.app_updates.id;


--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_requests (
    tenant_id text NOT NULL,
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
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_name text DEFAULT ''::text NOT NULL,
    entity_type text NOT NULL,
    trigger_amount real DEFAULT 0,
    approver_role text DEFAULT 'admin'::text,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    tenant_id text NOT NULL,
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
-- Name: backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backups (
    id integer NOT NULL,
    license_key character varying(255) NOT NULL,
    data jsonb NOT NULL,
    file_size integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: backups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.backups_id_seq OWNED BY public.backups.id;


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_accounts (
    tenant_id text NOT NULL,
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
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bank_account_id uuid NOT NULL,
    transaction_date text NOT NULL,
    description text DEFAULT ''::text,
    reference text DEFAULT ''::text,
    amount real DEFAULT 0 NOT NULL,
    type text DEFAULT 'DEBIT'::text NOT NULL,
    balance numeric(14,2) DEFAULT 0,
    status text DEFAULT 'unreconciled'::text,
    reconciliation_id uuid,
    matched_transaction_type text DEFAULT ''::text,
    matched_transaction_id text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text
);


--
-- Name: billing_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount real NOT NULL,
    currency text DEFAULT 'KES'::text,
    plan_name text NOT NULL,
    payment_method text DEFAULT 'mpesa'::text,
    transaction_id text DEFAULT ''::text,
    status text DEFAULT 'completed'::text,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id text
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
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fiscal_year integer DEFAULT EXTRACT(year FROM now()) NOT NULL,
    period text DEFAULT 'MONTHLY'::text NOT NULL,
    category_type text DEFAULT 'REVENUE'::text NOT NULL,
    category_name text DEFAULT ''::text,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: capital_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capital_transactions (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text DEFAULT 'CAPITAL_INJECTION'::text NOT NULL,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    transaction_date date NOT NULL,
    description text DEFAULT ''::text,
    reference text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: chart_of_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_of_accounts (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    account_type text DEFAULT 'EXPENSE'::text NOT NULL,
    parent_id uuid,
    is_active integer DEFAULT 1,
    opening_balance numeric(14,2) DEFAULT 0,
    description text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id integer NOT NULL,
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
    currency text DEFAULT ''::text,
    tenant_id text,
    country text DEFAULT ''::text
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
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
    updated_at timestamp without time zone DEFAULT now(),
    vat_rate numeric(14,2) DEFAULT 16,
    credit_note_prefix text DEFAULT 'CN'::text,
    next_credit_note_number integer DEFAULT 1,
    last_credit_note_month text DEFAULT ''::text,
    tenant_id text DEFAULT 'local-default'::text,
    income_tax_rate numeric(14,2) DEFAULT 0,
    tax_filing_frequency text DEFAULT 'monthly'::text,
    base_currency text DEFAULT 'USD'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: credit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_notes (
    id integer NOT NULL,
    credit_note_number text DEFAULT ''::text,
    invoice_id integer NOT NULL,
    customer_id integer NOT NULL,
    customer_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity numeric(14,2) DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    reason text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    issue_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    customer_email text DEFAULT ''::text,
    subtotal numeric(14,2) DEFAULT 0,
    tax_vat numeric(14,2) DEFAULT 0,
    discounts numeric(14,2) DEFAULT 0,
    payment_terms text DEFAULT 'Net 30'::text,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text,
    vat_rate real DEFAULT 0
);


--
-- Name: credit_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: credit_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_notes_id_seq OWNED BY public.credit_notes.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    company_name text DEFAULT ''::text,
    contact_person text DEFAULT ''::text,
    email_address text DEFAULT ''::text,
    phone_number text DEFAULT ''::text,
    billing_address text DEFAULT ''::text,
    shipping_address text DEFAULT ''::text,
    tax_id text DEFAULT ''::text,
    payment_terms text DEFAULT 'Net 30'::text,
    credit_limit numeric(14,2) DEFAULT 0,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    country text DEFAULT ''::text,
    currency text DEFAULT ''::text,
    tenant_id text
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_name text DEFAULT ''::text NOT NULL,
    customer_id uuid,
    contact_name text DEFAULT ''::text,
    contact_email text DEFAULT ''::text,
    contact_phone text DEFAULT ''::text,
    deal_value numeric(14,2) DEFAULT 0,
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
    id integer NOT NULL,
    debit_note_number text DEFAULT ''::text,
    purchase_invoice_id integer NOT NULL,
    client_id integer NOT NULL,
    client_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity numeric(14,2) DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    reason text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    issue_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text
);


--
-- Name: debit_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debit_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: debit_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debit_notes_id_seq OWNED BY public.debit_notes.id;


--
-- Name: electron_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.electron_activity (
    id integer NOT NULL,
    license_key character varying(255) NOT NULL,
    action character varying(100) NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(45) DEFAULT ''::character varying,
    created_at timestamp with time zone DEFAULT now(),
    session_token text DEFAULT ''::text,
    hardware_fingerprint text DEFAULT ''::text
);


--
-- Name: electron_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.electron_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: electron_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.electron_activity_id_seq OWNED BY public.electron_activity.id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id integer NOT NULL,
    recipient character varying(255) NOT NULL,
    email_type character varying(50) NOT NULL,
    success integer DEFAULT 0,
    detail text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
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
    salary numeric(14,2) DEFAULT 0,
    salary_encrypted text,
    national_id_encrypted text,
    bank_account_encrypted text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id text
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    tenant_id text NOT NULL,
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
    id integer NOT NULL,
    expense_code text DEFAULT ''::text,
    category text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text,
    supplier_vendor text DEFAULT ''::text,
    invoice_receipt_number text DEFAULT ''::text,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    tax_vat real DEFAULT 0,
    expense_date date NOT NULL,
    payment_method text DEFAULT 'cash'::text,
    paid_by text DEFAULT ''::text,
    status text DEFAULT 'pending'::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: fixed_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fixed_assets (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_name text DEFAULT ''::text NOT NULL,
    asset_type text DEFAULT 'Equipment'::text,
    purchase_date date NOT NULL,
    purchase_cost numeric(14,2) DEFAULT 0 NOT NULL,
    useful_life_years real DEFAULT 5 NOT NULL,
    depreciation_method text DEFAULT 'straight-line'::text,
    salvage_value numeric(14,2) DEFAULT 0,
    accumulated_depreciation numeric(14,2) DEFAULT 0,
    book_value numeric(14,2) DEFAULT 0,
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
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    sku text DEFAULT ''::text,
    category text DEFAULT ''::text,
    unit_of_measure text DEFAULT 'pcs'::text,
    opening_stock numeric(14,2) DEFAULT 0,
    current_stock numeric(14,2) DEFAULT 0,
    unit_cost numeric(14,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    reorder_level real DEFAULT 0
);


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    tenant_id text NOT NULL,
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
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_number text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    entry_date date NOT NULL,
    reference text DEFAULT ''::text,
    status text DEFAULT 'draft'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: journal_entry_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entry_lines (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    account_id uuid NOT NULL,
    description text DEFAULT ''::text,
    debit_amount numeric(14,2) DEFAULT 0,
    credit_amount numeric(14,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: license_activations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_activations (
    id integer NOT NULL,
    license_key character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    hardware_fingerprint text DEFAULT ''::text,
    ip_address character varying(45) DEFAULT ''::character varying,
    device_info text DEFAULT ''::text,
    status character varying(20) DEFAULT 'success'::character varying,
    error_reason text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: license_activations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.license_activations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: license_activations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.license_activations_id_seq OWNED BY public.license_activations.id;


--
-- Name: license_installations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_installations (
    id integer NOT NULL,
    license_key character varying(255),
    hardware_fingerprint text,
    installation_date timestamp without time zone DEFAULT now(),
    last_seen timestamp without time zone,
    ip_address character varying(45),
    device_info text,
    status character varying(20) DEFAULT 'active'::character varying
);


--
-- Name: license_installations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.license_installations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: license_installations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.license_installations_id_seq OWNED BY public.license_installations.id;


--
-- Name: license_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_keys (
    id integer NOT NULL,
    license_key character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    license_type character varying(50) DEFAULT 'standard'::character varying,
    status character varying(20) DEFAULT 'unused'::character varying,
    user_id integer,
    expires_at timestamp with time zone,
    activated_at timestamp without time zone,
    hardware_fingerprint text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    offline_session_token text DEFAULT ''::text,
    last_heartbeat timestamp with time zone,
    last_ip character varying(45) DEFAULT ''::character varying,
    activation_count integer DEFAULT 0
);


--
-- Name: license_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.license_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: license_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.license_keys_id_seq OWNED BY public.license_keys.id;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id integer NOT NULL,
    license_key character varying(255) NOT NULL,
    license_id character varying(255) NOT NULL,
    type character varying(50) DEFAULT 'trial'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    hardware_fingerprint text,
    activated boolean DEFAULT false,
    activation_date timestamp without time zone,
    expiry_date timestamp without time zone,
    last_validated timestamp without time zone,
    last_seen timestamp without time zone,
    last_known_ip character varying(45),
    device_info text,
    user_email character varying(255),
    features jsonb DEFAULT '[]'::jsonb,
    revoked boolean DEFAULT false,
    allowed_installations integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.licenses_id_seq OWNED BY public.licenses.id;


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_log (
    tenant_id text NOT NULL,
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
    tenant_id text NOT NULL,
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
-- Name: offline_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offline_sessions (
    id integer NOT NULL,
    client_id integer,
    license_key character varying(255) NOT NULL,
    session_token character varying(255) NOT NULL,
    hardware_fingerprint text DEFAULT ''::text NOT NULL,
    user_email character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    activated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    last_heartbeat timestamp with time zone,
    last_ip character varying(45) DEFAULT ''::character varying,
    last_sync timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: offline_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offline_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offline_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offline_sessions_id_seq OWNED BY public.offline_sessions.id;


--
-- Name: other_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.other_transactions (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text DEFAULT 'OTHER_INCOME'::text NOT NULL,
    category text DEFAULT ''::text,
    description text DEFAULT ''::text,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    transaction_date date NOT NULL,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    customer_id integer NOT NULL,
    customer_name text NOT NULL,
    amount numeric(14,2) NOT NULL,
    payment_date date NOT NULL,
    payment_method text DEFAULT 'cash'::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: project_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_transactions (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    entity_type text DEFAULT 'expense'::text NOT NULL,
    entity_id text DEFAULT ''::text NOT NULL,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    transaction_date text NOT NULL,
    description text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_name text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text,
    start_date text DEFAULT ''::text,
    end_date text DEFAULT ''::text,
    budget numeric(14,2) DEFAULT 0,
    currency text DEFAULT 'USD'::text,
    customer_id uuid,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: purchase_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_invoices (
    id integer NOT NULL,
    invoice_number text DEFAULT ''::text,
    po_id integer,
    client_id integer NOT NULL,
    client_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity numeric(14,2) DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    subtotal numeric(14,2) DEFAULT 0,
    tax_vat numeric(14,2) DEFAULT 0,
    discounts numeric(14,2) DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    payment_terms text DEFAULT 'Net 30'::text,
    status text DEFAULT 'unpaid'::text,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text,
    vat_rate real DEFAULT 0,
    client_country text DEFAULT ''::text
);


--
-- Name: purchase_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_invoices_id_seq OWNED BY public.purchase_invoices.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number text DEFAULT ''::text,
    client_id integer NOT NULL,
    client_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity numeric(14,2) DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    subtotal numeric(14,2) DEFAULT 0,
    tax_vat numeric(14,2) DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    delivery_date text DEFAULT ''::text,
    status text DEFAULT 'pending'::text,
    notes text DEFAULT ''::text,
    issue_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text,
    vat_rate real DEFAULT 0,
    client_country text DEFAULT ''::text
);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotations (
    id integer NOT NULL,
    quotation_number text DEFAULT ''::text,
    customer_id integer NOT NULL,
    customer_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity numeric(14,2) DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    subtotal numeric(14,2) DEFAULT 0,
    tax_vat numeric(14,2) DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    valid_until text DEFAULT ''::text,
    status text DEFAULT 'draft'::text,
    notes text DEFAULT ''::text,
    items text DEFAULT '[]'::text,
    issue_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    due_date text DEFAULT ''::text,
    customer_country text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text,
    vat_rate real DEFAULT 0,
    discounts real DEFAULT 0
);


--
-- Name: quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotations_id_seq OWNED BY public.quotations.id;


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    key text NOT NULL,
    count integer DEFAULT 1,
    expires_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reconciliation_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reconciliation_runs (
    tenant_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bank_account_id uuid NOT NULL,
    statement_balance real DEFAULT 0,
    system_balance real DEFAULT 0,
    difference numeric(14,2) DEFAULT 0,
    start_date text NOT NULL,
    end_date text NOT NULL,
    status text DEFAULT 'in_progress'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: recurring_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_templates (
    tenant_id text NOT NULL,
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
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text,
    permissions text DEFAULT '[]'::text
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: salaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salaries (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    employee_name text NOT NULL,
    basic_salary real DEFAULT 0,
    allowances real DEFAULT 0,
    deductions real DEFAULT 0,
    overtime real DEFAULT 0,
    bonuses real DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    amount_encrypted text,
    pay_date date NOT NULL,
    payment_method text DEFAULT 'bank'::text,
    payslip_reference text DEFAULT ''::text,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text
);


--
-- Name: salaries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salaries_id_seq OWNED BY public.salaries.id;


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_invoices (
    id integer NOT NULL,
    invoice_number text DEFAULT ''::text,
    quotation_id integer,
    customer_id integer NOT NULL,
    customer_name text NOT NULL,
    description text DEFAULT ''::text,
    quantity numeric(14,2) DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    subtotal numeric(14,2) DEFAULT 0,
    tax_vat numeric(14,2) DEFAULT 0,
    discounts numeric(14,2) DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    payment_terms text DEFAULT 'Net 30'::text,
    status text DEFAULT 'unpaid'::text,
    items text DEFAULT '[]'::text,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    customer_country text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text,
    vat_rate real DEFAULT 0
);


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_invoices_id_seq OWNED BY public.sales_invoices.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    client_db text DEFAULT ''::text,
    tenant_id text DEFAULT 'local-default'::text
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
    user_id integer NOT NULL,
    event_type text NOT NULL,
    description text DEFAULT ''::text,
    metadata text DEFAULT '{}'::text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id text
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
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    client_id integer NOT NULL,
    client_name text NOT NULL,
    amount numeric(14,2) NOT NULL,
    payment_date text NOT NULL,
    payment_method text DEFAULT 'cash'::text,
    notes text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    currency text DEFAULT 'USD'::text,
    exchange_rate real DEFAULT 1,
    tenant_id text
);


--
-- Name: supplier_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_payments_id_seq OWNED BY public.supplier_payments.id;


--
-- Name: sync_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_queue (
    id integer NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id integer NOT NULL,
    action character varying(20) NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    synced_at timestamp without time zone,
    attempts integer DEFAULT 0
);


--
-- Name: sync_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sync_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sync_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sync_queue_id_seq OWNED BY public.sync_queue.id;


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
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text DEFAULT ''::text,
    last_name text DEFAULT ''::text,
    phone text DEFAULT ''::text,
    subscription_plan text DEFAULT 'trial'::text,
    subscription_status text DEFAULT 'active'::text,
    verified integer DEFAULT 0,
    subscription_expiry timestamp with time zone,
    role text DEFAULT 'admin'::text,
    encryption_key text,
    grace_period_end timestamp with time zone,
    last_reminder_sent timestamp with time zone,
    payment_method text DEFAULT 'mpesa'::text,
    card_last4 text,
    card_expiry text,
    paypal_email text,
    created_at timestamp with time zone DEFAULT now(),
    trial_start_date timestamp with time zone,
    trial_end_date timestamp with time zone,
    trial_used integer DEFAULT 0,
    license_status text DEFAULT 'trial'::text,
    license_key text DEFAULT ''::text,
    tenant_id text DEFAULT 'local-default'::text,
    country text DEFAULT ''::text,
    two_factor_enabled integer DEFAULT 0
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
-- Name: verification_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_codes (
    id integer NOT NULL,
    email text NOT NULL,
    code text NOT NULL,
    purpose text DEFAULT 'signup'::text NOT NULL,
    data text DEFAULT '{}'::text,
    expires_at timestamp with time zone NOT NULL,
    used integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: verification_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;


--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhooks (
    tenant_id text NOT NULL,
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
-- Name: admin_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_clients ALTER COLUMN id SET DEFAULT nextval('public.admin_clients_id_seq'::regclass);


--
-- Name: admin_license_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_license_keys ALTER COLUMN id SET DEFAULT nextval('public.admin_license_keys_id_seq'::regclass);


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: analytics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics ALTER COLUMN id SET DEFAULT nextval('public.analytics_id_seq'::regclass);


--
-- Name: app_updates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_updates ALTER COLUMN id SET DEFAULT nextval('public.app_updates_id_seq'::regclass);


--
-- Name: backups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backups ALTER COLUMN id SET DEFAULT nextval('public.backups_id_seq'::regclass);


--
-- Name: billing_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_history ALTER COLUMN id SET DEFAULT nextval('public.billing_history_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: credit_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes ALTER COLUMN id SET DEFAULT nextval('public.credit_notes_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: debit_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes ALTER COLUMN id SET DEFAULT nextval('public.debit_notes_id_seq'::regclass);


--
-- Name: electron_activity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electron_activity ALTER COLUMN id SET DEFAULT nextval('public.electron_activity_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: license_activations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_activations ALTER COLUMN id SET DEFAULT nextval('public.license_activations_id_seq'::regclass);


--
-- Name: license_installations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_installations ALTER COLUMN id SET DEFAULT nextval('public.license_installations_id_seq'::regclass);


--
-- Name: license_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys ALTER COLUMN id SET DEFAULT nextval('public.license_keys_id_seq'::regclass);


--
-- Name: licenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses ALTER COLUMN id SET DEFAULT nextval('public.licenses_id_seq'::regclass);


--
-- Name: offline_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offline_sessions ALTER COLUMN id SET DEFAULT nextval('public.offline_sessions_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: purchase_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices ALTER COLUMN id SET DEFAULT nextval('public.purchase_invoices_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: quotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations ALTER COLUMN id SET DEFAULT nextval('public.quotations_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: salaries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries ALTER COLUMN id SET DEFAULT nextval('public.salaries_id_seq'::regclass);


--
-- Name: sales_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices ALTER COLUMN id SET DEFAULT nextval('public.sales_invoices_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: subscription_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events ALTER COLUMN id SET DEFAULT nextval('public.subscription_events_id_seq'::regclass);


--
-- Name: supplier_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments ALTER COLUMN id SET DEFAULT nextval('public.supplier_payments_id_seq'::regclass);


--
-- Name: sync_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_queue ALTER COLUMN id SET DEFAULT nextval('public.sync_queue_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);


--
-- Data for Name: admin_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_clients (id, company_name, email, database_name, license_key, max_users, is_active, is_trial, trial_start_date, trial_end_date, expires_at, last_active, created_at, plan) FROM stdin;
1	BiasharaLedger Admin	evanromanoff@gmail.com	client_biasharaledger_admin	BL-2024-ADMIN-evanromanoff@gmail.com	999	t	f	\N	\N	\N	\N	2026-06-25 17:44:02.695908	basic
2	fergy solutions	benfergy18@gmail.com	client_fergy_solutions_mqw03mjh	BL-2026-678c24b3-76f33221	5	t	t	2026-06-27 09:50:39.814014	2026-07-11 09:50:39.814014	\N	\N	2026-06-27 09:50:39.814014	basic
4	Barsham Solutions	Digitalbaroz@gmail.com	tenant_cdae404f17c746df9bdb4164f89d819e	BL-2026-453f892f-442cde7d2a722889	1	f	t	2026-07-02 11:39:02.889987	2026-07-16 11:39:02.889987	\N	\N	2026-07-02 11:39:02.889987	basic
5	Mambo Engineering	Mambombaya1992@gmail.com	tenant_7693935034544878aa860d2e59ec2725	BL-2026-f9faab3f-343aab04778ed44f	1	t	f	2026-07-02 12:26:56.450666	2026-07-16 12:26:56.450666	2027-07-02 12:26:56.45	\N	2026-07-02 12:26:56.450666	Premium
\.


--
-- Data for Name: admin_license_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_license_keys (id, license_key, client_id, plan, is_used, activated_at, expires_at, created_at, hardware_fingerprint, last_heartbeat, last_ip, is_active) FROM stdin;
1	BL-2024-ADMIN-evanromanoff@gmail.com	1	premium	t	\N	2126-06-25 17:44:02.851585	2026-06-25 17:44:02.851585		\N		t
2	BL-2026-678c24b3-76f33221	2	standard	f	\N	2027-06-27 09:50:39.820462	2026-06-27 09:50:39.820462		\N		t
4	BL-2026-453f892f-442cde7d2a722889	4	standard	f	\N	2027-07-02 11:39:02.899837	2026-07-02 11:39:02.899837		\N		t
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_users (id, username, password_hash, email, role, created_at, password_change_required) FROM stdin;
1	admin	$2b$10$15iNV3Getkw0G9dsCciF2.Vm5/rYKy2QNoyIIct.eXtdCy.BPbMqK	digitalbaroz@gmail.com	super_admin	2026-06-25 17:43:48.112243	0
\.


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics (id, license_id, event, app_version, os_version, data, created_at) FROM stdin;
1	\N	page_view	\N	\N	{}	2026-06-24 12:18:51.855804
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (tenant_id, id, key_name, api_key, permissions, last_used_at, expires_at, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: app_updates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_updates (id, version, changes, release_date, created_at) FROM stdin;
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
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (tenant_id, id, user_id, entity_type, imported_count, errors_count, error_details, file_name, created_at) FROM stdin;
\.


--
-- Data for Name: backups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backups (id, license_key, data, file_size, created_at) FROM stdin;
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_accounts (tenant_id, id, account_name, account_number, bank_name, currency, opening_balance, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: bank_statements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_statements (tenant_id, id, bank_account_id, transaction_date, description, reference, amount, type, balance, status, reconciliation_id, matched_transaction_type, matched_transaction_id, created_at, currency) FROM stdin;
\.


--
-- Data for Name: billing_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_history (id, user_id, amount, currency, plan_name, payment_method, transaction_id, status, period_start, period_end, created_at, tenant_id) FROM stdin;
1	3	1500	KES	Basic	mpesa	MPESA-1782283353389	completed	2026-06-24 06:42:41.045	2026-07-24 06:42:41.045	2026-06-24 09:42:41.0553	\N
2	3	1500	KES	Basic	mpesa	MPESA-1782371585737	completed	2026-06-25 07:13:08.602	2026-07-25 07:13:08.602	2026-06-25 10:13:08.611297	\N
3	3	1500	KES	Basic	mpesa	MPESA-1782371599834	completed	2026-06-25 07:13:22.175	2026-07-25 07:13:22.175	2026-06-25 10:13:22.185869	\N
4	5	1500	KES	Basic	mpesa	MPESA-1782394441375	completed	2026-06-25 13:34:06.993	2026-07-25 13:34:06.993	2026-06-25 16:34:07.006516	\N
5	5	1500	KES	Basic	mpesa	MPESA-1782394455510	completed	2026-06-25 13:34:16.795	2026-07-25 13:34:16.795	2026-06-25 16:34:16.802254	\N
6	5	3000	KES	Standard	mpesa	MPESA-1782394474300	completed	2026-06-25 13:34:36.055	2026-07-25 13:34:36.055	2026-06-25 16:34:36.058888	\N
7	5	1500	KES	Basic	mpesa	MPESA-1782449420308	completed	2026-06-26 04:50:23.251	2026-07-26 04:50:23.251	2026-06-26 07:50:23.266677	\N
8	3	1500	KES	Basic	mpesa	MPESA-1782455640953	completed	2026-06-26 06:34:06.01	2026-07-26 06:34:06.01	2026-06-26 09:34:06.028333	\N
9	3	1500	KES	Basic	mpesa	MPESA-1782455651384	completed	2026-06-26 06:34:12.546	2026-07-26 06:34:12.546	2026-06-26 09:34:12.562303	\N
10	5	1500	KES	Basic	mpesa	MPESA-1782494339484	completed	2026-06-26 17:19:02.394	2026-07-26 17:19:02.394	2026-06-26 20:19:02.41201	\N
11	5	1500	KES	Basic	mpesa	MPESA-1782494356556	completed	2026-06-26 17:19:18.082	2026-07-26 17:19:18.082	2026-06-26 20:19:18.088019	\N
12	3	1500	KES	Basic	mpesa	MPESA-1782528926296	completed	2026-06-27 02:55:29.713	2026-07-27 02:55:29.713	2026-06-27 05:55:29.982837	\N
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budgets (tenant_id, id, fiscal_year, period, category_type, category_name, amount, created_at) FROM stdin;
local-default	a289af7d-3e69-425c-9ed3-bd2b1863f66c	2026	MONTHLY	REVENUE		800.00	2026-07-04 22:24:32.210933
\.


--
-- Data for Name: capital_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.capital_transactions (tenant_id, id, type, amount, transaction_date, description, reference, created_at, currency, exchange_rate) FROM stdin;
local-default	37761070-19b7-4765-9ce4-5d5933d597df	CAPITAL_INJECTION	780.00	2026-07-04			2026-07-04 22:24:21.210466	USD	1
\.


--
-- Data for Name: chart_of_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chart_of_accounts (tenant_id, id, account_code, account_name, account_type, parent_id, is_active, opening_balance, description, created_at) FROM stdin;
local-default	593a5e72-27fe-4840-9c57-799d64ea9d9e	1000	Cash at Bank	ASSET	\N	1	0.00		2026-07-04 22:25:56.804925
local-default	f7d3d07a-f8ee-4c3b-8804-f5d1303dcff6	1100	Accounts Receivable	ASSET	\N	1	0.00		2026-07-04 22:25:57.050673
local-default	378b53a2-4217-41d0-beb2-7c79a05d0a6b	1200	Inventory	ASSET	\N	1	0.00		2026-07-04 22:25:57.053562
local-default	045b29ff-ad6e-4f22-9d97-5e4816d11793	1300	Fixed Assets	ASSET	\N	1	0.00		2026-07-04 22:25:57.063963
local-default	b4d0ac1e-cbe1-47dc-9c85-21a542b16bb3	2000	Accounts Payable	LIABILITY	\N	1	0.00		2026-07-04 22:25:57.068043
local-default	3d385640-ea0f-4619-8347-4ba8a02c5662	2100	VAT Payable	LIABILITY	\N	1	0.00		2026-07-04 22:25:57.070268
local-default	10336051-1eac-4874-a39e-3fad1482eb8a	2200	Income Tax Payable	LIABILITY	\N	1	0.00		2026-07-04 22:25:57.076308
local-default	9c88676c-79dc-4a61-8f3b-f45676b5a79e	3000	Owner's Equity	EQUITY	\N	1	0.00		2026-07-04 22:25:57.079178
local-default	9b6a7f87-5d51-435a-b978-f86918755c91	3100	Retained Earnings	EQUITY	\N	1	0.00		2026-07-04 22:25:57.08464
local-default	4747dc4e-2ced-4d13-9184-da60cddb5852	4000	Sales Revenue	REVENUE	\N	1	0.00		2026-07-04 22:25:57.086628
local-default	70cc4d35-d5f5-4f32-b295-0a738b60b6a6	4100	Other Income	REVENUE	\N	1	0.00		2026-07-04 22:25:57.088107
local-default	e694b2bd-40e0-40e0-9e3f-37ca397caa7c	5000	Cost of Goods Sold	EXPENSE	\N	1	0.00		2026-07-04 22:25:57.089969
local-default	c1d15ccb-78fa-4df2-93aa-73a50f7276f3	6000	Operating Expenses	EXPENSE	\N	1	0.00		2026-07-04 22:25:57.09166
local-default	42ecd0b7-18db-42d0-930f-7b1e1b31d49d	6100	Salaries & Wages	EXPENSE	\N	1	0.00		2026-07-04 22:25:57.093033
local-default	c2be02cd-b883-4adb-8fea-f4b4bbc973af	6200	Rent	EXPENSE	\N	1	0.00		2026-07-04 22:25:57.095917
local-default	470a0708-1ffb-4693-95cd-5343459af1a9	6300	Utilities	EXPENSE	\N	1	0.00		2026-07-04 22:25:57.138399
local-default	098fe96d-5581-47f5-9271-977013c87079	7000	Income Tax Expense	EXPENSE	\N	1	0.00		2026-07-04 22:25:57.146314
local-default	c5ce05b5-8d1d-411e-80f8-f808a103b310	yuuuu	tyty	EQUITY	\N	1	7880.00		2026-07-04 22:26:22.763165
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, supplier_name, company_name, contact_person, email_address, phone_number, address, bank_details, tax_id, payment_terms, supplier_category, notes, created_at, currency, tenant_id, country) FROM stdin;
1	ABC Supplies Ltd	ABC Supplies Ltd	John Mongeli	Info@abcsupplies.com	0710334455	Matuu, Machakos, Kenya	coop bank, 01003546868, Matuu branch	P09897654TYI8L	Net 30	Consulting		2026-06-20 11:23:59		\N	
2	Coolbreeze supplies limited	Coolbreeze supplies limited	Bon Mayoyo	Bonmayoyo@gmail.com	0782333344	Kisumu , street 3 		P084646THY899	Net 30	Equipment		2026-06-20 11:28:19		\N	
3	kawuono Senji	Senjiplc	Kawuono Senji 	Senjiplc@yahoo.com	0711000000			P902211100	Net 30			2026-07-04 17:10:15.25209		local-default	
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, company_name, address, location, country, phone, email, kra_pin, logo_base64, paybill_number, bank_name, account_number, bank_branch, branch_code, bank_code, swift_code, terms_conditions, invoice_prefix, next_invoice_number, quotation_prefix, next_quotation_number, last_invoice_month, last_quotation_month, smtp_host, smtp_port, smtp_user, smtp_pass, updated_at, vat_rate, credit_note_prefix, next_credit_note_number, last_credit_note_month, tenant_id, income_tax_rate, tax_filing_frequency, base_currency, created_at) FROM stdin;
1	Your company Limited	123 Baker Street	Nairobi	Kenya	+254720110000	info@yourcompany.co.ke	P0452z9897	data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAImlsb2MAAAAAREAAAQABAAAAAAD6AAEAAAAAAAALWgAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgQQMAAAAABRpc3BlAAAAAAAAAuQAAAKIAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAtibWRhdBIACgoZJm46H4ICGg0IMskWEYABRRRRQPS6zcpNaFeizFlnAqBu3t30fjYuEvipkh4FqG1gPDrJwt7t6KV/uyEv+rt/stxJF9K0D9Oqm+gH+kwuRvexiGbyrd+BlEWW12j+kfmoYDratlzssAgQNzwhfOBrSzyvy9+ikmjQJu3JBa3lx18gCHw5pkQe5rGalgc4vmHJa8SmYK7YLXF759vUNk9qUegfFZqEUHeSnQBT5D5H7HaUA7d6YYXcMS/l12Q6gp9xhge5aNYefAp5mH4unrCFBNYth6HKdeHeZoystvx/HUEiOurbJDk1aqEKJzQ1E3zjYfcKYI/zPmV3U/WadBwAJ1W0CoXicijXtHdmcpmwVeYnEvNQuI1W0BDiryXORR/F9eFWT1VOI+TRG2S0BcpxcXuc0R4J6xeSepqsix8couvKt6vbguDCGd7blwEIBQFG1S4ql3/jUfrTJPkxTe7NttYpYjcp/3IsJHlMqY7Q4JLSvQFdGkbGFAkrWh9vQNdFFLRYu0mu3D0FFBQCk1SgLRWh6fXYF0idjjQbMU9RyasuV8UYu/ZmmOYQ05DpXZ8MxhaKghoqtiUm6CErgG3W/CejfBnIv83dlv0PgiTIqXoIosaxhROwRCvV5NKdzwtJ53ofjIn7vGSy18uDqywH6c+xbcUspxShYpzB+NZ+M+vDxmTLFI3D4pjp+QCAHYsBoJnsxf0B1OYwM4phCv4+iL1AMydPGHoV6FxwK6Kr7yCljhR5vO2+hFyMaKLQiwPyeSz2n9tS8/Hf4y7mHRQZX5TDtDP7I2I4bBiTKb0JTbbLHkNwxKXOU5RCDqP0K2D00fqfWt7V7EJpFvYOl3vx6I9BZ/hOjILm5rh+4VE04nDiBH6/jk5Roht7wuuEVn6bufhVpJJPWeBL3fkofv3J8E+jmV7LOlOpPbqDwiL1YBLXUqI949oEuvZ7GCYj3U0C48vXQOrt9x4mdf72NsxhcIF3p0h/WSc3FA00QRCfkL7BL2ialDqewk8C7oAhamacGUMQYEkSCR4r9waL3aX37iqV1DQkRfB6n3zgkJOU0cGF1BVo7P3G751s0/Dnp5BYyZb6wtlhZKOkXOs2MidNSLIdsuXrr2b0g8LsYSKy97wmSF9sUYrSDZ/cb94hqGsMvc8oDVqYkEVLUC2rG84iZxiH/zz2kYOuuXNHND0aAsyAoy6aKA0t4UYrjODsCtiuSvRF9GBeMm+ieQ6XQurZaJYwl2JHOvxAjCRFsHYuRWuy+XXsaf6TLzDsseCUgPh34JE9lcYi7B6aYtEttcL7umBVkjeHzyl5lmOztDrPiC/rXa0n2yRvYbbL+OAVHmbtTvUeta6OlVTCPwEEo2kncKA+GG5VTRtSvkssKHYIVhxB1vgzv83sQ+y+ot68N3Px+UU26quOFhZroqcOY3gR+AQb7dOECKe+E6PTnFE0Ut8iyk7K85Vu//bxPtUWXfI8szbmcSZevO3aMu+VRwBOs+QMorFoXPzswmh2EfKScKkZfqmM1SXPZH1m336I9P7oMq3vxvmh00p/g1mDnK0x6wnrXtX2iNspC8JByd7RKG/EO72wg96rBFvsU5lpwF8gXwUsB7iDyoj9ZZ9uunzCd4wYATCEAaEzPqnouxTfszZLtdgsEq+OvQPnc4j/WN0evpgb8nt6VOfY4vI11XbSLSvdkPj9FUKfxAM0zXn4uKB3v8jqMLnB7HO2QUPDEfiuFCDNQq1m2Zg5jT+VCBUlPcF4MSMC8qG76l9U6mrDGdeFj/7NqZQnFMb3ePIG0lgx7KmSKxos9w1hmJIHD93kgZaDKzU32Jbxeum+X9Wx0bXAXAFyvmOjrOdvihqgV6Hwy0SFji3V493xtct+nU987TTNsNLRSXxXt9pDS+u03Ba7wzAAWPpABqrARrdLE6IYQdtlnqmglLHYx/x5a+NG2GwVOzTH/5v3yLt0tzxLfbp8vCRA4TwIf17R6YMfoFrcSnSC/5dOxsBKVhqAj0+FvlsiFD6iJiUbLvlskX6u95GOEWfCTSW6daw0Y5AHUmqYczHILmqDO0vPZTK8yLUTN1TrIZQ1fe48jdg/HixEWfbl4Kw+YZ8be906U3sB0At3XHXEEh9qd9LqvB8x8st4WSQI3KpBlQBG8F0DI3xsPJpND/Z7Jm8ZPsyRVqgYKMkUpx7mWYIwz6FfYIgYBNxRTtOWdU7elg92uQtWJ9KVxNsRZz50ZUB2A8yeLTLMne7ZAEI8UnlQYAWRFZABikF3WOekARfpi2k40oGhMzReLqsvJRjLCg/lkyJuGyqXze2uDncEnBzzgv/h1aONtrY5SQ8RofqkSOaNdMNcpIUkrOyxxrFWRPo4E2sNJQh6ZuWIHcHYAhsFyyJs9Yf6Hk95aTc0CaDrwMrOWIN48LmfWsYXoOz6rP6olBs8JMiE6IeAKJxS9rfNwGZ0H5WQOYbFkp8bHFNeDOMu1BnfYRFnrD1wirPOoQW8XeuenhsSZB1/9tMxAi86viYyAhKTdh32+ITCdsUSl7E/u9bpVP8A29O8LGncXhEYWo1gmkOhDLPNBYo55uNrmOi939xnVpDnMP/obPdFvFPnEfAa0Aje/xswci0hQozUThZTDj11w8TyvlZSL/2O2XO0ldDsaKzc0+uH52Ca7AnGe1X2dgnPjfuSiRodHxbfc2xbRqvPBYN2aFivJiI02yNP5JIKB7oKbUT5gTvPzBhhUZFxyedABomQTmahXgg4mqcL+ayyf5l1cRhkV+5ZbAN8YhNNVqFFrvf6PuVdEVEFNxzqAlFtpRRftwqhYT/p0fK6Kc12KQi9X3/wyINIlJYGTVxKArJQJBiyQYwWmUrflnhu3HxGzOOHWKvmVG3XMbDEYF6rJrf/IwvFDbYLzaXwKSgBRmeIlY3wDu1TdiYH5B1Lpb5Zf7HnoheVxOBb2jTYrbDFPs6L5x8oBwXazsiBTC770mR4qPsCBVbAOXc808a4yyBXhZ3Dn1NukGoLzJa9SqjPE1P9EzKeYVKmwpBny7D1M72nFDx1Np3izwV3ONdBtMpOHdArnpjao8eTorhUyhi4OHSoDzMHU8Tind7xjbUB2OtOTO+IJBP1Ta4SWW5HkP12xLIEL3NFxFP6JfjOdzyzaoPFY9wqpjL4WkhFJ0GGAq6I52+Z9CnGixIvlAbNB3veIH+eLjkY61PW3FUYbyX9sj6CITSPpQWazPTIp08dM0zHKqsOCufZqdSyMVqGiMj4Mt58jh/A5s1fGu4XGTXcPsGEU3Uh0scGhBLtC9yVoLYeokafoF9rYt5dkw+QeTBGBShnHhWvqvelq/bYpfDK/dooVASQIuBM51kTH/fr4opNQTydvuRyJhzVstaBtQS53OUIOoyVvRKpn4Lo+F4Uc4gBGW5Fyw/WbrABBke09Oac/YfMghvJgsWakr27wFx5m3b3THXOy8cVahc0GSQRODrQnOI7gkOz6wTPu8IFDGn4DAxEU4JeduqKz2cR+gwmgTUmiQMkjZY3N9HHRyoDxAmev7zHoDS5LlXsXf0wR2njFvNjUxnysurvuRixlWJzT1lkfAAOGPBxcJ7t2HSr3p/Kyk0PkCWHpbVDSTcIoIHPSKytdvu6ihY3flbvWymUOQMsb01nBnblSYcqVdKYFOPsb6uIiq0IyTxoCsbQU6D7BE7Y7UBmzSa+pwd+phGdtXIinGFeYJFy0zNc2ic9VGixPZ26IQ8bAFHoxxhTPMeptvtMr0Qg67vCZkwXWc7rfg23kGAoNeiv53qQ6oIn/byYNp+8jRzGygrxlLB3I9Dzm3j+5fTFpB79ROnE0+dziD0MmxPG/KUFgwMfEJ2nxwFs0Nd6IkSxbFTAg1UJDcT072jr1wrQ	247247	Equity Bank	0018989891789	Donholm 	12000	68	EQBKKENA	Overdue balances are subject to a 1.5% monthly fee plus collection costs.	INV	10	QTN	10	2026-06	2026-06	smtp.gmail.com	587	mambombaya1992@gmail.com	lhiv olaz nawe lupp	2026-07-04 18:36:39.958151	16.00	CN	1		local-default	0.00	monthly	USD	2026-07-04 18:12:41.882472
\.


--
-- Data for Name: credit_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credit_notes (id, credit_note_number, invoice_id, customer_id, customer_name, description, quantity, unit_price, amount, reason, notes, issue_date, created_at, customer_email, subtotal, tax_vat, discounts, payment_terms, currency, exchange_rate, tenant_id, vat_rate) FROM stdin;
1	CN-MQNANARR	7	2	Annritta Muriuki	Purchase of a wheelbarrow	10.00	1750.00	17500.00	Returned goods	The client changed her mind 	2026-06-21	2026-06-21 04:40:27		0.00	0.00	0.00	Net 30	USD	1	\N	0
2	CN-MQNB40DY	8	3	Jane Doe	Prado Engine	1.00	5670000.00	850000.00	Discount after sale	Client Was given a discount after sales	2026-06-21	2026-06-21 04:49:58		0.00	0.00	0.00	Net 30	USD	1	\N	0
3	CN-MQNCCWBS	6	1	kawa	purchase of land	1.00	780000.00	78000.00	Price adjustment		2026-06-21	2026-06-21 05:24:15		0.00	0.00	0.00	Net 30	USD	1	\N	0
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, customer_name, company_name, contact_person, email_address, phone_number, billing_address, shipping_address, tax_id, payment_terms, credit_limit, notes, created_at, country, currency, tenant_id) FROM stdin;
1	Evan Jonathan	EvanJohns Solutions	Evan Jonathan	Evanjohns@gmail.com	+25472000000	123 Kitengela	Apt 46A	89uuju993939	Due on Receipt	0.00		2026-06-19 10:22:34			\N
2	Ben Bob	Benbob LLc	Ben Bob	Benbob@aol.com	+254711000000	Chase street , R8 , West	Apt 4B	P09863636Z87	Due on Receipt	0.00		2026-06-19 10:48:13			\N
3	Jane Doe	Janedo investments	Jane Doe	Janedoe@yahoo.com	0723000000	123 Baker Street	Apt 4B	P064746YHYH3535	Due on Receipt	0.00	To pay on delivery	2026-06-19 20:57:28			\N
4	Muriuki Waguthi Annrita	Annritta Investments Limited	Annritta Muriuki	anritamuriuki@gmail.com	+254711217950	Sector 3, Seasons- Kasarani		PO5176546467YUT	Net 30	0.00		2026-06-21 06:24:07			\N
5	Mambo Mbaya	Mambo Construction	Mambo Mbaya	Mambombaya1992@gmail.com	+2547545454	Upper Hill road , NRB		P09896784TY	Net 30	0.00		2026-06-21 15:26:20			\N
6	yes bana	yes bana inc	yes yes yes	yesbanainc@ymail.com	0715000000			P9090890	Net 30	0.00		2026-07-04 17:09:00.736645			local-default
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deals (tenant_id, id, deal_name, customer_id, contact_name, contact_email, contact_phone, deal_value, currency, pipeline_stage, probability, expected_close_date, notes, status, created_at) FROM stdin;
\.


--
-- Data for Name: debit_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.debit_notes (id, debit_note_number, purchase_invoice_id, client_id, client_name, description, quantity, unit_price, amount, reason, notes, issue_date, created_at, currency, exchange_rate, tenant_id) FROM stdin;
1	DN-MQMAHPUC	1	2	Coolbreeze supplies limited	Bought 10 computers 	10.00	4000.00	40000.00	Damaged items		2026-06-20	2026-06-20 11:45:17	USD	1	\N
\.


--
-- Data for Name: electron_activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.electron_activity (id, license_key, action, data, ip_address, created_at, session_token, hardware_fingerprint) FROM stdin;
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_logs (id, recipient, email_type, success, detail, created_at) FROM stdin;
1	mambombaya1992@gmail.com	otp	1	OTP sent	2026-06-26 13:17:04.736821
2	benfergy@gmail.com	otp	0	Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials ffacd0b85a97d-46ebf4e1b95sm13774561f8f.1 - gsmtp	2026-06-27 09:40:11.587713
3	benfergy@gmail.com	otp	1	OTP sent	2026-06-27 09:49:29.40219
4	benfergy18@gmail.com	otp	1	OTP sent	2026-06-27 09:50:20.599642
5	vaxaga4701@icotz.com	otp	0	Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 5b1f17b1804b1-493bef23feasm171735065e9.2 - gsmtp	2026-07-03 17:32:12.782647
6	evanromanoff@gmail.com	otp	0	Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials ffacd0b85a97d-47a9e4d6e4csm1339903f8f.10 - gsmtp	2026-07-03 21:38:21.930392
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, employee_code, name, date_of_birth, national_id, tax_pin, phone, email, address, department, job_title, date_of_hire, employment_type, bank_name, account_number, emergency_contact_name, emergency_contact_phone, notes, salary, salary_encrypted, national_id_encrypted, bank_account_encrypted, created_at, tenant_id) FROM stdin;
1	EMP-MQMAKXUW	jesse cameron	1998-08-04	222111333	PO908978YU89	0780999999	jesse@yourcompany.com	Kamakis	Sales	Sales Rep	2024-07-01	full-time	Coop Bank	111222333444	Lorah	0122332233	Degree in food science	35000.00	\N	\N	\N	2026-06-20 11:49:42	\N
2	EMP-MQN9VVRK	Oliver J Georges	1994-06-13	11122200	P0512512512WYT	+25411223344	Oliver@yourcompany.org	Umoja Innercore , Road C, Sector 3	IT	Technical Support	2025-03-03	full-time	Stanbic 	1234567890	Amos Njueni	+25411001100		76000.00	\N	\N	\N	2026-06-21 04:19:12	\N
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exchange_rates (tenant_id, id, source_currency, target_currency, rate, rate_date, created_at) FROM stdin;
local-default	4cfa01e8-d2a1-49d1-8baa-35d43b19ae3d	USD	KES	132	2026-07-04	2026-07-04 22:25:25.91727
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, expense_code, category, description, supplier_vendor, invoice_receipt_number, amount, tax_vat, expense_date, payment_method, paid_by, status, notes, created_at, currency, exchange_rate, tenant_id) FROM stdin;
1	EXP-MQMASW80	Rent	Rent payment for the month of may 2026	Sanfra Investments	CR-8	60000.00	0	2026-06-20	mpesa		approved		2026-06-20 11:57:01	USD	1	\N
3	EXP-MQNA5SS8	Insurance	Payment for the company car insurance	UAP insurance	INV-XYTHNHST35TH	790000.00	126400	2026-06-21	bank		approved		2026-06-21 04:24:32	USD	1	\N
2	EXP-MQMZMDY6	Marketing	Company Ads	Wakenya Ads Limited	INV-98U89U	156700.00	0	2026-06-20	cash		approved		2026-06-20 23:28:45	USD	1	\N
\.


--
-- Data for Name: fixed_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fixed_assets (tenant_id, id, asset_name, asset_type, purchase_date, purchase_cost, useful_life_years, depreciation_method, salvage_value, accumulated_depreciation, book_value, status, disposal_date, disposal_amount, notes, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_items (tenant_id, id, item_name, sku, category, unit_of_measure, opening_stock, current_stock, unit_cost, created_at, reorder_level) FROM stdin;
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
-- Data for Name: license_activations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_activations (id, license_key, user_email, hardware_fingerprint, ip_address, device_info, status, error_reason, created_at) FROM stdin;
\.


--
-- Data for Name: license_installations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_installations (id, license_key, hardware_fingerprint, installation_date, last_seen, ip_address, device_info, status) FROM stdin;
\.


--
-- Data for Name: license_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_keys (id, license_key, email, license_type, status, user_id, expires_at, activated_at, hardware_fingerprint, created_at, offline_session_token, last_heartbeat, last_ip, activation_count) FROM stdin;
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licenses (id, license_key, license_id, type, status, hardware_fingerprint, activated, activation_date, expiry_date, last_validated, last_seen, last_known_ip, device_info, user_email, features, revoked, allowed_installations, created_at, updated_at) FROM stdin;
1	273E73-1D4ACA-490A8B-CDB98B	BL-031F8A4D62695968	standard	active	test-fp-456	t	2026-06-24 12:20:03.718734	2027-06-24 09:19:33.232	2026-06-24 12:20:04.650141	2026-06-24 12:20:04.650141	\N	\N	test@example.com	["all"]	f	1	2026-06-24 12:20:02.798129	2026-06-24 12:20:02.798129
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
-- Data for Name: offline_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offline_sessions (id, client_id, license_key, session_token, hardware_fingerprint, user_email, status, activated_at, expires_at, last_heartbeat, last_ip, last_sync, created_at) FROM stdin;
\.


--
-- Data for Name: other_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.other_transactions (tenant_id, id, type, category, description, amount, transaction_date, notes, created_at, currency, exchange_rate) FROM stdin;
local-default	98d70fd4-216e-412f-bc92-b39a2708b85c	OTHER_INCOME	Commission		670.00	2026-07-04		2026-07-04 22:24:04.397064	USD	1
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, invoice_id, customer_id, customer_name, amount, payment_date, payment_method, notes, created_at, currency, exchange_rate, tenant_id) FROM stdin;
1	1	2	Annritta Muriuki	1000.00	2026-06-19	bank	Paid confirmed	2026-06-19 17:12:00	USD	1	\N
2	3	1	kawa	1000.00	2026-06-19	cheque		2026-06-19 18:29:16	USD	1	\N
3	4	3	John Kamau	1000.00	2026-06-19	mpesa		2026-06-19 20:58:58	USD	1	\N
4	8	3	Jane Doe	6577200.00	2026-06-20	cash		2026-06-20 21:25:21	USD	1	\N
5	7	2	Annritta Muriuki	20300.00	2026-06-20	cash		2026-06-20 21:25:37	USD	1	\N
6	4	3	John Kamau	4568.00	2026-06-20	cash		2026-06-20 21:33:18	USD	1	\N
7	3	1	kawa	938600.00	2026-06-20	cash		2026-06-20 21:33:36	USD	1	\N
8	1	2	Annritta Muriuki	6727000.00	2026-06-20	cash		2026-06-20 21:33:45	USD	1	\N
9	9	1	Evan Jonathan	8212800.00	2026-06-20	cash		2026-06-20 21:35:18	USD	1	\N
10	10	3	Jane Doe	3114600.00	2026-06-20	cash	Paid	2026-06-20 22:49:48	USD	1	\N
11	11	4	Muriuki Waguthi Annrita	386080.00	2026-06-21	cash		2026-06-21 17:40:42	USD	1	\N
12	12	4	Muriuki Waguthi Annrita	70800.00	2026-06-24	cash	Auto-recorded from Mark as Paid	2026-06-24 08:10:08.867013	USD	1	\N
13	4	3	John Kamau	5568.00	2026-06-24	cash	Auto-recorded from Mark as Paid	2026-06-24 08:55:50.525587	USD	1	\N
14	13	5	Mambo Mbaya	8900000.00	2026-06-24	cash	Partial payment of KES 8,900,000. Remaining: KES 7,340,000	2026-06-24 08:56:53.620392	USD	1	\N
15	15	5	Mambo Mbaya	78000.00	2026-06-24	cash	Partial payment of KES 78,000. Remaining: KES 211,060	2026-06-24 14:40:11.510082	USD	1	\N
16	14	3	Jane Doe	88000.00	2026-06-24	cash	Partial payment of KES 88,000. Remaining: KES 115,840	2026-06-24 18:00:31.442218	USD	1	\N
17	13	5	Mambo Mbaya	16240000.00	2026-07-04	cash	Auto-recorded from Mark as Paid	2026-07-04 18:20:35.715426	USD	1	local-default
18	16	4	Muriuki Waguthi Annrita	66381.00	2026-07-04	cash	Auto-recorded from Mark as Paid	2026-07-04 21:20:20.160897	USD	1	local-default
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

COPY public.purchase_invoices (id, invoice_number, po_id, client_id, client_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, issue_date, due_date, created_at, currency, exchange_rate, tenant_id, vat_rate, client_country) FROM stdin;
1	PI-MQMA4G0F	1	2	Coolbreeze supplies limited	Supplied 10 computers	10.00	4000.00	40000.00	0.00	3800.00	36200.00	Net 30	paid	2026-06-20	2026-07-20	2026-06-20 11:36:04	USD	1	\N	0	
2	PI-MQMZGU0I	\N	1	ABC Supplies Ltd	Purchase of office furniture	19.00	76000.00	1444000.00	231040.00	0.00	1675040.00	Net 30	paid	2026-06-20	2026-07-20	2026-06-20 23:24:13	USD	1	\N	0	
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, po_number, client_id, client_name, description, quantity, unit_price, subtotal, tax_vat, amount, delivery_date, status, notes, issue_date, created_at, currency, exchange_rate, tenant_id, vat_rate, client_country) FROM stdin;
1	PO-MQM9YAZN	2	Coolbreeze supplies limited	Computers	10.00	4000.00	40000.00	0.00	40000.00	2026-06-19	approved		2026-06-20	2026-06-20 11:31:26	USD	1	\N	0	
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotations (id, quotation_number, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, amount, valid_until, status, notes, items, issue_date, created_at, due_date, customer_country, currency, exchange_rate, tenant_id, vat_rate, discounts) FROM stdin;
3	Q-20/06/2026-002	3	Jane Doe	Mazda cx3	1.00	56770.00	56770.00	9083.20	65853.20	2026-06-22	overdue		[{"description":"Mazda cx3","quantity":1,"unit_price":56770}]	2026-06-20	2026-06-20 12:12:18			USD	1	\N	0	0
8	QTN-20/06/2026-007	2	Ben Bob	Audi Engine, Audi Gearbox	1.00	479000.00	1267000.00	202720.00	1469720.00	2026-06-21	overdue		[{"description":"Audi Engine","quantity":1,"unit_price":479000},{"description":"Audi Gearbox","quantity":1,"unit_price":788000}]	2026-06-20	2026-06-20 15:38:03			USD	1	\N	0	0
10	QTN-21/06/2026-009	4	Muriuki Waguthi Annrita	Purchase of Jbl Boombox 4	1.00	65000.00	65000.00	10400.00	75400.00	2026-06-22	overdue		[{"description":"Purchase of Jbl Boombox 4","quantity":1,"unit_price":65000}]	2026-06-21	2026-06-21 06:58:28			USD	1	\N	0	0
1	Q-19/06/2026-001	1	kawa	City bus	1.00	1569000.00	1569000.00	251040.00	1820040.00	2026-06-24	overdue		[{"description":"City bus","quantity":1,"unit_price":1569000}]	2026-06-19	2026-06-19 10:23:24			USD	1	\N	0	0
2	Q-20/06/2026-001	2	Ben Bob	Prism Pole, SolidCAM	1.00	1000.00	7000.00	1120.00	8120.00	2026-06-25	overdue		[{"description":"Prism Pole","quantity":1,"unit_price":1000},{"description":"SolidCAM","quantity":1,"unit_price":6000}]	2026-06-20	2026-06-20 09:53:34			USD	1	\N	0	0
4	Q-20/06/2026-003	3	Jane Doe	Gold , Silver	2.00	5000.00	145000.00	23200.00	168200.00	2026-06-25	overdue		[{"description":"Gold ","quantity":2,"unit_price":5000},{"description":"Silver","quantity":3,"unit_price":45000}]	2026-06-20	2026-06-20 14:24:38			USD	1	\N	0	0
5	Q-20/06/2026-004	2	Ben Bob	car purchase, Bike Purchase	1.00	100000.00	175000.00	28000.00	203000.00	2026-06-24	overdue		[{"description":"car purchase","quantity":1,"unit_price":100000},{"description":"Bike Purchase","quantity":1,"unit_price":75000}]	2026-06-20	2026-06-20 14:30:14			USD	1	\N	0	0
6	Q-20/06/2026-005	3	Jane Doe	eggs, chops	10.00	1000.00	32000.00	5120.00	37120.00	2026-06-24	overdue		[{"description":"eggs","quantity":10,"unit_price":1000},{"description":"chops","quantity":22,"unit_price":1000}]	2026-06-20	2026-06-20 14:41:27			USD	1	\N	0	0
7	Q-20/06/2026-006	1	Evan Jonathan	Purchase of Laptops, Purchase of phones	22.00	35000.00	1112000.00	177920.00	1289920.00	2026-06-25	overdue		[{"description":"Purchase of Laptops","quantity":22,"unit_price":35000},{"description":"Purchase of phones","quantity":19,"unit_price":18000}]	2026-06-20	2026-06-20 15:32:52			USD	1	\N	0	0
9	QTN-21/06/2026-008	4	Muriuki Waguthi Annrita	Purchase of Laptops	11.00	35000.00	385000.00	61600.00	446600.00	2026-06-26	overdue		[{"description":"Purchase of Laptops","quantity":11,"unit_price":35000}]	2026-06-21	2026-06-21 06:25:09			USD	1	\N	0	0
11	QTN-04/07/2026-001	5		3 kgs of Gold	1.00	289000.00	289000.00	46240.00	335240.00		overdue		[]	2026-07-04	2026-07-04 18:20:10.970072	2026-08-03		USD	1	local-default	0	0
12	QTN-04/07/2026-001	5		Audi SQ5	1.00	58000.00	58000.00	9280.00	67280.00		overdue		[]	2026-07-04	2026-07-04 21:10:47.449504	2026-08-03		USD	1	local-default	0	0
\.


--
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rate_limits (key, count, expires_at, updated_at, created_at) FROM stdin;
signin:mambombaya1992@gmail.coom:::1	1	2026-07-04 21:09:44.428+03	2026-07-04 21:08:44.429904+03	2026-07-04 21:08:44.429904+03
signin:Mambombaya1992@gmail.com:::1	1	2026-07-04 21:29:02.654+03	2026-07-04 21:28:02.670722+03	2026-07-04 19:29:18.785716+03
signin:mambombaya1992@gmail.com:::1	1	2026-07-04 22:13:16.242+03	2026-07-04 22:12:16.243715+03	2026-07-04 12:14:50.465194+03
send-otp:vaxaga4701@icotz.com:::1	1	2026-07-03 17:33:08.834+03	2026-07-03 17:32:08.841787+03	2026-07-03 17:32:08.841787+03
send-otp:evanromanoff@gmail.com:::1	1	2026-07-03 21:39:20.006+03	2026-07-03 21:38:20.020878+03	2026-07-03 21:38:20.020878+03
signin:::1	1	2026-07-03 23:37:00.282+03	2026-07-03 23:36:00.284211+03	2026-07-02 10:37:57.097954+03
admin-login:::1	1	2026-07-03 23:46:08.895+03	2026-07-03 23:45:13.044113+03	2026-07-02 10:37:36.011239+03
license-activate:::1	1	2026-07-03 04:26:51.022+03	2026-07-03 04:25:51.023351+03	2026-07-03 04:22:32.904655+03
admin-login:Mambombaya1992@gmail.com:::1	1	2026-07-04 19:28:20.676+03	2026-07-04 19:27:20.701167+03	2026-07-04 19:27:20.701167+03
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
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, permissions) FROM stdin;
1	admin	Full access to all features	["all"]
2	hr_manager	HR and payroll management	["hr.read","hr.write","payroll.read","payroll.write","dashboard.read"]
3	accountant	Accounting and financial reports	["accounts.read","accounts.write","reports.read","dashboard.read"]
4	employee	View own data only	["dashboard.read","hr.own"]
\.


--
-- Data for Name: salaries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salaries (id, employee_id, employee_name, basic_salary, allowances, deductions, overtime, bonuses, amount, amount_encrypted, pay_date, payment_method, payslip_reference, status, created_at, currency, exchange_rate, tenant_id) FROM stdin;
1	1	jesse cameron	35000	0	0	0	0	35000.00	\N	2026-06-20	bank		paid	2026-06-20 11:50:57	USD	1	\N
2	2	Oliver J Georges	76000	5000	3500	6600	5900	90000.00	\N	2026-06-21	bank		pending	2026-06-21 04:21:01	USD	1	\N
\.


--
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_invoices (id, invoice_number, quotation_id, customer_id, customer_name, description, quantity, unit_price, subtotal, tax_vat, discounts, amount, payment_terms, status, items, issue_date, due_date, created_at, customer_country, currency, exchange_rate, tenant_id, vat_rate) FROM stdin;
2	INV-19/06/2026-002	\N	2	Annritta Muriuki	Automatic vending machines	3.00	76000.00	228000.00	36480.00	0.00	264480.00	Due on Receipt	paid	[]	2026-06-19	2026-07-19	2026-06-19 12:01:40		USD	1	\N	0
3	INV-19/06/2026-003	\N	1	kawa	Purchase of Gold	3.00	270000.00	810000.00	129600.00	0.00	939600.00	Due on Receipt	paid	[]	2026-06-19	2026-07-19	2026-06-19 18:28:56		USD	1	\N	0
5	INV-20/06/2026-001	\N	2	Annritta Muriuki	Purchase of a house	1.00	7800000.00	7800000.00	1248000.00	0.00	9048000.00	Due on Receipt	paid	[]	2026-06-19	2026-07-19	2026-06-19 21:03:48		USD	1	\N	0
6	INV-20/06/2026-002	\N	1	kawa	purchase of land	1.00	780000.00	780000.00	124800.00	0.00	904800.00	Due on Receipt	paid	[]	2026-06-19	2026-07-19	2026-06-19 21:07:31		USD	1	\N	0
7	INV-20/06/2026-003	\N	2	Annritta Muriuki	Purchase of a wheelbarrow	10.00	1750.00	17500.00	2800.00	0.00	20300.00	Net 30	paid	[{"description":"Purchase of a wheelbarrow","quantity":10,"unit_price":1750}]	2026-06-19	2026-07-19	2026-06-19 21:08:24		USD	1	\N	0
8	INV-20/06/2026-004	\N	3	Jane Doe	Prado Engine	1.00	5670000.00	5670000.00	907200.00	0.00	6577200.00	Net 30	paid	[{"description":"Prado Engine","quantity":1,"unit_price":5670000}]	2026-06-20	2026-07-20	2026-06-20 15:39:58		USD	1	\N	0
9	INV-21/06/2026-005	\N	1	Evan Jonathan	Solar Panels	12.00	590000.00	7080000.00	1132800.00	0.00	8212800.00	Net 30	paid	[{"description":"Solar Panels","quantity":12,"unit_price":590000}]	2026-06-20	2026-07-21	2026-06-20 21:35:07		USD	1	\N	0
10	INV-21/06/2026-006	\N	3	Jane Doe	Purchase of land	3.00	895000.00	2685000.00	429600.00	0.00	3114600.00	Net 30	paid	[{"description":"Purchase of land","quantity":3,"unit_price":895000}]	2026-06-20	2026-07-21	2026-06-20 22:12:09		USD	1	\N	0
11	INV-21/06/2026-007	\N	4	Muriuki Waguthi Annrita	Purchase of Laptops 	11.00	33000.00	363000.00	58080.00	35000.00	386080.00	Net 30	paid	[{"description":"Purchase of Laptops ","quantity":11,"unit_price":33000}]	2026-06-21	2026-07-21	2026-06-21 06:37:26		USD	1	\N	0
12	INV-21/06/2026-008	\N	4	Muriuki Waguthi Annrita	Purchase of JBL Boombox 4	1.00	65000.00	65000.00	10400.00	4600.00	70800.00	Net 30	paid	[{"description":"Purchase of JBL Boombox 4","quantity":1,"unit_price":65000}]	2026-06-21	2026-07-21	2026-06-21 07:01:59		USD	1	\N	0
4	INV-19/06/2026-001	\N	3	John Kamau	PUrchase of Iron Sheets	10.00	480.00	4800.00	768.00	0.00	5568.00	Due on Receipt	paid	[]	2026-06-19	2026-07-19	2026-06-19 20:58:18		USD	1	\N	0
1	INV-19/06/2026-001	\N	2	Annritta Muriuki	Toyota Landcruiser Prado	1.00	5800000.00	5800000.00	928000.00	0.00	6728000.00	Net 30	overdue	[]	2026-06-19	2026-06-20	2026-06-19 10:49:10		USD	1	\N	0
15	INV-24/06/2026-010	\N	5	Mambo Mbaya	Purchase of Motorola Droid Razr 2026	1.00	256000.00	256000.00	40960.00	7900.00	289060.00	Net 30	partially_paid	[]	2026-06-24	2026-07-24	2026-06-24 07:47:56.942358		USD	1	\N	0
14	INV-24/06/2026-010	\N	3	Jane Doe	Purchase of macbook air M2 2022	1.00	179000.00	179000.00	28640.00	3800.00	203840.00	Net 30	partially_paid	[]	2026-06-24	2026-07-24	2026-06-24 07:46:44.402254		USD	1	\N	0
13	INV-21/06/2026-009	\N	5	Mambo Mbaya	Purchase of Jeep Wrangler	1.00	14000000.00	14000000.00	2240000.00	0.00	16240000.00	Net 30	paid	[{"description":"Purchase of Jeep Wrangler","quantity":1,"unit_price":14000000}]	2026-06-21	2026-07-21	2026-06-21 15:27:09		USD	1	\N	0
16	INV-04/07/2026-001	\N	4	Muriuki Waguthi Annrita	Audi SQ5	1.00	58000.00	58000.00	9280.00	899.00	66381.00	Net 30	paid	[]	2026-07-04	2026-08-03	2026-07-04 21:19:34.510861		USD	1	local-default	0
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, token, expires_at, created_at, client_db, tenant_id) FROM stdin;
1	1	f33f42d4-9ad7-42a7-be5c-b4029d212204	2025-10-31 22:24:57.595+03	2025-10-24 13:24:57+03		local-default
2	1	b3a108e7-a85d-4408-bea2-237a483ea2be	2025-10-31 22:24:58.256+03	2025-10-24 13:24:58+03		local-default
224	5	51a3bf1f-aaf9-4585-a7fd-f3f3817315b4	2026-07-10 23:24:53.159+03	2026-07-03 23:24:53.16336+03		local-default
226	5	91ce54cc-98db-4326-ad49-2d0352264b8e	2026-07-10 23:45:15.637+03	2026-07-03 23:45:15.660784+03		local-default
234	3	0cd718c0-8350-4fcc-8a1a-48ac95650e22	2026-07-11 22:12:17.138+03	2026-07-04 22:12:17.139161+03		local-default
55	6	97c4114a-67e1-4486-a68b-69da22fa3a61	2026-01-05 00:29:43.161+03	2025-12-28 18:29:43.162233+03		local-default
56	6	4f974af5-64bd-4f43-adbf-64a5b9a74c66	2026-01-05 00:29:51.293+03	2025-12-28 18:29:51.294054+03		local-default
115	1	531ac6c0-99d7-4818-a3ee-1ec14117ff78	2026-06-04 00:19:03.563+03	2026-06-03 00:19:03.567381+03		local-default
119	1	245eff2b-2f96-46f5-bb11-44c57e16299b	2026-06-15 12:50:39.981+03	2026-06-08 12:50:39.984406+03	client_fergy_solutions_mqw03mjh	local-default
120	1	d9f440af-38c9-4613-9133-1b7107134422	2026-06-10 22:02:50.278+03	2026-06-09 22:02:50.296388+03		local-default
121	1	c1d02293-9403-432e-b342-746a9c7486f0	2026-06-17 22:05:28.806+03	2026-06-10 22:05:28.807769+03		local-default
122	1	54b3179c-9ef3-4217-a492-22cf647e3ca7	2026-06-12 16:09:32.482+03	2026-06-11 16:09:32.514267+03		local-default
123	1	b8220b89-13eb-4b19-9735-2e3c9896194b	2026-06-13 19:17:45.412+03	2026-06-12 19:17:45.415593+03		local-default
124	1	0c6ec282-7a79-4d8b-ae4b-febc801ddac4	2026-06-15 07:24:15.009+03	2026-06-14 07:24:15.011546+03		local-default
125	1	f9006ab4-2fbd-4741-9595-2157df4a6630	2026-06-15 13:31:44.501+03	2026-06-14 13:31:44.5022+03		local-default
126	1	8746bbcd-d8c8-41d4-9f5b-f87fa3ef847e	2026-06-16 14:14:59.512+03	2026-06-15 14:14:59.514334+03		local-default
127	1	b8b5dc22-1022-44e2-9f43-7643b3187304	2026-06-17 15:50:36.317+03	2026-06-16 15:50:36.319015+03		local-default
\.


--
-- Data for Name: subscription_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_events (id, user_id, event_type, description, metadata, created_at, tenant_id) FROM stdin;
1	3	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-24T06:42:41.045Z","periodEnd":"2026-07-24T06:42:41.045Z"}	2026-06-24 09:42:41.069961	\N
3	3	expired	Subscription expired, grace period started	{}	2026-06-25 09:58:08.912931	\N
2	3	expired	Subscription expired, grace period started	{}	2026-06-25 09:58:08.911638	\N
4	3	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-25T07:13:08.602Z","periodEnd":"2026-07-25T07:13:08.602Z"}	2026-06-25 10:13:08.621552	\N
5	3	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-25T07:13:22.175Z","periodEnd":"2026-07-25T07:13:22.175Z"}	2026-06-25 10:13:22.192191	\N
6	5	expired	Subscription expired, grace period started	{}	2026-06-25 16:22:02.803097	\N
7	5	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-25T13:34:06.993Z","periodEnd":"2026-07-25T13:34:06.993Z"}	2026-06-25 16:34:07.013871	\N
8	5	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-25T13:34:16.795Z","periodEnd":"2026-07-25T13:34:16.795Z"}	2026-06-25 16:34:16.804885	\N
9	5	subscription_activated	Standard plan activated	{"plan":"Standard","durationDays":30,"periodStart":"2026-06-25T13:34:36.055Z","periodEnd":"2026-07-25T13:34:36.055Z"}	2026-06-25 16:34:36.061513	\N
10	5	expired	Subscription expired, grace period started	{}	2026-06-26 07:49:17.216233	\N
11	5	expired	Subscription expired, grace period started	{}	2026-06-26 07:49:17.221383	\N
12	5	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-26T04:50:23.251Z","periodEnd":"2026-07-26T04:50:23.251Z"}	2026-06-26 07:50:23.272524	\N
13	3	expired	Subscription expired, grace period started	{}	2026-06-26 09:31:03.60348	\N
14	3	expired	Subscription expired, grace period started	{}	2026-06-26 09:31:03.617096	\N
15	3	expired	Subscription expired, grace period started	{}	2026-06-26 09:31:05.024661	\N
16	3	expired	Subscription expired, grace period started	{}	2026-06-26 09:31:05.068796	\N
17	3	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-26T06:34:06.010Z","periodEnd":"2026-07-26T06:34:06.010Z"}	2026-06-26 09:34:06.036007	\N
18	3	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-26T06:34:12.546Z","periodEnd":"2026-07-26T06:34:12.546Z"}	2026-06-26 09:34:12.567284	\N
20	5	expired	Subscription expired, grace period started	{}	2026-06-26 20:11:34.836121	\N
19	5	expired	Subscription expired, grace period started	{}	2026-06-26 20:11:34.835319	\N
21	5	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-26T17:19:02.394Z","periodEnd":"2026-07-26T17:19:02.394Z"}	2026-06-26 20:19:02.420069	\N
22	5	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-26T17:19:18.082Z","periodEnd":"2026-07-26T17:19:18.082Z"}	2026-06-26 20:19:18.090575	\N
23	5	expiry_warning	Subscription expires in 5 days	{}	2026-06-27 05:08:53.935313	\N
24	5	expiry_warning	Subscription expires in 5 days	{}	2026-06-27 05:08:53.946603	\N
25	3	expired	Subscription expired, grace period started	{}	2026-06-27 05:11:15.2684	\N
26	3	expired	Subscription expired, grace period started	{}	2026-06-27 05:11:18.11552	\N
27	5	expiry_warning	Subscription expires in 3 days	{}	2026-06-27 05:54:19.011792	\N
28	5	expiry_warning	Subscription expires in 3 days	{}	2026-06-27 05:54:19.03385	\N
29	3	subscription_activated	Basic plan activated	{"plan":"Basic","durationDays":30,"periodStart":"2026-06-27T02:55:29.713Z","periodEnd":"2026-07-27T02:55:29.713Z"}	2026-06-27 05:55:30.038038	\N
30	5	expired	Subscription expired, grace period started	{}	2026-06-27 07:02:49.056834	\N
31	5	expired	Subscription expired, grace period started	{}	2026-06-27 07:02:49.068948	\N
32	5	expired	Subscription expired, grace period started	{}	2026-06-27 09:00:26.957835	\N
33	5	expired	Subscription expired, grace period started	{}	2026-06-27 09:00:27.005726	\N
34	3	expiry_warning	Subscription expires in 7 days	{}	2026-06-27 09:05:04.28059	\N
35	3	expiry_warning	Subscription expires in 7 days	{}	2026-06-27 09:05:07.497426	\N
\.


--
-- Data for Name: supplier_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_payments (id, invoice_id, client_id, client_name, amount, payment_date, payment_method, notes, created_at, currency, exchange_rate, tenant_id) FROM stdin;
1	1	2	Coolbreeze supplies limited	36200.00	2026-06-20	cash		2026-06-20 11:41:49	USD	1	\N
2	1	2	Coolbreeze supplies limited	30000.00	2026-06-20	cash		2026-06-20 11:42:23	USD	1	\N
3	1	2	Coolbreeze supplies limited	30000.00	2026-06-20	cash		2026-06-20 11:42:48	USD	1	\N
4	1	2	Coolbreeze supplies limited	30000.00	2026-06-20	cash		2026-06-20 11:43:24	USD	1	\N
5	2	1	ABC Supplies Ltd	1675040.00	2026-06-21	cash		2026-06-21 15:20:56	USD	1	\N
\.


--
-- Data for Name: sync_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sync_queue (id, table_name, record_id, action, data, created_at, synced_at, attempts) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, first_name, last_name, phone, subscription_plan, subscription_status, verified, subscription_expiry, role, encryption_key, grace_period_end, last_reminder_sent, payment_method, card_last4, card_expiry, paypal_email, created_at, trial_start_date, trial_end_date, trial_used, license_status, license_key, tenant_id, country, two_factor_enabled) FROM stdin;
1	admin@test.com	$2b$10$/D9iMheDcCXySa5By.t.eexGg9Lsg6MkT6Fc0EgrccRLf6.F2gUZO	Admin	User	0712345678	trial	active	1	2025-11-10 22:42:04+03	admin	\N	\N	\N	mpesa	\N	\N	\N	2025-10-27 16:24:57+03	\N	\N	0	trial		local-default		0
6	evanromanoff+test@gmail.com	$2b$10$mKFqZSNdEqOQdWFdEUQ/wewTbmRWHq1P3ciH7TXpmVngBzhh26wBO	Evan	Romanoff		trial	active	1	2026-01-04 03:29:43.151+03	admin	\N	\N	\N	mpesa	\N	\N	\N	2025-12-31 21:29:43.154333+03	2026-06-25 15:29:43.151+03	2026-06-28 15:29:43.151+03	1	trial		local-default		0
3	mambombaya1992@gmail.com	$2b$10$NjHevTMjmrgGvlga0IgneO42oKOju.l0jGLwdeEGM0P8Fsp8iXye.	Enock	Barasa	0715434805	Premium	active	1	2027-07-02 12:26:56.45+03	admin	\N	2026-07-05 06:02:28.669+03	2026-06-02 03:05:04.164+03	mpesa	\N	\N	\N	2025-10-29 14:12:35.081159+03	\N	\N	1	active	BL-2026-f9faab3f-343aab04778ed44f	local-default		0
5	digitalbaroz@gmail.com	$2b$10$15iNV3Getkw0G9dsCciF2.Vm5/rYKy2QNoyIIct.eXtdCy.BPbMqK	Digital	Baroz		Basic	active	1	2026-07-31 18:28:27.519+03	super_admin	\N	\N	2026-05-09 17:54:18.965+03	mpesa	\N	\N	\N	2025-12-29 07:33:51.237167+03	2026-06-25 13:33:51.236+03	2026-06-28 13:33:51.236+03	1	trial		local-default		0
\.


--
-- Data for Name: verification_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_codes (id, email, code, purpose, data, expires_at, used, created_at) FROM stdin;
1	Mambombaya1992@gmail.com	398562	signup	{}	2025-10-19 23:41:29.178+03	1	2025-10-18 08:31:29+03
2	mambombaya1992@gmail.com	706979	password_reset	{}	2025-10-21 17:19:51.378+03	1	2025-10-20 05:09:51.409812+03
3	mambombaya1992@gmail.com	246099	signup	{}	2025-10-21 17:22:16.666+03	1	2025-10-20 05:12:16.668577+03
4	enockbarasa254@gmail.com	570831	signup	{}	2025-12-16 23:25:19.865+03	1	2025-12-15 20:15:19.874657+03
5	enockbarasa254@gmail.com	260812	signup	{}	2025-12-18 02:58:14.409+03	0	2025-12-16 20:48:14.587894+03
6	test@test.com	452869	signup	{}	2025-12-19 15:35:01.306+03	0	2025-12-18 12:25:01.346567+03
7	digitalbaroz@gmail.com	590915	signup	{}	2025-12-20 00:50:53.482+03	1	2025-12-18 21:40:53.499781+03
10	digitalbaroz@gmail.com	667616	signup	{}	2025-12-20 13:15:46.133+03	1	2025-12-19 10:05:46.145847+03
11	digitalbaroz@gmail.com	872776	signup	{}	2025-12-20 13:33:56.993+03	1	2025-12-19 10:23:57.111733+03
15	digitalbaroz@gmail.com	140925	signup	{}	2025-12-21 01:43:19.333+03	1	2025-12-19 22:33:19.336599+03
16	evanromanoff+test@gmail.com	326786	signup	{}	2025-12-23 15:38:30.812+03	1	2025-12-22 12:28:30.815868+03
17	mambombaya1992@gmail.com	789504	password_reset	{}	2026-02-13 10:27:01.241+03	0	2026-02-13 04:17:01.249242+03
18	benfergy@gmail.com	373699	signup	{}	2026-06-06 15:50:09.483+03	1	2026-06-06 15:40:09.533377+03
19	benfergy@gmail.com	275363	signup	{}	2026-06-08 12:59:25.927+03	0	2026-06-08 12:49:25.934514+03
20	benfergy18@gmail.com	875327	signup	{}	2026-06-08 13:00:17.524+03	1	2026-06-08 12:50:17.527425+03
21	vaxaga4701@icotz.com	144546	signup	{}	2026-07-03 17:42:08.857+03	0	2026-07-03 17:32:08.864075+03
22	evanromanoff@gmail.com	926532	password_reset	{}	2026-07-03 21:48:20.143+03	0	2026-07-03 21:38:20.185234+03
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhooks (tenant_id, id, webhook_name, url, events, secret, is_active, last_triggered_at, created_at) FROM stdin;
\.


--
-- Name: admin_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_clients_id_seq', 5, true);


--
-- Name: admin_license_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_license_keys_id_seq', 4, true);


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1282, true);


--
-- Name: analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analytics_id_seq', 1, true);


--
-- Name: app_updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_updates_id_seq', 1, false);


--
-- Name: backups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.backups_id_seq', 1, false);


--
-- Name: billing_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.billing_history_id_seq', 12, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clients_id_seq', 3, true);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 56, true);


--
-- Name: credit_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.credit_notes_id_seq', 3, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 6, true);


--
-- Name: debit_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.debit_notes_id_seq', 1, true);


--
-- Name: electron_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.electron_activity_id_seq', 1, false);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 6, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 2, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenses_id_seq', 3, true);


--
-- Name: license_activations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.license_activations_id_seq', 1, false);


--
-- Name: license_installations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.license_installations_id_seq', 1, false);


--
-- Name: license_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.license_keys_id_seq', 1, false);


--
-- Name: licenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.licenses_id_seq', 1, true);


--
-- Name: offline_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.offline_sessions_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 18, true);


--
-- Name: purchase_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_invoices_id_seq', 2, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, true);


--
-- Name: quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotations_id_seq', 12, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 8492, true);


--
-- Name: salaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salaries_id_seq', 2, true);


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_invoices_id_seq', 16, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 234, true);


--
-- Name: subscription_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_events_id_seq', 35, true);


--
-- Name: supplier_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_payments_id_seq', 5, true);


--
-- Name: sync_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sync_queue_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 53, true);


--
-- Name: verification_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verification_codes_id_seq', 22, true);


--
-- Name: admin_clients admin_clients_database_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_clients
    ADD CONSTRAINT admin_clients_database_name_key UNIQUE (database_name);


--
-- Name: admin_clients admin_clients_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_clients
    ADD CONSTRAINT admin_clients_email_key UNIQUE (email);


--
-- Name: admin_clients admin_clients_license_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_clients
    ADD CONSTRAINT admin_clients_license_key_key UNIQUE (license_key);


--
-- Name: admin_clients admin_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_clients
    ADD CONSTRAINT admin_clients_pkey PRIMARY KEY (id);


--
-- Name: admin_license_keys admin_license_keys_license_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_license_keys
    ADD CONSTRAINT admin_license_keys_license_key_key UNIQUE (license_key);


--
-- Name: admin_license_keys admin_license_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_license_keys
    ADD CONSTRAINT admin_license_keys_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: app_updates app_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_updates
    ADD CONSTRAINT app_updates_pkey PRIMARY KEY (id);


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
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: backups backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_pkey PRIMARY KEY (id);


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
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_tenant_id_key UNIQUE (tenant_id);


--
-- Name: credit_notes credit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: debit_notes debit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_pkey PRIMARY KEY (id);


--
-- Name: electron_activity electron_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electron_activity
    ADD CONSTRAINT electron_activity_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


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
-- Name: license_activations license_activations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_activations
    ADD CONSTRAINT license_activations_pkey PRIMARY KEY (id);


--
-- Name: license_installations license_installations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_installations
    ADD CONSTRAINT license_installations_pkey PRIMARY KEY (id);


--
-- Name: license_keys license_keys_license_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_license_key_key UNIQUE (license_key);


--
-- Name: license_keys license_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_license_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_id_key UNIQUE (license_id);


--
-- Name: licenses licenses_license_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_key_key UNIQUE (license_key);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


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
-- Name: offline_sessions offline_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offline_sessions
    ADD CONSTRAINT offline_sessions_pkey PRIMARY KEY (id);


--
-- Name: offline_sessions offline_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offline_sessions
    ADD CONSTRAINT offline_sessions_session_token_key UNIQUE (session_token);


--
-- Name: other_transactions other_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.other_transactions
    ADD CONSTRAINT other_transactions_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


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
    ADD CONSTRAINT purchase_invoices_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (key);


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
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: salaries salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_pkey PRIMARY KEY (id);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


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
    ADD CONSTRAINT supplier_payments_pkey PRIMARY KEY (id);


--
-- Name: sync_queue sync_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: api_keys uq_api_keys_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT uq_api_keys_key UNIQUE (api_key);


--
-- Name: chart_of_accounts uq_coa_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT uq_coa_code UNIQUE (tenant_id, account_code);


--
-- Name: journal_entries uq_je_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT uq_je_number UNIQUE (tenant_id, entry_number);


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
-- Name: verification_codes verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: idx_al_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_date ON public.audit_log USING btree (created_at);


--
-- Name: idx_al_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_entity ON public.audit_log USING btree (entity_type);


--
-- Name: idx_ar_approver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ar_approver ON public.approval_requests USING btree (approved_by);


--
-- Name: idx_ar_requestor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ar_requestor ON public.approval_requests USING btree (requested_by);


--
-- Name: idx_billing_history_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_history_tenant_id ON public.billing_history USING btree (tenant_id);


--
-- Name: idx_bs_ba; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bs_ba ON public.bank_statements USING btree (bank_account_id);


--
-- Name: idx_clients_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_id ON public.clients USING btree (id);


--
-- Name: idx_clients_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_name ON public.clients USING btree (supplier_name);


--
-- Name: idx_clients_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_tenant_id ON public.clients USING btree (tenant_id);


--
-- Name: idx_coa_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coa_parent ON public.chart_of_accounts USING btree (parent_id);


--
-- Name: idx_company_settings_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_settings_tenant_id ON public.company_settings USING btree (tenant_id);


--
-- Name: idx_credit_notes_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_notes_customer ON public.credit_notes USING btree (customer_id);


--
-- Name: idx_credit_notes_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_notes_date ON public.credit_notes USING btree (issue_date);


--
-- Name: idx_credit_notes_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_notes_invoice ON public.credit_notes USING btree (invoice_id);


--
-- Name: idx_credit_notes_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_notes_tenant_id ON public.credit_notes USING btree (tenant_id);


--
-- Name: idx_customers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_id ON public.customers USING btree (id);


--
-- Name: idx_customers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_name ON public.customers USING btree (customer_name);


--
-- Name: idx_customers_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_tenant_id ON public.customers USING btree (tenant_id);


--
-- Name: idx_deals_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_customer ON public.deals USING btree (customer_id);


--
-- Name: idx_debit_notes_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debit_notes_date ON public.debit_notes USING btree (issue_date);


--
-- Name: idx_debit_notes_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debit_notes_tenant_id ON public.debit_notes USING btree (tenant_id);


--
-- Name: idx_dn_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dn_client ON public.debit_notes USING btree (client_id);


--
-- Name: idx_dn_pi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dn_pi ON public.debit_notes USING btree (purchase_invoice_id);


--
-- Name: idx_employees_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_id ON public.employees USING btree (id);


--
-- Name: idx_employees_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_tenant_id ON public.employees USING btree (tenant_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);


--
-- Name: idx_expenses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_status ON public.expenses USING btree (status);


--
-- Name: idx_expenses_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_tenant_id ON public.expenses USING btree (tenant_id);


--
-- Name: idx_it_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_it_item ON public.inventory_transactions USING btree (item_id);


--
-- Name: idx_je_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_je_date ON public.journal_entries USING btree (entry_date);


--
-- Name: idx_je_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_je_status ON public.journal_entries USING btree (status);


--
-- Name: idx_jel_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jel_account ON public.journal_entry_lines USING btree (account_id);


--
-- Name: idx_jel_je; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jel_je ON public.journal_entry_lines USING btree (journal_entry_id);


--
-- Name: idx_nl_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nl_read ON public.notification_log USING btree (is_read);


--
-- Name: idx_nl_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nl_user ON public.notification_log USING btree (user_id);


--
-- Name: idx_payments_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_customer ON public.payments USING btree (customer_id);


--
-- Name: idx_payments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_date ON public.payments USING btree (payment_date);


--
-- Name: idx_payments_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_invoice ON public.payments USING btree (invoice_id);


--
-- Name: idx_payments_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_invoice_id ON public.payments USING btree (invoice_id);


--
-- Name: idx_payments_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_tenant_id ON public.payments USING btree (tenant_id);


--
-- Name: idx_pi_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pi_client ON public.purchase_invoices USING btree (client_id);


--
-- Name: idx_pi_po; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pi_po ON public.purchase_invoices USING btree (po_id);


--
-- Name: idx_pi_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pi_status ON public.purchase_invoices USING btree (status);


--
-- Name: idx_po_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_po_client ON public.purchase_orders USING btree (client_id);


--
-- Name: idx_projects_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_customer ON public.projects USING btree (customer_id);


--
-- Name: idx_pt_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pt_project ON public.project_transactions USING btree (project_id);


--
-- Name: idx_purchase_invoices_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_invoices_date ON public.purchase_invoices USING btree (issue_date);


--
-- Name: idx_purchase_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_invoices_status ON public.purchase_invoices USING btree (status);


--
-- Name: idx_purchase_invoices_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_invoices_tenant_id ON public.purchase_invoices USING btree (tenant_id);


--
-- Name: idx_purchase_orders_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_orders_tenant_id ON public.purchase_orders USING btree (tenant_id);


--
-- Name: idx_quotations_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotations_customer ON public.quotations USING btree (customer_id);


--
-- Name: idx_quotations_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotations_customer_id ON public.quotations USING btree (customer_id);


--
-- Name: idx_quotations_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotations_tenant_id ON public.quotations USING btree (tenant_id);


--
-- Name: idx_rr_ba; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rr_ba ON public.reconciliation_runs USING btree (bank_account_id);


--
-- Name: idx_salaries_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salaries_date ON public.salaries USING btree (pay_date);


--
-- Name: idx_salaries_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salaries_employee ON public.salaries USING btree (employee_id);


--
-- Name: idx_salaries_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salaries_employee_id ON public.salaries USING btree (employee_id);


--
-- Name: idx_salaries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salaries_status ON public.salaries USING btree (status);


--
-- Name: idx_salaries_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salaries_tenant_id ON public.salaries USING btree (tenant_id);


--
-- Name: idx_sales_invoices_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoices_customer ON public.sales_invoices USING btree (customer_id);


--
-- Name: idx_sales_invoices_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoices_customer_id ON public.sales_invoices USING btree (customer_id);


--
-- Name: idx_sales_invoices_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoices_date ON public.sales_invoices USING btree (issue_date);


--
-- Name: idx_sales_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoices_status ON public.sales_invoices USING btree (status);


--
-- Name: idx_sales_invoices_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoices_tenant_id ON public.sales_invoices USING btree (tenant_id);


--
-- Name: idx_sessions_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_tenant_id ON public.sessions USING btree (tenant_id);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- Name: idx_si_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_si_date ON public.sales_invoices USING btree (issue_date);


--
-- Name: idx_si_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_si_status ON public.sales_invoices USING btree (status);


--
-- Name: idx_sp_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sp_client ON public.supplier_payments USING btree (client_id);


--
-- Name: idx_sp_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sp_invoice ON public.supplier_payments USING btree (invoice_id);


--
-- Name: idx_subscription_events_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_events_tenant_id ON public.subscription_events USING btree (tenant_id);


--
-- Name: idx_supplier_payments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_payments_date ON public.supplier_payments USING btree (payment_date);


--
-- Name: idx_supplier_payments_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_payments_invoice_id ON public.supplier_payments USING btree (invoice_id);


--
-- Name: idx_supplier_payments_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_payments_tenant_id ON public.supplier_payments USING btree (tenant_id);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: admin_license_keys admin_license_keys_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_license_keys
    ADD CONSTRAINT admin_license_keys_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.admin_clients(id) ON DELETE CASCADE;


--
-- Name: billing_history billing_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: credit_notes credit_notes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: credit_notes credit_notes_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id) ON DELETE CASCADE;


--
-- Name: debit_notes debit_notes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: debit_notes debit_notes_purchase_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_purchase_invoice_id_fkey FOREIGN KEY (purchase_invoice_id) REFERENCES public.purchase_invoices(id) ON DELETE CASCADE;


--
-- Name: credit_notes fk_credit_notes_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT fk_credit_notes_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: credit_notes fk_credit_notes_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT fk_credit_notes_invoice FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id) ON DELETE SET NULL;


--
-- Name: debit_notes fk_dn_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT fk_dn_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: debit_notes fk_dn_pi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT fk_dn_pi FOREIGN KEY (purchase_invoice_id) REFERENCES public.purchase_invoices(id) ON DELETE SET NULL;


--
-- Name: payments fk_payments_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: payments fk_payments_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id) ON DELETE SET NULL;


--
-- Name: purchase_invoices fk_pi_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT fk_pi_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: purchase_invoices fk_pi_po; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT fk_pi_po FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;


--
-- Name: purchase_orders fk_po_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_po_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: quotations fk_quotations_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT fk_quotations_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: salaries fk_salaries_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT fk_salaries_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: sales_invoices fk_sales_invoices_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT fk_sales_invoices_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: supplier_payments fk_sp_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT fk_sp_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: supplier_payments fk_sp_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT fk_sp_invoice FOREIGN KEY (invoice_id) REFERENCES public.purchase_invoices(id) ON DELETE SET NULL;


--
-- Name: offline_sessions offline_sessions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offline_sessions
    ADD CONSTRAINT offline_sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.admin_clients(id) ON DELETE CASCADE;


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id) ON DELETE CASCADE;


--
-- Name: purchase_invoices purchase_invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: purchase_invoices purchase_invoices_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;


--
-- Name: purchase_orders purchase_orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: quotations quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: salaries salaries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: sales_invoices sales_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: sales_invoices sales_invoices_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;


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
-- Name: supplier_payments supplier_payments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: supplier_payments supplier_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.purchase_invoices(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict hz3vs768SBivF8r1Z9a2dm5qKpPBp4qOZeM3rmBM43oWWapz8FHscg16YiXhSSg

