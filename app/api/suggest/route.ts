import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { question, businessName } = await req.json();
    if (!question) return NextResponse.json({ answer: '' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.includes('REPLACE')) {
      // Fallback suggestions when no key configured
      const suggestions: Record<string, string> = {
        hour:     'We are open Monday–Friday, 8am–6pm, and Saturday 9am–2pm.',
        price:    'Please contact us for a free custom quote tailored to your needs.',
        location: 'We are conveniently located in the local area — contact us for our full address.',
        quote:    'We offer free estimates! Give us a call or fill out our contact form to get started.',
        emergency:'Yes, we offer 24/7 emergency service. Call our main line and press 1 for emergencies.',
      };

      const lower = question.toLowerCase();
      const match = Object.entries(suggestions).find(([k]) => lower.includes(k));
      return NextResponse.json({ answer: match ? match[1] : 'Please contact our team directly for assistance with this question.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 80,
        system: `You are helping ${businessName || 'a business'} write a professional chatbot FAQ answer. Keep it under 25 words. Be clear, friendly, and helpful. Reply with ONLY the answer text — no quotes, no intro.`,
        messages: [{ role: 'user', content: `Write an answer for: "${question}"` }],
      }),
    });

    const data = await response.json();
    const answer = data.content?.[0]?.text?.trim() || '';
    return NextResponse.json({ answer });

  } catch {
    return NextResponse.json({ answer: 'Please contact our team directly for assistance.' });
  }
}
