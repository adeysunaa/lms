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
    return cachedModel;
  }

  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required. Please set it in your .env file.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try to list available models
    try {
      const models = await genAI.listModels();
      const modelList = models.data || [];
      
      // Look for Flash models first (better quota limits)
      const flashModel = modelList.find(
        (m) => m.name && m.name.includes("flash") && m.supportedGenerationMethods?.includes("generateContent")
      );
      
      if (flashModel) {
        cachedModel = flashModel.name.split("/").pop();
        return cachedModel;
      }

      // Fallback to any model that supports generateContent
      const availableModel = modelList.find(
        (m) => m.supportedGenerationMethods?.includes("generateContent")
      );
      
      if (availableModel) {
        cachedModel = availableModel.name.split("/").pop();
        return cachedModel;
      }
    } catch (listError) {
      console.log("Could not list models, using fallback:", listError.message);
    }

    // Fallback to common model names
    const fallbackModels =
      modelFromEnv && modelFromEnv.length > 0
        ? modelFromEnv
        : [
            "models/gemini-2.5-pro",
            "models/gemini-2.5-pro-preview-06-05",
            "models/gemini-2.5-pro-preview-05-06",
            "models/gemini-2.5-pro-preview-03-25",
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-001",
            "models/gemini-pro-latest",
          ];
    
    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Test if model works by making a simple call with the new API format
        await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: "availability check" }],
            },
          ],
        });
        cachedModel = modelName;
        return modelName;
      } catch (testError) {
        console.log(`Model ${modelName} not available: ${testError.message}`);
        continue;
      }
    }

    throw new Error("No available Gemini model found");
  } catch (error) {
    console.error("Error getting available model:", error);
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName, apiVersion: "v1beta" });

    // Build conversation context
    let prompt = message;
    if (conversationHistory.length > 0) {
      const historyText = conversationHistory
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
      prompt = `Previous conversation:\n${historyText}\n\nUser: ${message}\nAssistant:`;
    }

    let retries = 3;
    let lastError = null;

    while (retries > 0) {
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
        lastError = error;
        
        // Check if it's a quota error
        if (error.message && error.message.includes("Quota exceeded")) {
          const retryDelay = error.retryDelay || Math.pow(2, 4 - retries) * 1000;
          console.log(`Quota exceeded, retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retries--;
          continue;
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    throw lastError || new Error("Failed to generate response after retries");
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

