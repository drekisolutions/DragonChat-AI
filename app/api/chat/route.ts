import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { message, botName, businessName, faqs } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400, headers: CORS_HEADERS });
    }

    const faqText = Array.isArray(faqs) && faqs.length > 0
      ? faqs.map((f: { question: string; answer: string }) =>
          `Q: ${f.question}\nA: ${f.answer}`
        ).join('\n\n')
      : '';

    const systemPrompt = `You are ${botName || 'AI Assistant'}, a helpful AI assistant for ${businessName || 'this business'}. ${faqText ? `Answer questions using these FAQs:\n${faqText}\n\n` : ''}Be friendly and concise (1-3 sentences). If you cannot answer, offer to connect them with the team.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Smart fallback if no API key configured yet
    if (!apiKey || apiKey.includes('REPLACE')) {
      const lower = message.toLowerCase();
      let reply = '';

      if (Array.isArray(faqs)) {
        for (const faq of faqs) {
          const keywords = faq.question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
          if (keywords.some((kw: string) => lower.includes(kw))) {
            reply = faq.answer;
            break;
          }
        }
      }

      if (!reply) {
        if (lower.match(/^(hi|hello|hey|good\s*(morning|afternoon|evening))/)) {
          reply = `Hello! Welcome to ${businessName || 'our business'}. How can I assist you today?`;
        } else if (lower.includes('hour') || lower.includes('open') || lower.includes('close')) {
          reply = 'Our business hours are Monday–Friday, 9am–5pm. Feel free to reach out anytime!';
        } else if (lower.includes('price') || lower.includes('cost') || lower.includes('quote')) {
          reply = "I'd love to help with pricing! Please contact our team directly for a custom quote.";
        } else if (lower.includes('phone') || lower.includes('call') || lower.includes('contact')) {
          reply = 'You can reach our team through the contact form on our website and we will get back to you promptly!';
        } else {
          reply = 'Thanks for reaching out! Can I get your contact info so our team can follow up with you?';
        }
      }

      return NextResponse.json({ reply }, { headers: CORS_HEADERS });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I'm here to help! Could you clarify your question?";

    return NextResponse.json({ reply }, { headers: CORS_HEADERS });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Chat API error:', msg);
    return NextResponse.json({
      reply: "I'm having a moment — please try again or contact us directly!",
    }, { headers: CORS_HEADERS });
  }
}
