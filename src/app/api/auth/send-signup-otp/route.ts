import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const sql = neon(process.env.DATABASE_URL!);
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already registered' }, { status: 409 });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 1. SAVE OTP TO DATABASE (Avoids serverless in-memory wipe bug)
    await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${email}, ${otp}, ${expires})
      ON CONFLICT (identifier) 
      DO UPDATE SET token = ${otp}, expires = ${expires}
    `;

    // 2. CONFIGURE NODEMAILER TRANSPORTER (Strict SSL for Port 465)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 3. DISPATCH EMAIL VIA GMAIL SMTP
    console.log(`📧 Dispatching live email OTP to ${email}`);
    await transporter.sendMail({
      from: `"Biashara Ledger" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your Verification Code: ${otp}`,
      text: `Your signup verification OTP is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Verify Your Email</h2>
          <p>Thank you for registering. Use the following One-Time Password (OTP) to complete your signup process:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 2px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to email!',
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
