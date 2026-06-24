'use client';

import { useEffect, useState } from 'react';

let cachedToken: string | null = null;

export function useCsrfToken(): string {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    if (cachedToken) {
      setToken(cachedToken);
      return;
    }

    fetch('/api/csrf')
      .then(r => r.json())
      .then(data => {
        if (data.token) {
          cachedToken = data.token;
          setToken(data.token);
        }
      })
      .catch(() => {});
  }, []);

  return token;
}

export function getCsrfHeaders(token: string): HeadersInit {
  return {
    'x-csrf-token': token,
  };
}

export function withCsrfToken(body: any, token: string): any {
  return { ...body, _csrf: token };
}