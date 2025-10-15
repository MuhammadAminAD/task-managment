import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import { Request, Response } from "express";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function Ai(req: Request, res: Response) {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).send({ ok: false, error: "Content is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: content }
      ]
    });

    // Extract only the generated text from the response
    const generatedText = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.send({ ok: true, data: generatedText });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ ok: false, error: "Server error", details: err });
  }
}
