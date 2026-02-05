
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
4. Visual Suggestion: Cadangkan jenis carta yang sesuai jika pengguna mahu melihat visual (cth: Carta Bar untuk perbandingan negeri).

PENTING:
- Gunakan "STATISTIK KESELURUHAN" sebagai punca kebenaran (source of truth).
- Jangan reka angka. Jika data tiada, nyatakan "Data tidak tersedia".
- Fokus kepada membantu pengguna memahami taburan spatial bomba di Malaysia.`;

export const analyzeDashboardData = async (data: AssetData[], query: string) => {
  // Inisialisasi di dalam fungsi untuk memastikan API_KEY ditarik dengan betul semasa runtime
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = "gemini-3-flash-preview";
  
  const stateCounts = data.reduce((acc, curr) => {
    acc[curr.location] = (acc[curr.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalMembers = data.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const totalMale = data.reduce((acc, curr) => acc + (curr.maleStaff || 0), 0);
  const totalFemale = data.reduce((acc, curr) => acc + (curr.femaleStaff || 0), 0);
  const totalCount = data.length;

  // Ambil sampel data yang lebih relevan (10 pertama)
  const dataSamples = data.slice(0, 10).map(d => ({
    nama: d.name,
    negeri: d.location,
    jumlah_anggota: d.capacity,
  }));

  const prompt = `
STATISTIK KESELURUHAN DARI DATASET:
- Jumlah Besar Balai Bomba di Malaysia: ${totalCount}
- Pecahan Bilangan Balai Mengikut Negeri: ${JSON.stringify(stateCounts)}
- Jumlah Keanggotaan Nasional: ${totalMembers} (Lelaki: ${totalMale}, Wanita: ${totalFemale})

SAMPEL DATA STRUKTUR:
${JSON.stringify(dataSamples)}

Soalan Pengguna:
${query}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      throw new Error("Tiada respon teks dari model.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    // Memberikan maklum balas lebih spesifik jika API Key bermasalah
    if (error.message?.includes("API_KEY")) {
      return "Ops! Kunci API tidak dikesan. Sila pastikan API_KEY telah ditetapkan di persekitaran Vercel.";
    }
    
    return "Maaf, BOMBAbot mengalami gangguan semasa menghubungi otak AI. Sila cuba sebentar lagi ya!";
  }
};
