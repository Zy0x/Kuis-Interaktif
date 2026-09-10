// Supabase Edge Function: generate-quiz-ai
// Menyediakan endpoint AI aman tanpa mengekspos API Key ke sisi client (Rule 9 & Rule 10)
// Setup secrets: supabase secrets set GEMINI_API_KEY="AIzaSy..."

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY belum disetel di Supabase Secrets.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const { subject, grade, topic, count = 5, questionType = "campuran", model = "gemini-1.5-flash" } = await req.json();

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
Mata Pelajaran: ${subject || 'IPA'}
Tingkat: Kelas ${grade || 4} SD
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(endpoint, {
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
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gagal dari Gemini API: ${errText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: geminiRes.status }
      );
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    let cleaned = (rawText || "").trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/i, "");
    if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\s*/i, "");
    if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\s*```$/i, "");

    const questions = JSON.parse(cleaned);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Terjadi kesalahan internal." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
