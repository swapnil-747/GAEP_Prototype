// Pure login validation — mock only, no real auth, no network.
export function isValidLogin(username: string, password: string): boolean {
  return username.trim().length > 0 && password.trim().length > 0;
}
