
import { GoogleGenAI, Type } from "@google/genai";

const STATIC_CHALLENGES = [
  {
    secret: "The backup core is active. Access key: 9-2-4-1.",
    hint: "Align the security protocols to match the internal power levels."
  },
  {
    secret: "Confidential Data: Project X is hidden in the false floor.",
    hint: "Synchronize the suppression level with the main vault gauge."
  },
  {
    secret: "Unauthorized access detected. Clearance level: GAMMA.",
    hint: "Reset the CCTV monitoring before the lockdown is complete."
  }
];

export async function generateSecretChallenge(customTheme = "") {
  if (!process.env.API_KEY) return STATIC_CHALLENGES[Math.floor(Math.random() * STATIC_CHALLENGES.length)];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const themePrompt = customTheme 
    ? `The theme for this discovery is: "${customTheme}". Make it very exciting and related to this theme.`
    : "Generate a cryptic discovery found inside a high-tech corporate vault.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a cryptic discovery (max 15 words) and a hint. ${themePrompt} Return in JSON. Language: Thai or English (as appropriate to theme).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            secret: { type: Type.STRING },
            hint: { type: Type.STRING },
          },
          required: ["secret", "hint"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
  } catch (error) {
    console.warn("Gemini API Error, using fallback.");
  }

  return STATIC_CHALLENGES[Math.floor(Math.random() * STATIC_CHALLENGES.length)];
}
