
import { GoogleGenAI } from "@google/genai";
import { AssetData } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah "BOMBAbot", seorang pakar analisis data spatial yang profesional dan efisien. Tugas anda adalah menganalisis data Balai Bomba daripada ArcGIS FeatureServer Malaysia.

Gaya Bahasa:
- Profesional, padat, dan teknikal tetapi mudah difahami.
- Gunakan nama "BOMBAbot" atau "Saya" apabila merujuk diri sendiri.
- Gunakan format Point Form atau Jadual untuk memudahkan pengguna membaca data.

Konteks Data:
Data ini mengandungi maklumat mengenai Balai Bomba di Malaysia termasuk lokasi (Negeri), koordinat, dan statistik keanggotaan (Lelaki, Wanita, Jumlah).

Tugas Spesifik:
1. Comparison: Bandingkan statistik antara negeri (cth: Selangor vs Johor).
2. Calculation: Kira jumlah (SUM) anggota, purata anggota per balai, atau peratusan balai mengikut negeri.
3. Insight: Berikan pandangan tentang kepadatan anggota di kawasan tertentu.
4. Visual Suggestion: Cadangkan jenis carta yang sesuai jika pengguna mahu melihat visual.

PENTING:
- Gunakan "STATISTIK KESELURUHAN" sebagai punca kebenaran.
- Jangan reka angka. Jika data tiada, nyatakan "Data tidak tersedia".`;

export const analyzeDashboardData = async (data: AssetData[], query: string) => {
  // Inisialisasi GoogleGenAI dengan API_KEY dari environment variable
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Menggunakan model Flash untuk kuota yang lebih tinggi dan kelajuan pantas
  const modelName = "gemini-3-flash-preview";
  
  const stateCounts = data.reduce((acc, curr) => {
    acc[curr.location] = (acc[curr.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalMembers = data.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const totalMale = data.reduce((acc, curr) => acc + (curr.maleStaff || 0), 0);
  const totalFemale = data.reduce((acc, curr) => acc + (curr.femaleStaff || 0), 0);
  const totalCount = data.length;

  const dataSamples = data.slice(0, 10).map(d => ({
    nama: d.name,
    negeri: d.location,
    jumlah_anggota: d.capacity,
  }));

  const prompt = `
DATASET SUMMARY:
- Total Balai: ${totalCount}
- State Breakdown: ${JSON.stringify(stateCounts)}
- Total Staff: ${totalMembers} (M: ${totalMale}, F: ${totalFemale})

USER QUERY:
${query}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    return response.text || "BOMBAbot sedang berfikir, sila cuba tanya lagi sekali.";
  } catch (error: any) {
    console.error("BOMBAbot Error:", error);
    
    // Menangani ralat kuota secara spesifik dalam mesej kepada pengguna
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return "Maaf, permintaan terlalu tinggi buat masa ini (Quota Exceeded). Sila tunggu 30 saat dan cuba lagi.";
    }
    
    return "Maaf, sistem BOMBAbot mengalami gangguan teknikal. Harap bersabar ya!";
  }
};
