import { Committee, Member, PujaEdition } from '../types';

const SESSION_TOKEN_KEY = 'pooja-samiti.d1SessionToken';

export type AppUser = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  type: 'ADMIN' | 'MEMBER';
};

export function getSessionToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSessionToken(token: string) {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `${response.status} ${response.statusText}`);
  }
  return data as T;
}

export async function getSession() {
  return apiRequest<{ user: AppUser; committee: Committee; member: Member | null }>('/api/auth/session');
}

export async function logoutSession() {
  return apiRequest<{ ok: true }>('/api/auth/logout', { method: 'POST' });
}

export async function loginAdmin(email: string, password: string) {
  const data = await apiRequest<{ token: string; committee: Committee; user: AppUser }>('/api/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSessionToken(data.token);
  return data;
}

export async function startAdminRegistration(payload: Record<string, unknown>) {
  return apiRequest<{ ok: true; email: string; delivery: string; expiresAt: string; developmentCode?: string }>('/api/auth/admin-register/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmAdminRegistration(email: string, code: string) {
  const data = await apiRequest<{ token: string; committee: Committee; user: AppUser }>('/api/auth/admin-register/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
  setSessionToken(data.token);
  return data;
}

export async function loginMember(phone: string, code: string) {
  const data = await apiRequest<{ token: string; committee: Committee; member: Member }>('/api/auth/member-login', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  setSessionToken(data.token);
  return data;
}

export async function apiList<T>(committeeId: string, collectionName: string) {
  const data = await apiRequest<{ records: T[] }>(`/api/d1/committees/${committeeId}/${collectionName}`);
  return data.records;
}

export async function apiCreate<T>(committeeId: string, collectionName: string, record: Partial<T>) {
  const data = await apiRequest<{ id: string; record: T }>(`/api/d1/committees/${committeeId}/${collectionName}`, {
    method: 'POST',
    body: JSON.stringify(record),
  });
  return data.record;
}

export async function apiUpdate<T>(committeeId: string, collectionName: string, recordId: string, updates: Partial<T>) {
  const data = await apiRequest<{ record: T }>(`/api/d1/committees/${committeeId}/${collectionName}/${encodeURIComponent(recordId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.record;
}

export async function apiDelete(committeeId: string, collectionName: string, recordId: string) {
  return apiRequest<{ ok: true }>(`/api/d1/committees/${committeeId}/${collectionName}/${encodeURIComponent(recordId)}`, {
    method: 'DELETE',
  });
}

export async function apiUpdateCommittee(committeeId: string, updates: Partial<Committee>) {
  const data = await apiRequest<{ record: Committee }>(`/api/d1/committees/${committeeId}/committee`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.record;
}

export async function getCurrentEdition(committee: Committee) {
  if (!committee.currentEditionId) return null;
  const editions = await apiList<PujaEdition>(committee.committeeId || committee.id!, 'editions');
  return editions.find(edition => edition.id === committee.currentEditionId) || null;
}
