// Supabase Edge Function: generate-quiz-ai
// Endpoint AI server-side yang aman untuk Google Gemini & Groq API (Rule 9 & Rule 10)
// Setup secrets:
// - supabase secrets set GEMINI_API_KEY="..."
// - supabase secrets set GROQ_API_KEY="..."

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

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { action } = body;

    // 1. Status Check & Model Discovery Action
    if (action === "check_status") {
      let groqModels: string[] = [];
      let geminiModels: string[] = [];
      let groqError: string | null = null;
      let geminiError: string | null = null;

      if (groqApiKey) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${groqApiKey}` },
          });
          if (res.ok) {
            const data = await res.json();
            groqModels = (data.data || []).map((m: any) => m.id);
          } else {
            groqError = await res.text();
          }
        } catch (e: any) {
          groqError = e?.message || String(e);
        }
      }

      if (geminiApiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`
          );
          if (res.ok) {
            const data = await res.json();
            geminiModels = (data.models || [])
              .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
              .map((m: any) => m.name.replace("models/", ""));
          } else {
            geminiError = await res.text();
          }
        } catch (e: any) {
          geminiError = e?.message || String(e);
        }
      }

      return new Response(
        JSON.stringify({
          status: "ready",
          hasGemini: Boolean(geminiApiKey),
          hasGroq: Boolean(groqApiKey),
          groqModels,
          geminiModels,
          groqError,
          geminiError,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

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

    // 2. Action: Brainstorming Ide Topik Kurikulum Merdeka
    if (action === "generate_topics") {
      const { 
        subject = "IPA", 
        grade = 4, 
        provider = groqApiKey ? "groq" : "gemini" 
      } = body;

      const topicsPrompt = `Anda adalah Pakar Kurikulum Merdeka Sekolah Dasar (SD) Indonesia.
Rekomendasikan 4 ide topik materi kuis yang kreatif, relevan, menarik, dan ramah anak untuk:
- Mata Pelajaran: ${subject}
- Tingkat: Kelas ${grade} SD

KEMBALIKAN HANYA ARRAY JSON MURNI DENGAN FORMAT:
[
  {
    "topic": "Judul Topik yang Menarik dan Spesifik",
    "context": "Fokus materi dan arahan ramah anak SD (1-2 kalimat)..."
  }
]`;

      let topicJson = "";
      let topicProvider = provider;
      let topicModel = "";

      if (provider === "groq" && groqApiKey) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                { role: "system", content: topicsPrompt },
                { role: "user", content: `Berikan 4 ide topik materi untuk ${subject} Kelas ${grade} SD.` },
              ],
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            topicJson = data?.choices?.[0]?.message?.content || "";
            topicModel = "llama-3.1-8b-instant";
            topicProvider = "groq";
          }
        } catch (_) {}
      }

      if (!topicJson && geminiApiKey) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
          const res = await fetch(geminiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: topicsPrompt }] }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1000,
                responseMimeType: "application/json",
              },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            topicJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            topicModel = "gemini-2.0-flash";
            topicProvider = "gemini";
          }
        } catch (_) {}
      }

      if (topicJson.startsWith("```json")) topicJson = topicJson.replace(/^```json\s*/i, "");
      if (topicJson.startsWith("```")) topicJson = topicJson.replace(/^```\s*/i, "");
      if (topicJson.endsWith("```")) topicJson = topicJson.replace(/\s*```$/i, "");
      topicJson = topicJson.trim();

      let recommendations: any[] = [];
      try {
        const parsed = JSON.parse(topicJson);
        recommendations = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.topics || []);
      } catch (_) {
        const firstBracket = topicJson.indexOf("[");
        const lastBracket = topicJson.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket > firstBracket) {
          try {
            recommendations = JSON.parse(topicJson.substring(firstBracket, lastBracket + 1));
          } catch (_) {}
        }
      }

      return new Response(
        JSON.stringify({
          recommendations,
          provider: topicProvider,
          model: topicModel,
          success: Array.isArray(recommendations) && recommendations.length > 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
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
    } = body;

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

KEMBALIKAN HANYA ARRAY JSON MURNI TANPA PEMBUKA/PENUTUP MARKDOWN ATAU PENJELASAN LAIN:
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
    let effectiveProvider = provider;
    let usedModel = "";

    // Helper panggil Groq dengan model tertentu
    async function tryGroq(modelName: string): Promise<string> {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Buatkan ${count} butir soal tentang materi "${topic}". Kembalikan array JSON valid.` },
          ],
          temperature: 0.6,
          max_tokens: 3500,
        }),
      });

      if (!groqRes.ok) {
        throw new Error(`Groq (${modelName}) error: ${await groqRes.text()}`);
      }

      const groqData = await groqRes.json();
      return (groqData?.choices?.[0]?.message?.content || "").trim();
    }

    // Helper panggil Gemini dengan model tertentu
    async function tryGemini(modelName: string): Promise<string> {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      const geminiRes = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3500,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        throw new Error(`Gemini (${modelName}) error: ${await geminiRes.text()}`);
      }

      const geminiData = await geminiRes.json();
      return (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    }

    // Eksekusi Pilihan Provider dengan Fallback Cascade
    if (provider === "groq" && groqApiKey) {
      const groqCandidates = model 
        ? [model, "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]
        : ["qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"];
      
      let lastErr: any = null;
      for (const m of groqCandidates) {
        try {
          cleanedJson = await tryGroq(m);
          usedModel = m;
          effectiveProvider = "groq";
          break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      // Jika Groq gagal tapi ada Gemini API Key, gunakan Gemini sebagai backup otomatis
      if (!cleanedJson && geminiApiKey) {
        const geminiCandidates = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash-lite"];
        for (const m of geminiCandidates) {
          try {
            cleanedJson = await tryGemini(m);
            usedModel = m;
            effectiveProvider = "gemini";
            break;
          } catch {
            // lanjut cascade
          }
        }
      }

      if (!cleanedJson && lastErr) throw lastErr;
    } else if (geminiApiKey) {
      const geminiCandidates = model
        ? [model, "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash-lite"]
        : ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash-lite"];

      let lastErr: any = null;
      for (const m of geminiCandidates) {
        try {
          cleanedJson = await tryGemini(m);
          usedModel = m;
          effectiveProvider = "gemini";
          break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      // Jika Gemini gagal tapi ada Groq API Key, gunakan Groq sebagai backup otomatis
      if (!cleanedJson && groqApiKey) {
        const groqCandidates = ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
        for (const m of groqCandidates) {
          try {
            cleanedJson = await tryGroq(m);
            usedModel = m;
            effectiveProvider = "groq";
            break;
          } catch {
            // lanjut cascade
          }
        }
      }

      if (!cleanedJson && lastErr) throw lastErr;
    }

    // Bersihkan format respons JSON
    if (cleanedJson.startsWith("```json")) cleanedJson = cleanedJson.replace(/^```json\s*/i, "");
    if (cleanedJson.startsWith("```")) cleanedJson = cleanedJson.replace(/^```\s*/i, "");
    if (cleanedJson.endsWith("```")) cleanedJson = cleanedJson.replace(/\s*```$/i, "");
    cleanedJson = cleanedJson.trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      // Robust regex extraction jika model menyertakan teks sebelum atau sesudah array JSON
      const firstBracket = cleanedJson.indexOf("[");
      const lastBracket = cleanedJson.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        const sliced = cleanedJson.substring(firstBracket, lastBracket + 1);
        parsed = JSON.parse(sliced);
      } else {
        const firstBrace = cleanedJson.indexOf("{");
        const lastBrace = cleanedJson.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const sliced = cleanedJson.substring(firstBrace, lastBrace + 1);
          parsed = JSON.parse(sliced);
        }
      }
    }

    const questions = Array.isArray(parsed) ? parsed : (parsed?.questions || parsed?.data || []);

    return new Response(JSON.stringify({ 
      questions, 
      provider: effectiveProvider, 
      model: usedModel, 
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Terjadi kesalahan pemrosesan AI.", success: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
