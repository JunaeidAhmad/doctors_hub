import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'dh_lang';
const listeners = new Set();

function readStoredLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

let currentLang = readStoredLang();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentLang;
}

export function getLang() {
  return currentLang;
}

export function setLang(next) {
  const value = next === 'bn' ? 'bn' : 'en';
  if (value === currentLang) return;
  currentLang = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
  }
  listeners.forEach((l) => l());
}

export function toggleLang() {
  setLang(currentLang === 'bn' ? 'en' : 'bn');
}

export function useLang() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
