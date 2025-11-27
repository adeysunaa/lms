import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_V1_API_BASE = 'https://generativelanguage.googleapis.com/v1';
const modelFromEnv = process.env.GEMINI_MODEL?.split(",").map((m) => m.trim()).filter(Boolean);

if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not set in environment variables. Please add it to your .env file.');
}

let cachedModel = null;

// Helper function to call Gemini v1 API directly (bypasses SDK's v1beta limitation)
const callGeminiV1API = async (modelName, prompt) => {
  const url = `${GEMINI_V1_API_BASE}/${modelName}:generateContent?key=${apiKey}`;
  
  const response = await axios.post(url, {
    contents: [{
      parts: [{ text: prompt }]
    }]
  }, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
};

// Function to get available model
const getAvailableModel = async () => {
  if (cachedModel) {
    console.log(`Using cached model: ${cachedModel}`);
    return cachedModel;
  }

  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required. Please set it in your .env file.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // First, try to list available models from the API
    try {
      console.log("Fetching available models from API...");
      const { models } = await genAI.listModels();
      if (models && models.length > 0) {
        console.log("✓ Available models from your API:");
        models.forEach(m => {
          if (m.supportedGenerationMethods?.includes('generateContent')) {
            console.log(`  - ${m.name} (${m.displayName || 'no display name'})`);
          }
        });
        
        // Try to find a flash model first
        const flashModel = models.find(m => 
          m.name.includes('flash') && 
          m.supportedGenerationMethods?.includes('generateContent')
        );
        
        if (flashModel) {
          const modelName = flashModel.name;
          console.log(`✓ Using fast model: ${modelName}`);
          cachedModel = modelName;
          return modelName;
        }
        
        // Otherwise use first available
        const firstModel = models.find(m => 
          m.supportedGenerationMethods?.includes('generateContent')
        );
        
        if (firstModel) {
          const modelName = firstModel.name;
          console.log(`✓ Using model: ${modelName}`);
          cachedModel = modelName;
          return modelName;
        }
      }
    } catch (listError) {
      console.log("Could not list models from API, trying fallback models...");
      console.log("Error:", listError.message.split('\n')[0]);
    }

    // Use actual available models from v1 API
    const fallbackModels =
      modelFromEnv && modelFromEnv.length > 0
        ? modelFromEnv
        : [
            "models/gemini-2.5-flash",       // ✓ FASTEST - Confirmed working
            "models/gemini-2.5-pro",         // ✓ More capable
            "models/gemini-2.0-flash",       // ✓ Alternative fast model
            "models/gemini-2.0-flash-001",   // ✓ Specific version
          ];
    
    console.log("Testing models with different API versions...");
    
    for (const modelName of fallbackModels) {
      try {
        console.log(`Testing model: ${modelName}...`);
        // Test with direct v1 API call
        const text = await callGeminiV1API(modelName, "Hi");
        
        console.log(`✓ Model ${modelName} is available and working!`);
        console.log(`✓ Test response: ${text.substring(0, 50)}...`);
        cachedModel = modelName;
        return modelName;
      } catch (testError) {
        const errorMsg = testError.response?.data?.error?.message || testError.message;
        console.log(`✗ Model ${modelName} not available: ${errorMsg.split('\n')[0]}`);
        continue;
      }
    }

    throw new Error("No available Gemini model found. Please check your API key and quota at https://ai.google.dev/gemini-api/docs/rate-limits");
  } catch (error) {
    console.error("Error getting available model:", error.message);
    throw error;
  }
};

export const chat = async (req, res) => {
  try {
    if (!apiKey) {
      return res.json({
        success: false,
        message: "GEMINI_API_KEY is not configured. Please set it in your .env file.",
      });
    }

    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.json({
        success: false,
        message: "Message is required",
      });
    }

    const modelName = await getAvailableModel();
    console.log(`Using model: ${modelName}`);

    // Build conversation context - SIMPLIFIED
    let prompt = `You are a helpful learning assistant. Keep responses concise and friendly.\n\nUser: ${message}\nAssistant:`;
    
    if (conversationHistory.length > 0) {
      // Only include last 2 exchanges for context
      const recentHistory = conversationHistory.slice(-4);
      const historyText = recentHistory
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
      prompt = `You are a helpful learning assistant. Keep responses concise and friendly.\n\nRecent context:\n${historyText}\n\nUser: ${message}\nAssistant:`;
    }

    try {
      // Use direct v1 API call (bypasses SDK's v1beta limitation)
      const text = await callGeminiV1API(modelName, prompt);

      return res.json({
        success: true,
        message: text,
      });
    } catch (error) {
      console.error("Model generation error:", error.message);
      
      // If model fails, clear cache and let user try again
      if (error.response?.status === 404 || error.message.includes("404")) {
        console.log("Model not found, clearing cache...");
        cachedModel = null;
        throw new Error(`Model ${modelName} not found. Please try again.`);
      }
      
      // Check if it's a quota error
      if (error.response?.status === 429 || error.message.includes("Quota exceeded") || error.message.includes("429")) {
        throw new Error("API quota exceeded. Please wait a moment and try again.");
      }

      // For other errors, throw with clearer message
      throw new Error(error.response?.data?.error?.message || error.message || "Failed to generate response");
    }
  } catch (error) {
    console.error("Chat error:", error);
    
    let errorMessage = "Failed to generate response. Please try again.";
    
    if (error.message && error.message.includes("Quota exceeded")) {
      errorMessage = "API quota exceeded. Please try again later or upgrade your API plan.";
    } else if (error.message && error.message.includes("GEMINI_API_KEY")) {
      errorMessage = "API key is not configured. Please contact support.";
    }

    return res.json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
};

export const getModels = async (req, res) => {
  try {
    if (!apiKey) {
      return res.json({
        success: false,
        message: "GEMINI_API_KEY is not configured",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = await genAI.listModels();
    
    res.json({
      success: true,
      models: models.data || [],
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

