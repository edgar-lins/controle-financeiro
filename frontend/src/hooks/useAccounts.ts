import { useState, useCallback } from 'react';
import API_URL from '../config/api';
import type { Account } from '../types';

export function useAccounts(): [Account[], () => Promise<void>] {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const fetchAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Account[] = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    }
  }, []);

  return [accounts, fetchAccounts];
}
