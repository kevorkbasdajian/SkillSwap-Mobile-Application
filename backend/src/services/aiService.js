// This file is to serve the questions of the users directed towards the AI

const Groq = require("groq-sdk");
const config = require("../config/env");
const artifactExtractor = require("../utils/artifactExtractor");
const embeddingService = require("./embeddingService");

//Initialize Groq client
const groq = new Groq({
  apiKey: config.groq.apiKey,
});

const aiService = {
  //Find relevant chunks using semantic search
  findRelevantChunks: async (question, groupId, topK = 5) => {
    try {
      //Step 1 Generate embedding for the question
      const questionEmbedding =
        await embeddingService.generateEmbedding(question);

      //Step 2: Get all sessions for this group
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("group_id", groupId);

      if (!sessions || sessions.length === 0) {
        return [];
      }

      const sessionIds = sessions.map((s) => s.id);

      //Step 3: Get all artifacts for these sessions
      const { data: artifacts } = await supabase
        .from("artifacts")
        .select("id")
        .in("session_id", sessionIds);
      if (!artifacts || artifacts.length === 0) {
        return [];
      }

      const artifactIds = artifacts.map((a) => a.id);

      //Step 4: Perform vector similarity search
      const { data: similarChunks, error } = await supabase.rpc(
        "match_artifact_chunks",
        {
          query_embedding: JSON.stringify(questionEmbedding),
          match_threshold: 0.3, // Minimum similarity
          match_count: topK,
          artifact_ids: artifactIds,
        },
      );

      if (error) {
        console.error("Vecotr search error", error);
        return [];
      }

      return similarChunks || [];
    } catch (error) {
      console.error("Error finding relevant chunks:", error);
      return [];
    }
  },

  //Generate AI answer based on artifacts
  generateAnswer: async (question, artifactTexts, conversationHistory = []) => {
    try {
      //Step 1: Find relevant chunks
      const relevantChunks = await aiService.findRelevantChunks(
        question,
        groupId,
        5,
      );

      //Step 2: Build context from chunks
      let contextText = "";
      if (relevantChunks.length > 0) {
        contextText = relevantChunks
          .map((chunk, index) => `[Source ${index + 1}]: ${chunk.chunk_text}`)
          .join("\n\n");
      } else {
        contextText = "No relevant course materials found";
      }

      //Step 3: Build optimized system prompt

      //       const systemPrompt = `You are an AI teaching assistant for a learning group.
      // Your role is to answer student questions STRICTLY based on the provided course materials.

      // CRITICAL RULES:
      // 1. ONLY use information from the course materials provided below
      // 2. If the answer is NOT in the materials, respond: "I don't have enough information in the provided course materials to answer this question. Please ask your teacher for clarification."
      // 3. DO NOT use your general knowledge or training data
      // 4. Quote or reference relevant parts of the materials when answering
      // 5. Be clear, concise, and educational
      // 6. If the materials are empty or insufficient, always say you don't have enough information

      // COURSE MATERIALS:
      // ${artifactTexts || "No course materials have been provided yet."}

      // Now answer the student's question based ONLY on the materials above.`;

      const systemPrompt = `You are an AI teaching assistant. Answer questions ONLY using the provided course materials below.

RULES:
- Use ONLY information from the sources
- If answer not in sources: "I don't have this information in the course materials. Please ask your teacher."
- Be clear and educational
- Reference sources when answering (e.g., "According to Source 1...")

COURSE MATERIALS:
${contextText}`;

      //Step 4: Prepare messages
      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
        { role: "user", content: question },
      ];

      // Step 5: Call Groq API
      const response = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 0.9,
      });

      //Extract the AI's answer
      const answer = response.choices[0].message.content;

      return {
        answer,
        sourcesUsed: relevantChunks.length,
        sources: relevantChunks.map((c) => ({
          fileName: c.metadata?.fileName,
          chunkIndex: c.chunk_index,
        })),
      };
    } catch (error) {
      console.error("Groq API Error:", error);
      throw new Error("Failed to generate AI response. Please try again.");
    }
  },

  // Test if Groq API is working
  testConnection: async () => {
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      });

      return { success: true, message: "Groq API connected successfully" };
    } catch (error) {
      console.error("groq connection test failed", error);
      return { success: false, error: error.message };
    }
  },
};

module.exports = aiService;

/*
1-findRelevantChunks:
2-generateAnswer:
*/
