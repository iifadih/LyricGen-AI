
import { GoogleGenAI, Type } from "@google/genai";
import { Language, SongData } from "../types";

/**
 * Ensures that the song data matches the expected SongData interface.
 * Converts lyrics objects (e.g. {verse_1: "..."}) into formatted strings.
 */
const sanitizeSongData = (data: any): SongData => {
  let lyrics = data.lyrics;
  if (typeof lyrics === 'object' && lyrics !== null) {
    lyrics = Object.entries(lyrics)
      .map(([key, value]) => `[${key.replace(/_/g, ' ').toUpperCase()}]\n${value}`)
      .join('\n\n');
  }

  let styles = data.styles;
  if (!Array.isArray(styles)) {
    if (typeof styles === 'object' && styles !== null) {
      styles = Object.values(styles);
    } else if (typeof styles === 'string') {
      styles = [styles];
    } else {
      styles = [];
    }
  }

  return {
    title: String(data.title || "Untitled Masterpiece"),
    lyrics: String(lyrics || ""),
    styles: styles.slice(0, 3).map((s: any) => String(s)),
    imagePrompt: String(data.imagePrompt || ""),
    moodDescription: String(data.moodDescription || data.description || ""),
  };
};

export const generateSong = async (
  topic: string,
  language: Language,
  useSearch: boolean
): Promise<SongData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are a world-class professional songwriter and artistic director. 
  Your goal is to write high-quality, professional, rhyming, and rhythmic song lyrics in ${language} based on the user's topic.
  
  STRUCTURE REQUIREMENTS:
  The song MUST follow this exact structure with clear empty lines between sections:
  1. [VERSE 1]
  2. [CHORUS]
  3. [VERSE 2]
  4. [CHORUS]
  5. [BRIDGE]
  6. [CHORUS]
  7. [OUTRO]
  
  OUTPUT FORMAT:
  Always output the result in a valid JSON format.
  CRITICAL: The "lyrics" property MUST be a single plain-text string where each section starts with a header in square brackets like [VERSE 1], followed by the lines of that section, then two newlines before the next section.`;

  const config: any = {
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative and catchy song title" },
        lyrics: { type: Type.STRING, description: "Full lyrics formatted with [SECTION] headers and clear spacing" },
        styles: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Exactly 3 suggested musical genres/styles"
        },
        imagePrompt: { type: Type.STRING, description: "A highly detailed English prompt for cover art generation reflecting the vibe" },
        moodDescription: { type: Type.STRING, description: "A narrative explaining the emotional depth and story of the song" },
      },
      required: ["title", "lyrics", "styles", "imagePrompt", "moodDescription"],
    },
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
    delete config.responseMimeType;
    delete config.responseSchema;
  }

  const prompt = `Write a professional song about: "${topic}".
  Language: ${language}.
  Ensure lyrics are highly structured, balanced, and rhythmic. 
  Use the mandatory [SECTION NAME] format for each part of the song.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const rawData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    const sanitized = sanitizeSongData(rawData);
    
    if (useSearch) {
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        sanitized.groundingSources = chunks
          .filter(chunk => !!chunk.web)
          .map(chunk => ({
            web: {
              uri: chunk.web?.uri,
              title: chunk.web?.title
            }
          }));
      }
    }
    
    return sanitized;
  } catch (e) {
    console.error("Failed to parse song output", e);
    throw new Error("Failed to generate song. Please try a different topic.");
  }
};

export const generateCoverImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Professional high-end cinematic song cover art in wide 16:9 format for YouTube. Style: Artistic Photography/Cinematic Digital Art. Subject: ${prompt}. 4k resolution, aesthetically pleasing, epic composition.` }],
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (e) {
    console.error("Image generation failed", e);
    throw new Error("Image generation failed");
  }
};

export const editImage = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
          { text: editPrompt }
        ],
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image edit failed");
  } catch (e) {
    console.error("Image edit failed", e);
    throw new Error("Image edit failed");
  }
};
