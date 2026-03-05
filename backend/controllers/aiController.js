const { GoogleGenAI } = require("@google/genai");
const { Pinecone } = require("@pinecone-database/pinecone");

// Initialize Gemini (v1 API)
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX);

const chatWithTutor = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    // 🔹 Step 1: Embed user query
    const embeddingResult = await genAI.models.embedContent({
      model: "embedding-001",
      contents: message,
    });

    const queryVector = embeddingResult.embedding.values;

    // 🔹 Step 2: Search Pinecone
    const queryResponse = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true,
    });

    let contextData = "Reference Questions:\n";

    queryResponse.matches.forEach((match, idx) => {
      const summary = match.metadata?.textSummary || "No summary available";
      const subject = match.metadata?.subject || "Unknown";
      contextData += `${idx + 1}. [${subject}] ${summary}\n`;
    });

    // 🔹 Step 3: Generate Answer
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `${contextData}\n\nStudent Question: ${message}`,
    });

    res.status(200).json({
      text: response.text,
      relatedIds: queryResponse.matches.map((m) => m.id),
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI Tutor is busy. Please try again." });
  }
};

module.exports = {
  chatWithTutor,
};
