import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';

export async function GET() {
  try {
    const employees = await adminQuery(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'employees' 
       ORDER BY ordinal_position`
    );
    const leave = await adminQuery(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'leave_requests' 
       ORDER BY ordinal_position`
    );
    const attendance = await adminQuery(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'attendance' 
       ORDER BY ordinal_position`
    );
    return NextResponse.json({ employees, leave, attendance });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
