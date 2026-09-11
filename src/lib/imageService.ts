export interface EducationalImageResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: 'wikipedia_id' | 'wikipedia_en' | 'wikimedia' | 'ai';
  description?: string;
}

/**
 * Cari gambar edukasi dari Wikipedia Bahasa Indonesia
 */
export async function searchWikipediaIdImages(keyword: string, limit = 6): Promise<EducationalImageResult[]> {
  const clean = keyword.replace(/[^\w\s\u00C0-\u024F]/gi, ' ').trim();
  if (clean.length < 2) return [];

  try {
    const url = `https://id.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=${limit}&prop=pageimages|description&pithumbsize=600&format=json&origin=*`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KuisInteraktif/2.2 (educational quiz app; contact@kuis-seru.app)' },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .map((p: any) => {
        const thumb = p.thumbnail?.source;
        if (!thumb) return null;
        return {
          id: `wiki_id_${p.pageid}`,
          title: p.title,
          url: thumb,
          thumbnailUrl: thumb,
          source: 'wikipedia_id' as const,
          description: p.description || 'Ensiklopedia Wikipedia Indonesia',
        };
      })
      .filter(Boolean) as EducationalImageResult[];
  } catch {
    return [];
  }
}

/**
 * Cari gambar edukasi dari Wikipedia Bahasa Inggris
 */
export async function searchWikipediaEnImages(keyword: string, limit = 6): Promise<EducationalImageResult[]> {
  const clean = keyword.replace(/[^\w\s\u00C0-\u024F]/gi, ' ').trim();
  if (clean.length < 2) return [];

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=${limit}&prop=pageimages|description&pithumbsize=600&format=json&origin=*`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KuisInteraktif/2.2 (educational quiz app; contact@kuis-seru.app)' },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .map((p: any) => {
        const thumb = p.thumbnail?.source;
        if (!thumb) return null;
        return {
          id: `wiki_en_${p.pageid}`,
          title: p.title,
          url: thumb,
          thumbnailUrl: thumb,
          source: 'wikipedia_en' as const,
          description: p.description || 'English Wikipedia',
        };
      })
      .filter(Boolean) as EducationalImageResult[];
  } catch {
    return [];
  }
}

/**
 * Cari gambar/diagram dari Wikimedia Commons (gudang media pendidikan terbuka dunia)
 */
export async function searchWikimediaCommons(keyword: string, limit = 8): Promise<EducationalImageResult[]> {
  const clean = keyword.replace(/[^\w\s\u00C0-\u024F]/gi, ' ').trim();
  if (clean.length < 2) return [];

  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=600&format=json&origin=*`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KuisInteraktif/2.2 (educational quiz app; contact@kuis-seru.app)' },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .map((p: any) => {
        const info = p.imageinfo?.[0];
        const thumb = info?.thumburl || info?.url;
        const mime = info?.mime || '';
        // Hanya izinkan gambar
        if (!thumb || (!mime.startsWith('image/') && !thumb.match(/\.(jpg|jpeg|png|svg|webp)/i))) return null;
        const cleanTitle = p.title.replace(/^File:/i, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        return {
          id: `commons_${p.pageid}`,
          title: cleanTitle,
          url: thumb,
          thumbnailUrl: thumb,
          source: 'wikimedia' as const,
          description: 'Wikimedia Commons Media Bebas',
        };
      })
      .filter(Boolean) as EducationalImageResult[];
  } catch {
    return [];
  }
}

/**
 * Formula prompt cerdas untuk Pollinations AI Flux model
 */
export function buildRefinedImagePrompt(
  prompt: string,
  style: 'diagram' | 'cartoon' | 'realistic' = 'diagram'
): string {
  const cleanPrompt = prompt
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF,.()\-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

  if (style === 'cartoon') {
    return [
      `colorful cute educational children book illustration of ${cleanPrompt || 'learning concept'}`,
      'elementary school textbook style, cheerful and friendly',
      'clean solid white background, vector flat art, clear outlines',
      'no abstract art, no distortion, high resolution',
    ].join(', ');
  }

  if (style === 'realistic') {
    return [
      `clear high resolution realistic photograph of ${cleanPrompt || 'science concept'}`,
      'educational nature and science photography, sharp focus',
      'clean bright natural lighting, informative textbook quality',
      'no fantasy elements, no blur, high detail',
    ].join(', ');
  }

  // Default: 'diagram' (diagram 2D buku pelajaran sekolah)
  return [
    `clear 2D educational textbook scientific diagram of ${cleanPrompt || 'science concept'}`,
    'labeled informative schematic illustration, clean plain white background',
    'standard school curriculum textbook style, clear colorful vector graphic',
    'no 3D isometric cube, no futuristic circuit board, no dark background, no abstract art',
    'high resolution educational graphic',
  ].join(', ');
}

/**
 * Generate AI image URL menggunakan Pollinations AI Flux model
 */
export function generateRefinedAiImageUrl(
  prompt: string,
  options?: {
    style?: 'diagram' | 'cartoon' | 'realistic';
    seed?: number;
    width?: number;
    height?: number;
  }
): string {
  const width = options?.width || 600;
  const height = options?.height || 400;
  const seed = options?.seed ?? Math.floor(Math.random() * 999999);
  const educationalPrompt = buildRefinedImagePrompt(prompt, options?.style || 'diagram');

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(educationalPrompt)}?model=flux&width=${width}&height=${height}&nologo=true&private=true&seed=${seed}`;
}

/**
 * Pencarian multi-sumber gabungan:
 * Menjalankan pencarian serentak ke Wikipedia ID, Wikipedia EN, dan Wikimedia Commons.
 */
export async function searchAllEducationalImages(
  query: string,
  englishQuery?: string
): Promise<EducationalImageResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const promises: Promise<EducationalImageResult[]>[] = [
    searchWikipediaIdImages(cleanQ, 6),
    searchWikimediaCommons(cleanQ, 6),
  ];

  if (englishQuery && englishQuery.trim()) {
    promises.push(searchWikipediaEnImages(englishQuery.trim(), 6));
    promises.push(searchWikimediaCommons(englishQuery.trim(), 6));
  } else {
    promises.push(searchWikipediaEnImages(cleanQ, 4));
  }

  const results = await Promise.allSettled(promises);
  const combined: EducationalImageResult[] = [];
  const seenUrls = new Set<string>();

  for (const res of results) {
    if (res.status === 'fulfilled') {
      for (const item of res.value) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          combined.push(item);
        }
      }
    }
  }

  return combined;
}
