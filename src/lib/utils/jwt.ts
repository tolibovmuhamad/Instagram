export interface JwtClaims {
  sid: string;
  name: string;
  email: string;
  exp: number;
  iss: string;
  aud: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

export function decodeJwt<T = JwtClaims>(token: string): T | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const claims = decodeJwt(token);
  if (!claims?.exp) return true;
  return Date.now() >= claims.exp * 1000;
}
