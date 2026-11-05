// Token login disimpan di localStorage. Bila penyimpanan diblokir (mode privat, data situs
// dibersihkan), token tetap dipegang di memori selama tab terbuka.
const KEY = "auth-token";
let memory = null;
export const getToken = () => { try { return localStorage.getItem(KEY) ?? memory; } catch { return memory; } };
export const setToken = (t) => { memory = t; try { localStorage.setItem(KEY, t); } catch { /* abaikan */ } };
export const clearToken = () => { memory = null; try { localStorage.removeItem(KEY); } catch { /* abaikan */ } };
