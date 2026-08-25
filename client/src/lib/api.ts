/**
 * The single place the browser talks to the API. Every call returns a
 * discriminated result rather than throwing, so callers handle the failure
 * cases the form actually needs to distinguish — a field-level validation
 * problem, a slot that filled, or an outage — instead of a generic catch.
 */

export interface Slot {
  time: string;
  available: boolean;
  areas: string[];
}

export interface Availability {
  date: string;
  open: boolean;
  reason?: string;
  slots: Slot[];
}

export interface Booking {
  reference: string;
  date: string;
  time: string;
  partySize: number;
  seatingArea: string;
  seatingAreaName: string;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  dietaryNotes: string;
  accessibilityNotes: string;
  status: string;
  createdAt: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'validation'; message: string; fields: Record<string, string> }
  | { ok: false; kind: 'conflict'; message: string; code?: string }
  | { ok: false; kind: 'notFound'; message: string }
  | { ok: false; kind: 'error'; message: string };

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    return { ok: false, kind: 'error', message: 'Could not reach the restaurant. Check your connection.' };
  }

  let body: any = null;
  try { body = await res.json(); } catch { /* empty or non-JSON body */ }

  if (res.ok) return { ok: true, data: body as T };

  const message = body?.error?.message ?? 'Something went wrong.';
  if (res.status === 422) {
    return { ok: false, kind: 'validation', message, fields: body?.error?.fields ?? {} };
  }
  if (res.status === 409) return { ok: false, kind: 'conflict', message, code: body?.error?.code };
  if (res.status === 404) return { ok: false, kind: 'notFound', message };
  return { ok: false, kind: 'error', message };
}

export function getAvailability(date: string, party: number) {
  return request<Availability>(`/api/availability?date=${encodeURIComponent(date)}&party=${party}`);
}

export function getReservation(reference: string) {
  return request<{ booking: Booking }>(`/api/reservations?reference=${encodeURIComponent(reference)}`);
}

export interface BookingInput {
  date: string;
  time: string;
  partySize: number;
  seatingArea: string;
  name: string;
  email: string;
  phone: string;
  occasion?: string;
  dietaryNotes?: string;
  accessibilityNotes?: string;
}

export function createReservation(input: BookingInput) {
  return request<{ booking: Booking }>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
