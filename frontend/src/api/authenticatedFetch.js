import { auth } from "../firebase.js";

export async function getCurrentUserIdToken() {
  if (!auth.currentUser) {
    throw new Error("로그인 후 다시 시도해주세요.");
  }

  return auth.currentUser.getIdToken();
}

export async function authenticatedFetch(url, options = {}) {
  const token = await getCurrentUserIdToken();
  const headers = new Headers(options.headers || {});

  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}
