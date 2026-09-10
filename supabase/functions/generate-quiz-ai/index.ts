// Supabase Edge Function: generate-quiz-ai
// Endpoint AI server-side yang aman untuk Google Gemini & Groq API (Rule 9 & Rule 10)
// Setup secrets:
// - supabase secrets set GEMINI_API_KEY="AIzaSy..."
// - supabase secrets set GROQ_API_KEY="gsk_..."

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!geminiApiKey && !groqApiKey) {
      return new Response(
        JSON.stringify({
          error: "Kunci API (GEMINI_API_KEY atau GROQ_API_KEY) belum disetel di Supabase Secrets.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const { 
      subject = "IPA", 
      grade = 4, 
      topic, 
      count = 5, 
      questionType = "campuran", 
      provider = groqApiKey ? "groq" : "gemini",
      model 
    } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topik atau materi soal wajib diisi." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let formatInstruction = "";
    if (questionType === "campuran") {
      formatInstruction = `Variasikan tipe soal secara seimbang antara 'multiple_choice', 'true_false', 'short_answer', 'matching_pairs', dan 'image_guess'.`;
    } else if (questionType === "matching_pairs") {
      formatInstruction = `Gunakan tipe 'matching_pairs' dengan matchingPairs: [{ "left": "...", "right": "..." }].`;
    } else if (questionType === "short_answer") {
      formatInstruction = `Gunakan tipe 'short_answer' dengan acceptableAnswers: ["sinonim 1", "sinonim 2"].`;
    } else if (questionType === "true_false") {
      formatInstruction = `Gunakan tipe 'true_false' dengan options: ["Benar", "Salah"].`;
    } else {
      formatInstruction = `Gunakan tipe 'multiple_choice' dengan 4 pilihan opsi A, B, C, D.`;
    }

    const systemPrompt = `Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Dasar (SD) Indonesia.
Rancanglah ${count} butir soal kuis interaktif yang mendidik dan ramah anak.
Mata Pelajaran: ${subject}
Tingkat: Kelas ${grade} SD
Topik: ${topic}
Format: ${formatInstruction}

KEMBALIKAN HANYA ARRAY JSON MURNI TANPA PEMBUKA/PENUTUP:
[
  {
    "text": "Pertanyaan...",
    "type": "multiple_choice",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Penjelasan singkat...",
    "points": 10,
    "customDurationSec": 30,
    "acceptableAnswers": ["Kunci"],
    "matchingPairs": [{"left": "Konsep", "right": "Arti"}],
    "imageCaption": "Kata kunci"
  }
]`;

    let cleanedJson = "";

    // Pilihan 1: Groq Cloud (Super Cepat)
    if (provider === "groq" && groqApiKey) {
      const groqModel = model || "llama-3.3-70b-versatile";
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Buatkan ${count} butir soal tentang "${topic}".` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
          max_tokens: 3000,
        }),
      });

      if (!groqRes.ok) {
        throw new Error(`Groq API error: ${await groqRes.text()}`);
      }

      const groqData = await groqRes.json();
      const content = groqData?.choices?.[0]?.message?.content || "";
      cleanedJson = content.trim();
    } 
    // Pilihan 2: Google Gemini API
    else if (geminiApiKey) {
      const geminiModel = model || "gemini-1.5-flash";
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

      const geminiRes = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        throw new Error(`Gemini API error: ${await geminiRes.text()}`);
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      cleanedJson = rawText.trim();
    }

    if (cleanedJson.startsWith("```json")) cleanedJson = cleanedJson.replace(/^```json\s*/i, "");
    if (cleanedJson.startsWith("```")) cleanedJson = cleanedJson.replace(/^```\s*/i, "");
    if (cleanedJson.endsWith("```")) cleanedJson = cleanedJson.replace(/\s*```$/i, "");

    const parsed = JSON.parse(cleanedJson);
    const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);

    return new Response(JSON.stringify({ questions, provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Terjadi kesalahan pemrosesan AI." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
