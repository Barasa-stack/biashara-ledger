import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

async function seed() {
  const session = await getSessionFromCookies();
  if (!session) { console.error('Must be logged in'); process.exit(1); }

  await withTenantContext(session.tenant_id!, async () => {
    // Create test customers if none exist
    const existing = await query('SELECT COUNT(*) as c FROM customers WHERE tenant_id=$1', [session.tenant_id]) as any[];
    if (Number(existing?.[0]?.c) > 5) { console.log('Already has data, skipping seed'); return; }

    const customers = [
      { name: 'Acme Corp', contact: 'John Doe', email: 'john@acme.com', phone: '0711000111' },
      { name: 'TechVille Ltd', contact: 'Jane Smith', email: 'jane@techville.com', phone: '0722000222' },
      { name: 'GreenLeaf Enterprises', contact: 'Bob Kimani', email: 'bob@greenleaf.co.ke', phone: '0733000333' },
      { name: 'Safari Logistics', contact: 'Alice Wanjiku', email: 'alice@safari.co.ke', phone: '0744000444' },
      { name: 'BlueWave Media', contact: 'Tom Otieno', email: 'tom@bluewave.com', phone: '0755000555' },
      { name: 'Mountain View Hotel', contact: 'Grace Muthoni', email: 'grace@mountainview.co.ke', phone: '0766000666' },
    ];

    const custIds: string[] = [];
    for (const c of customers) {
      const r = await insertReturning<{ id: string }>(
        `INSERT INTO customers (tenant_id, customer_name, contact_person, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [session.tenant_id, c.name, c.contact, c.email, c.phone]
      );
      custIds.push(r.id);
    }
    console.log(`Created ${custIds.length} customers`);

    // Create dummy deals
    const deals = [
      { name: 'ERP Implementation', cust: 0, value: 2500000, stage: 'negotiation', prob: 70, close: '2026-08-15' },
      { name: 'Website Redesign', cust: 1, value: 850000, stage: 'proposal', prob: 50, close: '2026-07-30' },
      { name: 'Cloud Migration', cust: 2, value: 1800000, stage: 'qualified', prob: 30, close: '2026-09-01' },
      { name: 'IT Support Contract', cust: 3, value: 600000, stage: 'lead', prob: 10, close: '2026-08-01' },
      { name: 'POS System Rollout', cust: 4, value: 3200000, stage: 'negotiation', prob: 65, close: '2026-10-01' },
      { name: 'Digital Marketing Campaign', cust: 5, value: 450000, stage: 'proposal', prob: 45, close: '2026-07-15' },
      { name: 'Accounting Software Setup', cust: 0, value: 1200000, stage: 'qualified', prob: 25, close: '2026-08-30' },
      { name: 'Security Audit', cust: 2, value: 350000, stage: 'lead', prob: 10, close: '2026-07-20' },
      { name: 'Staff Training Program', cust: 1, value: 280000, stage: 'closed_won', prob: 100, close: '2026-06-15' },
      { name: 'Hardware Supply Deal', cust: 3, value: 750000, stage: 'closed_lost', prob: 0, close: '2026-05-01' },
    ];

    for (const d of deals) {
      await run(
        `INSERT INTO deals (tenant_id, deal_name, customer_id, deal_value, pipeline_stage, probability, expected_close_date, status, lost_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [session.tenant_id, d.name, custIds[d.cust], d.value, d.stage, d.prob, d.close,
         d.stage === 'closed_won' ? 'won' : d.stage === 'closed_lost' ? 'lost' : 'active',
         d.stage === 'closed_lost' ? 'budget' : '']
      );
    }
    console.log('Created 10 deals');

    // Dummy activities
    const activities = [
      { type: 'call', cust: 0, subj: 'Discussed ERP timeline', desc: 'Spoke with John about Q3 delivery', ago: 1 },
      { type: 'email', cust: 1, subj: 'Sent proposal for website redesign', desc: 'Including mockups and pricing', ago: 2 },
      { type: 'meeting', cust: 2, subj: 'Cloud migration requirements gathering', desc: 'Met with IT team for 2 hours', ago: 3 },
      { type: 'note', cust: 3, subj: 'Follow-up needed', desc: 'Call back next week about support contract', ago: 5 },
      { type: 'call', cust: 4, subj: 'POS pricing discussion', desc: 'Discussed volume discount options', ago: 7 },
      { type: 'email', cust: 5, subj: 'Digital marketing proposal', desc: 'Sent campaign options and pricing', ago: 1 },
      { type: 'meeting', cust: 0, subj: 'Quarterly review', desc: 'Reviewed ERP project milestones', ago: 10 },
      { type: 'note', cust: 1, subj: 'Internal note', desc: 'Jane mentioned budget approval next week', ago: 4 },
    ];

    for (const a of activities) {
      const date = new Date();
      date.setDate(date.getDate() - a.ago);
      await run(
        `INSERT INTO activity_log (tenant_id, customer_id, type, subject, description, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [session.tenant_id, custIds[a.cust], a.type, a.subj, a.desc, date.toISOString()]
      );
    }
    console.log('Created 8 activities');
  });
  console.log('Seed complete!');
}

seed().catch(e => { console.error(e); process.exit(1); });
