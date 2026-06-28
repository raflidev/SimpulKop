import { json } from '@sveltejs/kit';
import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '$env/static/private';
import { VENDORS, KOPDES, buildVendorContext } from '$lib/data.js';

const client = new Groq({ apiKey: GROQ_API_KEY });

const SYSTEM = `Kamu adalah asisten pengadaan SimpulKop untuk koperasi desa di Kabupaten Sleman, Yogyakarta.
Tugasmu: bantu pengurus koperasi menemukan vendor/UMKM terbaik sesuai kebutuhan mereka.

Panduan menjawab:
- Gunakan Bahasa Indonesia yang sederhana dan langsung.
- Sebutkan nama vendor, lokasi desa, metode bayar, dan info penting lainnya.
- Jika ada beberapa pilihan, bandingkan dan rekomendasikan yang terbaik.
- Gunakan format yang mudah dibaca (bisa gunakan poin atau baris pendek).
- Jika ditanya jarak, jelaskan berdasarkan kedekatan desa/kecamatan (Ngaglik, Mlati, Depok).

DATA KOPERASI DESA (8 kopdes):
${KOPDES.map(k => `- ${k.nama} (${k.id}): ${k.desa}, ${k.kecamatan} | ${k.anggota} anggota | Kebutuhan: ${k.kebutuhan}`).join('\n')}

DATA VENDOR & UMKM TERDAFTAR (${VENDORS.length} vendor):
${buildVendorContext()}`;

export async function POST({ request }) {
  const { messages } = await request.json();

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [{ role: 'system', content: SYSTEM }, ...messages]
  });

  return json({ reply: response.choices[0].message.content });
}
