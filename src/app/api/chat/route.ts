import { NextResponse } from 'next/server';

const FAQ: Record<string, string> = {
  pricing: 'We offer plans from KES 600/month (Basic) to KES 1,500/month (Premium), plus a Custom plan for enterprises. All plans include a 3-day free trial. Visit /pricing for full details.',
  trial: 'Yes! All plans come with a 3-day free trial — no credit card required. All features are included during the trial.',
  features: 'BiasharaLedger includes inventory management, sales & POS, accounting, payroll, reporting, and multi-currency support. Visit /features to see everything.',
  support: 'You can reach us at support@biasharaledger.com or call +254 115 804 761. We typically respond within 24 hours.',
  billing: 'We accept M-Pesa, credit/debit cards, and bank transfers. Choose monthly or yearly billing — yearly saves ~17%.',
  desktop: 'Desktop and mobile apps are coming soon. You can use BiasharaLedger online from any browser in the meantime.',
};

function getReply(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('pricing') || lower.includes('kes') || lower.includes('much')) {
    return FAQ.pricing;
  }
  if (lower.includes('trial') || lower.includes('free') || lower.includes('try')) {
    return FAQ.trial;
  }
  if (lower.includes('feature') || lower.includes('what can') || lower.includes('do you')) {
    return FAQ.features;
  }
  if (lower.includes('support') || lower.includes('help') || lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('call')) {
    return FAQ.support;
  }
  if (lower.includes('pay') || lower.includes('mpesa') || lower.includes('card') || lower.includes('bill') || lower.includes('invoice')) {
    return FAQ.billing;
  }
  if (lower.includes('download') || lower.includes('desktop') || lower.includes('app') || lower.includes('mobile') || lower.includes('offline')) {
    return FAQ.desktop;
  }
  if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) {
    return "Hello! Welcome to BiasharaLedger. How can I help you today? You can ask about pricing, features, trials, or anything else about our platform.";
  }

  return "I'm not sure I understood that. You can ask me about pricing, features, trials, billing, support, or the desktop app. Or email us at support@biasharaledger.com for more help.";
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: 'Please send a text message.' }, { status: 400 });
    }
    const reply = getReply(message.slice(0, 500));
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: 'Sorry, something went wrong. Please try again.' }, { status: 500 });
  }
}
