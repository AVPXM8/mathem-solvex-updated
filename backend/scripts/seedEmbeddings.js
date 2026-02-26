const path = require("path");
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const { Pinecone } = require("@pinecone-database/pinecone");
const Question = require("../models/Question");

// 🔹 Load environment variables safely
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

// 🔹 Validate required environment variables
const requiredEnvVars = [
  "PINECONE_API_KEY",
  "GEMINI_API_KEY",
  "PINECONE_INDEX",
  "MONGODB_URI",
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

console.log("✅ Environment variables validated");

// 🔹 Initialize AI and Pinecone clients
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX);

const BATCH_SIZE = 20; // keep lower to avoid rate limits

const embedAndUpsert = async () => {
  try {
    //  Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const questions = await Question.find({});
    console.log(`📊 Found ${questions.length} questions`);

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const vectors = [];

      console.log(`🔄 Processing batch ${i} - ${i + batch.length}`);

      // 🔹 Sequential embedding to avoid 429 rate limits
      for (const q of batch) {
        try {
          const textToEmbed = `Exam: ${q.exam}. Subject: ${q.subject}. Question: ${q.questionText}`;

          const result = await genAI.models.embedContent({
            model: "text-embedding-004",
            contents: textToEmbed,
          });

          const embedding = result.embedding.values;

          vectors.push({
            id: q._id.toString(),
            values: embedding,
            metadata: {
              subject: q.subject || "",
              year: q.year ? q.year.toString() : "",
              textSummary: q.questionText
                ? q.questionText.substring(0, 500)
                : "",
            },
          });

        } catch (err) {
          console.error(
            `⚠️ Embedding failed for question ${q._id}:`,
            err.message
          );
        }
      }

      // 🔹 Upsert to Pinecone
      if (vectors.length > 0) {
        await index.upsert(vectors);
        console.log(`✅ Upserted ${vectors.length} vectors`);
      }
    }

    console.log("🎉 Embedding ingestion complete");
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

embedAndUpsert();
