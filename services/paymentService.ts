/**
 * Payment service: PayAnyWay subscription management
 */

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

export interface Plan {
  id: string;
  label: string;
  amount: number;
  currency: string;
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  plan?: string;
  expires_at?: string;
  expired?: boolean;
  email?: string;
}

/** Get available plans */
export async function getPlans(): Promise<Plan[]> {
  const resp = await fetch(`${BACKEND_URL}/api/payments/plans`);
  const data = await resp.json();
  return data.plans;
}

/** Create a payment link and redirect user */
export async function createPayment(plan: string, sessionToken: string): Promise<string> {
  const resp = await fetch(`${BACKEND_URL}/api/payments/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ plan }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Ошибка оплаты' }));
    throw new Error(err.detail || 'Ошибка создания платежа');
  }

  const data = await resp.json();
  return data.url;
}

/** Check subscription status */
export async function checkSubscription(sessionToken: string): Promise<SubscriptionStatus> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/payments/status`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    return await resp.json();
  } catch {
    return { has_subscription: false };
  }
}
