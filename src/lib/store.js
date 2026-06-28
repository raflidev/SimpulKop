import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { VENDORS, KOPDES } from './data.js';

function persist(key, initial) {
  const stored = browser ? localStorage.getItem(key) : null;
  const store = writable(stored ? JSON.parse(stored) : initial);
  if (browser) store.subscribe(v => localStorage.setItem(key, JSON.stringify(v)));
  return store;
}

export const vendors = persist('simpulkop_vendors', VENDORS);
export const kopdes = persist('simpulkop_kopdes', KOPDES);
