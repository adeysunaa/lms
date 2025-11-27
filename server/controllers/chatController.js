import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const modelFromEnv = process.env.GEMINI_MODEL?.split(",").map((m) => m.trim()).filter(Boolean);

if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not set in environment variables. Please add it to your .env file.');
}

let cachedModel = null;

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

    // Fallback to common model names - PRIORITIZE FLASH MODELS FOR SPEED
    // Note: Use the actual model names without 'models/' prefix
    const fallbackModels =
      modelFromEnv && modelFromEnv.length > 0
        ? modelFromEnv
        : [
            "gemini-1.5-flash",           // FASTEST - Free tier friendly
            "gemini-1.5-pro",             // More capable, still available
            "gemini-pro",                 // Legacy fallback
            "gemini-1.0-pro",             // Older version
          ];
    
    console.log("Testing models:", fallbackModels);
    
    for (const modelName of fallbackModels) {
      try {
        console.log(`Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        // Test if model works by making a simple call
        const result = await model.generateContent("Hi");
        const response = await result.response;
        response.text(); // Just verify it works
        
        console.log(`✓ Model ${modelName} is available and working!`);
        cachedModel = modelName;
        return modelName;
      } catch (testError) {
        console.log(`✗ Model ${modelName} not available: ${testError.message.split('\n')[0]}`);
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1000,
        topP: 0.95,
        topK: 40,
      },
    });

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
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });
      const response = await result.response;
      const text = response.text();

      return res.json({
        success: true,
        message: text,
      });
    } catch (error) {
      console.error("Model generation error:", error.message);
      
      // If model fails, clear cache and let user try again
      if (error.message.includes("not found") || error.message.includes("404")) {
        console.log("Model not found, clearing cache...");
        cachedModel = null;
      }
      
      // Check if it's a quota error
      if (error.message && error.message.includes("Quota exceeded")) {
        throw new Error("API quota exceeded. Please wait a moment and try again.");
      }

      // For other errors, throw with clearer message
      throw error;
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

