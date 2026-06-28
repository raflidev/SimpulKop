import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { VENDORS, KOPDES } from './data.js';

function persist(key, initial) {
  const stored = browser ? localStorage.getItem(key) : null;
  let data = stored ? JSON.parse(stored) : initial;
  // deduplicate by id (guards against stale localStorage accumulation)
  const seen = new Set();
  data = data.filter(item => seen.has(item.id) ? false : seen.add(item.id));
  const store = writable(data);
  if (browser) store.subscribe(v => localStorage.setItem(key, JSON.stringify(v)));
  return store;
}

export const vendors = persist('simpulkop_vendors', VENDORS);
export const kopdes = persist('simpulkop_kopdes', KOPDES);
