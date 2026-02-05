import { GoogleGenAI } from "@google/genai";
import { AssetData } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah "BOMBAbot", pakar analisis data Balai Bomba Malaysia. 

PRINSIP UTAMA:
1. RINGKAS & PADAT: Jangan beri jawapan panjang lebar. Terus kepada sasaran soalan.
2. IKUT SKOP: Jawab berdasarkan data yang diberikan sahaja. Jangan beri maklumat tambahan yang tidak diminta.
3. PROFESIONAL: Gunakan gaya bahasa korporat yang efisien.
4. SUMBER KEBENARAN: Rujuk "STATISTIK KESELURUHAN" yang dibekalkan.

Format Jawapan:
- Jika soalan tentang angka, beri angka tersebut dengan sedikit konteks.
- Gunakan point form jika melibatkan senarai.
- Elakkan mukadimah atau penutup yang meleret.`;

export const analyzeDashboardData = async (data: AssetData[], query: string) => {
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_API_KEY,
  });

  const modelName = "gemini-3-flash-preview";

  const stateCounts = data.reduce((acc, curr) => {
    acc[curr.location] = (acc[curr.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalMembers = data.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const totalMale = data.reduce((acc, curr) => acc + (curr.maleStaff || 0), 0);
  const totalFemale = data.reduce((acc, curr) => acc + (curr.femaleStaff || 0), 0);
  const totalCount = data.length;

  const prompt = `
STATISTIK KESELURUHAN (Source of Truth):
- Jumlah Besar Balai: ${totalCount}
- Ringkasan Per Negeri: ${JSON.stringify(stateCounts)}
- Total Anggota Nasional: ${totalMembers} (Lelaki: ${totalMale}, Wanita: ${totalFemale})

SOALAN PENGGUNA:
${query}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    return response.text || "Tiada data ditemui.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (error?.message?.includes("429")) {
      return "Kuota penuh. Sila tunggu sebentar.";
    }

    return "Maaf, ralat teknikal berlaku.";
  }
};
