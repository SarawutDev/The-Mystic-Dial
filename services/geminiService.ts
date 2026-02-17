
import { GoogleGenAI, Type } from "@google/genai";

export interface SecretChallenge {
  secret: string;
  hint: string;
}

// คลังปริศนาแบบ Static ที่รวบรวมไว้สำหรับธีม Murder Mosaic (Fallback)
const STATIC_CHALLENGES: SecretChallenge[] = [
  {
    secret: "รอยเลือดที่พบในห้องครัว ไม่ใช่เลือดของเหยื่อเพียงคนเดียว",
    hint: "จงตรวจสอบรอยกระเซ็นบนใบมีดให้ตรงกับทิศทางของแสง"
  },
  {
    secret: "นาฬิกาที่หยุดเดินในเวลาเที่ยงคืน คือหลักฐานชิ้นสุดท้ายของเขา",
    hint: "ฟันเฟืองที่แตกหักต้องถูกจัดเรียงให้กลับมาสบกันอีกครั้ง"
  },
  {
    secret: "จดหมายลาตายถูกเขียนขึ้นด้วยมือซ้าย ทั้งที่เขาถนัดขวา",
    hint: "เงาสะท้อนในกระจกจะบอกความจริงที่ซ่อนอยู่หลังข้อความ"
  },
  {
    secret: "กุญแจห้องปิดตายถูกซ่อนไว้ในแจกันที่ไม่มีใครกล้าแตะต้อง",
    hint: "เรียงเศษกระเบื้องที่แตกกระจายให้กลายเป็นรูปทรงที่สมบูรณ์"
  },
  {
    secret: "ความลับไม่ได้ตายไปพร้อมกับศพ แต่มันซ่อนอยู่ในรอยสักนั่น",
    hint: "สัญลักษณ์ที่ขาดหายไปบนผิวหนัง ต้องถูกหมุนให้ตรงตำแหน่ง"
  },
  {
    secret: "เสียงฝีเท้าในความมืดหยุดลงที่หน้าห้องหมายเลข 404",
    hint: "เงาที่ทอดผ่านบานประตูจะเผยให้เห็นตัวตนของแขกที่ไม่ได้รับเชิญ"
  },
  {
    secret: "ยาพิษไม่ได้อยู่ในไวน์ แต่อยู่ในน้ำแข็งที่ละลายหายไปแล้ว",
    hint: "คราบผลึกที่หลงเหลืออยู่ตรงก้นแก้ว ต้องถูกส่องด้วยแสงสีเลือด"
  }
];

export async function generateSecretChallenge(): Promise<SecretChallenge> {
  // Initialize Gemini AI with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Generate content using gemini-3-flash-preview for a mystery riddle
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a cryptic mystery for a noir puzzle game called 'Murder Mosaic'. The 'secret' should be a dark revelation, and the 'hint' should be a subtle clue about aligning shattered glass shards. Provide the response in Thai.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            secret: {
              type: Type.STRING,
              description: "The dark revelation revealed upon solving the puzzle.",
            },
            hint: {
              type: Type.STRING,
              description: "A cryptic hint to help the player align the rings.",
            },
          },
          required: ["secret", "hint"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
  } catch (error) {
    console.error("Gemini challenge generation failed:", error);
  }

  // Fallback to static challenges if API call fails
  const randomIndex = Math.floor(Math.random() * STATIC_CHALLENGES.length);
  return STATIC_CHALLENGES[randomIndex];
}
