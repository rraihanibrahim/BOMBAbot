import { GoogleGenAI } from "@google/genai";
import { AssetData } from "../types";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY,
});

const SYSTEM_INSTRUCTION = `Anda adalah "BOMBAbot", seorang pakar analisis data spatial yang profesional dan efisien...`;

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
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    return response.text || "Maaf, BOMBAbot tak dapat proses analisis tu sekarang.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, sistem BOMBAbot mengalami gangguan teknikal.";
  }
};
