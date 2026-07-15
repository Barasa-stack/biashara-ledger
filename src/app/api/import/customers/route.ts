import { NextResponse } from 'next/server';
import { query, run, insertReturning, get, withTenantContext, transaction } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');

    const body = await request.json();
    const { rows, mappings, file_name } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows to import' }, { status: 400 });
    }

    const result = await withTenantContext(session.tenant_id!, async () => {
      const errors: { row: number; field: string; message: string; value: string }[] = [];
      const imported: string[] = [];
      const existingEmails = new Set<string>();

      // Load existing emails for duplicate check
      const existing = await query('SELECT LOWER(email_address) as email FROM customers');
      for (const r of existing) {
        existingEmails.add((r as any).email);
      }

      const fileSeenEmails = new Set<string>();
      const validRows: Array<Record<string, any>> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, string>;
        const rowErrors: { row: number; field: string; message: string; value: string }[] = [];
        const rowNum = i + 2;

        const customerName = (row.customer_name || '').trim();
        const companyName = (row.company_name || '').trim();
        const contactPerson = (row.contact_person || '').trim();
        const email = (row.email_address || '').trim();
        const phone = (row.phone_number || '').trim();
        const billingAddress = (row.billing_address || '').trim();
        const shippingAddress = (row.shipping_address || '').trim();
        const taxId = (row.tax_id || '').trim();
        const country = (row.country || '').trim();
        const paymentTerms = (row.payment_terms || 'Net 30').trim();
        const creditLimit = Number(row.credit_limit) || 0;
        const notes = (row.notes || '').trim();

        if (!customerName && !companyName) {
          rowErrors.push({ row: rowNum, field: 'Customer Name', message: 'Either Customer Name or Company Name is required', value: customerName || companyName });
        }

        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const normalizedEmail = email.toLowerCase();
          if (!emailRegex.test(email)) {
            rowErrors.push({ row: rowNum, field: 'Email', message: `Invalid email format: "${email}"`, value: email });
          } else if (existingEmails.has(normalizedEmail)) {
            rowErrors.push({ row: rowNum, field: 'Email', message: `Duplicate email: "${email}"`, value: email });
          } else if (fileSeenEmails.has(normalizedEmail)) {
            rowErrors.push({ row: rowNum, field: 'Email', message: `Duplicate email in file: "${email}"`, value: email });
          } else {
            fileSeenEmails.add(normalizedEmail);
          }
        }

        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          continue;
        }

        validRows.push({
          customer_name: customerName || companyName || 'Imported',
          company_name: companyName || ' ',
          contact_person: contactPerson || '',
          email_address: email || '',
          phone_number: phone || '',
          billing_address: billingAddress || '',
          shipping_address: shippingAddress || '',
          tax_id: taxId || '',
          country: country || '',
          payment_terms: paymentTerms,
          credit_limit: creditLimit,
          notes: notes || '',
        });
      }

      if (validRows.length > 0) {
        try {
          await transaction(async (client) => {
            for (const validRow of validRows) {
              await client.query(
                `INSERT INTO customers (tenant_id, customer_name, company_name, contact_person, email_address, phone_number, billing_address, shipping_address, tax_id, country, payment_terms, credit_limit, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [session.tenant_id, validRow.customer_name, validRow.company_name, validRow.contact_person,
                 validRow.email_address, validRow.phone_number, validRow.billing_address, validRow.shipping_address,
                 validRow.tax_id, validRow.country, validRow.payment_terms, validRow.credit_limit, validRow.notes]
              );
            }
          });
          imported.push(...Array(validRows.length).fill('imported'));
        } catch (dbErr: any) {
          errors.push({ row: 0, field: 'Database', message: dbErr.message || 'Failed to insert valid rows', value: '' });
        }
      }

      if (imported.length > 0) {
        await run(
          `INSERT INTO audit_log (tenant_id, user_id, entity_type, imported_count, errors_count, error_details, file_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [session.tenant_id, session.user_id || session.tenant_id!, 'customers', imported.length, errors.length,
           JSON.stringify(errors), file_name || '']
        );
      } else {
        await run(
          `INSERT INTO audit_log (tenant_id, user_id, entity_type, imported_count, errors_count, error_details, file_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [session.tenant_id, session.user_id || session.tenant_id!, 'customers', 0, errors.length,
           JSON.stringify(errors), file_name || '']
        );
      }

      return {
        imported: imported.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 100),
      };
    });

    return NextResponse.json(result, { status: result.errors > 0 ? 207 : 201 });
  } catch (err: any) {
    console.error('[import/customers] Error:', err.message, err.stack);
    const msg = err.message === 'Unauthorized' ? 'Unauthorized' : `Import failed: ${err.message}`;
    return NextResponse.json({ error: msg }, { status: err.message === 'Unauthorized' ? 401 : 500 });
  }
}
