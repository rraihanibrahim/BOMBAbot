
import { GoogleGenAI } from "@google/genai";
import { AssetData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const model = "gemini-3-pro-preview";
  
  const stateCounts = data.reduce((acc, curr) => {
    acc[curr.location] = (acc[curr.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalMembers = data.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const totalMale = data.reduce((acc, curr) => acc + (curr.maleStaff || 0), 0);
  const totalFemale = data.reduce((acc, curr) => acc + (curr.femaleStaff || 0), 0);
  const totalCount = data.length;

  const dataSamples = data.slice(0, 5).map(d => ({
    nama: d.name,
    negeri: d.location,
    jumlah_anggota: d.capacity,
  }));

  const prompt = `
STATISTIK KESELURUHAN:
- Jumlah Besar Balai: ${totalCount}
- Ringkasan Per Negeri: ${JSON.stringify(stateCounts)}
- Total Anggota Nasional: ${totalMembers} (L: ${totalMale}, W: ${totalFemale})

SAMPEL DATA:
${JSON.stringify(dataSamples)}

Pertanyaan Pengguna:
${query}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    return response.text || "Maaf, BOMBAbot tak dapat proses analisis tu sekarang. Cuba tanya lain kali?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, sistem BOMBAbot mengalami sedikit gangguan teknikal. Harap bersabar ya!";
  }
};
