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
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");

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
      let deepseekModels: string[] = [];
      let groqError: string | null = null;
      let geminiError: string | null = null;
      let deepseekError: string | null = null;

      if (deepseekApiKey) {
        try {
          const res = await fetch("https://api.deepseek.com/models", {
            headers: { Authorization: `Bearer ${deepseekApiKey}` },
          });
          if (res.ok) {
            const data = await res.json();
            deepseekModels = (data.data || []).map((m: any) => m.id);
          } else {
            deepseekError = await res.text();
          }
        } catch (e: any) {
          deepseekError = e?.message || String(e);
        }
      }

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
          hasDeepSeek: Boolean(deepseekApiKey),
          groqModels,
          geminiModels,
          deepseekModels,
          groqError,
          geminiError,
          deepseekError,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (!geminiApiKey && !groqApiKey && !deepseekApiKey) {
      return new Response(
        JSON.stringify({
          error: "Kunci API (GEMINI_API_KEY, GROQ_API_KEY, atau DEEPSEEK_API_KEY) belum disetel di Supabase Secrets.",
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
        educationLevel,
        provider = deepseekApiKey ? "deepseek" : (groqApiKey ? "groq" : "gemini") 
      } = body;
      const level = educationLevel || (grade >= 10 ? "SMA" : grade >= 7 ? "SMP" : "SD");
      const levelText = level === "SMA" ? `Kelas ${grade} SMA / SMK` : level === "SMP" ? `Kelas ${grade} SMP` : `Kelas ${grade} SD`;

      const topicsPrompt = `Anda adalah Pakar Kurikulum Merdeka Kemendikbudristek RI untuk ${levelText}.
Rekomendasikan 4 ide topik materi kuis yang kreatif, relevan, menarik, dan berbobot edukatif untuk:
- Mata Pelajaran: ${subject}
- Tingkat: ${levelText}

KEMBALIKAN HANYA ARRAY JSON MURNI DENGAN FORMAT:
[
  {
    "topic": "Judul Topik yang Menarik dan Spesifik",
    "context": "Fokus materi dan arahan instruksional (1-2 kalimat)..."
  }
]`;

      let topicJson = "";
      let topicProvider = provider;
      let topicModel = "";

      if (provider === "deepseek" && deepseekApiKey) {
        try {
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${deepseekApiKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: topicsPrompt },
                { role: "user", content: `Berikan 4 ide topik materi untuk ${subject} Kelas ${grade} SD.` },
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            topicJson = data?.choices?.[0]?.message?.content || "";
            topicModel = "deepseek-chat";
            topicProvider = "deepseek";
          }
        } catch (_) {}
      }

      if (!topicJson && (provider === "groq" || !deepseekApiKey) && groqApiKey) {
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

    // 3. Action: Generate Capaian Pembelajaran (CP) Spesifik Per Tingkat Kelas
    if (action === "generate_cp") {
      const { 
        subject = "IPA", 
        grade = 4, 
        educationLevel,
        provider = deepseekApiKey ? "deepseek" : (groqApiKey ? "groq" : "gemini") 
      } = body;
      const level = educationLevel || (grade >= 10 ? "SMA" : grade >= 7 ? "SMP" : "SD");
      const levelText = level === "SMA" ? `Kelas ${grade} SMA / SMK` : level === "SMP" ? `Kelas ${grade} SMP` : `Kelas ${grade} SD`;

      const cpPrompt = `Anda adalah Pakar Kurikulum Merdeka Kemendikbudristek RI untuk ${levelText}.
Tuliskan rumusan Capaian Pembelajaran (CP) yang SPESIFIK untuk ${levelText} (bukan fase umum, melainkan capaian kompetensi khusus untuk jenjang ${levelText}) pada mata pelajaran: ${subject}.
Gunakan bahasa resmi edukatif, kontekstual, terukur, dan mengacu pada standar Alur Tujuan Pembelajaran (ATP) Kurikulum Merdeka.

KEMBALIKAN HANYA OBJEK JSON MURNI DENGAN FORMAT:
{
  "cp": "Rumusan Capaian Pembelajaran 2-3 kalimat padat, jelas, dan terukur khusus untuk peserta didik ${levelText}...",
  "goals": [
    "Tujuan Pembelajaran 1...",
    "Tujuan Pembelajaran 2...",
    "Tujuan Pembelajaran 3..."
  ]
}`;

      let cpJson = "";
      let cpProvider = provider;
      let cpModel = "";

      if (provider === "deepseek" && deepseekApiKey) {
        try {
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${deepseekApiKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: cpPrompt },
                { role: "user", content: `Rumuskan Capaian Pembelajaran spesifik untuk ${subject} Kelas ${grade} SD.` },
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
              max_tokens: 800,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            cpJson = data?.choices?.[0]?.message?.content || "";
            cpModel = "deepseek-chat";
            cpProvider = "deepseek";
          }
        } catch (_) {}
      }

      if (!cpJson && (provider === "groq" || !deepseekApiKey) && groqApiKey) {
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
                { role: "system", content: cpPrompt },
                { role: "user", content: `Rumuskan Capaian Pembelajaran spesifik untuk ${subject} Kelas ${grade} SD.` },
              ],
              temperature: 0.7,
              max_tokens: 800,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            cpJson = data?.choices?.[0]?.message?.content || "";
            cpModel = "llama-3.1-8b-instant";
            cpProvider = "groq";
          }
        } catch (_) {}
      }

      if (!cpJson && geminiApiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${cpPrompt}\n\nRumuskan Capaian Pembelajaran spesifik untuk ${subject} Kelas ${grade} SD.` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            cpJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            cpProvider = "gemini";
            cpModel = "gemini-2.0-flash";
          }
        } catch (_) {}
      }

      let parsedResult: { cp: string; goals?: string[] } = { cp: "" };
      if (cpJson) {
        try {
          let cleaned = cpJson.trim();
          if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
          } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/, "");
          }
          const parsed = JSON.parse(cleaned);
          if (parsed && typeof parsed.cp === "string" && parsed.cp.trim()) {
            parsedResult = parsed;
          }
        } catch (_) {}
      }

      return new Response(
        JSON.stringify({
          cp: parsedResult.cp,
          goals: parsedResult.goals || [],
          provider: cpProvider,
          model: cpModel,
          success: Boolean(parsedResult.cp),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { 
      subject = "IPA", 
      grade = 4, 
      educationLevel,
      topic, 
      count = 5, 
      questionType = "campuran", 
      provider = deepseekApiKey ? "deepseek" : (groqApiKey ? "groq" : "gemini"),
      model 
    } = body;

    const level = educationLevel || (grade >= 10 ? "SMA" : grade >= 7 ? "SMP" : "SD");
    const levelText = level === "SMA" ? `Kelas ${grade} SMA / SMK` : level === "SMP" ? `Kelas ${grade} SMP` : `Kelas ${grade} SD`;

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

    const roleText = level === "SMA"
      ? "Anda adalah Asisten Pakar Kurikulum Merdeka SMA / SMK Indonesia. Tugas Anda adalah merancang soal kuis interaktif dengan penalaran analitis kritis tingkat tinggi (HOTS), pengujian konsep mendalam, studi kasus kontekstual, dan bahasa Indonesia akademis yang lugas."
      : level === "SMP"
        ? "Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Menengah Pertama (SMP) Indonesia. Tugas Anda adalah merancang soal kuis interaktif yang komunikatif ramah remaja, merangsang daya nalar terapan, studi kasus kontekstual, dan literasi-numerasi terpadu."
        : "Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Dasar (SD) Indonesia. Rancanglah soal kuis interaktif yang mendidik, komunikatif, menyenangkan, dan ramah anak.";

    const systemPrompt = `${roleText}
Mata Pelajaran: ${subject}
Tingkat: ${levelText}
Topik: ${topic}
Format: ${formatInstruction}
Jumlah Soal: ${count} butir soal

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

    // Helper panggil DeepSeek dengan model tertentu
    async function tryDeepSeek(modelName: string): Promise<string> {
      const isReasoner = modelName === "deepseek-reasoner";
      const dsPayload: Record<string, any> = {
        model: modelName,
        messages: [
          { role: isReasoner ? "user" : "system", content: systemPrompt },
          { role: "user", content: `Buatkan ${count} butir soal tentang materi "${topic}". Kembalikan array JSON valid.` },
        ],
        max_tokens: 3500,
      };

      if (!isReasoner) {
        dsPayload.response_format = { type: "json_object" };
        dsPayload.temperature = 0.6;
      }

      const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekApiKey}`,
        },
        body: JSON.stringify(dsPayload),
      });

      if (!dsRes.ok) {
        throw new Error(`DeepSeek (${modelName}) error: ${await dsRes.text()}`);
      }

      const dsData = await dsRes.json();
      return (dsData?.choices?.[0]?.message?.content || "").trim();
    }

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
    if (provider === "deepseek" && deepseekApiKey) {
      const dsCandidates = model ? [model, "deepseek-chat", "deepseek-reasoner"] : ["deepseek-chat", "deepseek-reasoner"];
      let lastErr: any = null;
      for (const m of dsCandidates) {
        try {
          cleanedJson = await tryDeepSeek(m);
          usedModel = m;
          effectiveProvider = "deepseek";
          break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      // Jika DeepSeek gagal, cadangkan ke Groq lalu Gemini
      if (!cleanedJson && groqApiKey) {
        try {
          cleanedJson = await tryGroq("llama-3.3-70b-versatile");
          usedModel = "llama-3.3-70b-versatile";
          effectiveProvider = "groq";
        } catch (_) {}
      }

      if (!cleanedJson && geminiApiKey) {
        try {
          cleanedJson = await tryGemini("gemini-2.0-flash");
          usedModel = "gemini-2.0-flash";
          effectiveProvider = "gemini";
        } catch (_) {}
      }

      if (!cleanedJson && lastErr) throw lastErr;
    } else if (provider === "groq" && groqApiKey) {
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

      // Jika Groq gagal, coba cadangkan ke DeepSeek lalu Gemini
      if (!cleanedJson && deepseekApiKey) {
        try {
          cleanedJson = await tryDeepSeek("deepseek-chat");
          usedModel = "deepseek-chat";
          effectiveProvider = "deepseek";
        } catch (_) {}
      }

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

      // Jika Gemini gagal, coba cadangkan ke DeepSeek lalu Groq
      if (!cleanedJson && deepseekApiKey) {
        try {
          cleanedJson = await tryDeepSeek("deepseek-chat");
          usedModel = "deepseek-chat";
          effectiveProvider = "deepseek";
        } catch (_) {}
      }

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
