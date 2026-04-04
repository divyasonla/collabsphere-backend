import axios from "axios";
import dotenv from 'dotenv';
import { Model } from "mongoose";
// load environment variables as early as possible so other modules can read them
dotenv.config();
// Environment variables
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

if (!API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not set. API calls will fail.");
}

export const generate = async ({ prompt }) => {
  try {
    // ✅ Validate input
    if (!prompt) {
      return {
        success: false,
        error: "Prompt is required"
      };
    }

    // ✅ API URL
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;;

    // ✅ Request body (correct Gemini format)
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        // lower temperature for more focused, repeatable README content
        temperature: 0.2,
        // request a larger output size so long READMEs are produced
        maxOutputTokens: 3000
      }
    };

    // ✅ API call
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 20000
    });

    // ✅ Safe response parsing
    const output =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || response?.data?.output?.[0]?.content?.[0]?.text || "";

    if (!output) {
      return {
        success: false,
        error: "Empty response from model",
        raw: response.data
      };
    }

    // ✅ Success response
    return {
      success: true,
      data: output,
      raw: response.data,
      model: MODEL
    };

  } catch (err) {
    // ✅ Detailed error logging
    const errorDetails = err.response?.data || err.message;

    console.error("❌ Gemini API Error:", errorDetails);

    return {
      success: false,
      error: "Failed to generate response",
      details: errorDetails,
      status: err.response?.status || 500
    };
  }
};