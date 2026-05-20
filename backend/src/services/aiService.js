// This file is to serve the questions of the users directed towards the AI

const Groq = require("groq-sdk");
const config = require("../config/env");
const artifactExtractor = require("../utils/artifactExtractor");
const embeddingService = require("./embeddingService");
const supabase = require("../config/database");

//Initialize Groq client
const groq = new Groq({
  apiKey: config.groq.apiKey,
});

const aiService = {
  //Find relevant chunks using semantic search
  findRelevantChunks: async (question, groupId, topK = 5, sessionId = null) => {
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
      console.log("Sessions related to these group", sessions);

      const sessionIds = sessions.map((s) => s.id);

      //Step 3: Get all artifacts for these sessions (narrow to specific session if provided)
      const artifactQuery = supabase.from("artifacts").select("id");
      if (sessionId) {
        artifactQuery.eq("session_id", sessionId);
      } else {
        artifactQuery.in("session_id", sessionIds);
      }

      const { data: artifacts } = await artifactQuery;

      if (!artifacts || artifacts.length === 0) {
        return [];
      }
      console.log("Artifacts related to these group", artifacts);

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
      console.log("Similar chunks", similarChunks);

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
  generateAnswer: async (question, groupId, conversationHistory = []) => {
    try {
      //Step 1: Detect session reference and find relevant chunks
      const { sessionNumber, isSummary } =
        aiService.detectSessionReference(question);

      const topK = isSummary ? 15 : 5;

      let targetSessionId = null;

      if (sessionNumber) {
        //Look up the session by its order within the group
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id, title")
          .eq("group_id", groupId)
          .order("created_at", { ascending: true });
        if (sessions && sessions[sessionNumber - 1]) {
          targetSessionId = sessions[sessionNumber - 1].id;
          console.log(
            `Targeting session: ${sessions[sessionNumber - 1].title}`,
          );
        }
      }
      let relevantChunks;

      if (isSummary && targetSessionId) {
        const { data: artifacts } = await supabase
          .from("artifacts")
          .select("id")
          .eq("session_id", targetSessionId);

        if (artifacts && artifacts.length > 0) {
          const artifactIds = artifacts.map((a) => a.id);
          const { data: chunks } = await supabase
            .from("artifact_embeddings")
            .select("chunk_text, chunk_index, metadata")
            .in("artifact_id", artifactIds)
            .order("chunk_index", { ascending: true });
          relevantChunks = chunks || [];
        } else {
          relevantChunks = [];
        }
      } else {
        relevantChunks = await aiService.findRelevantChunks(
          question,
          groupId,
          topK,
          targetSessionId,
        );
      }

      //Step 2: Build context from chunks
      let contextText = "";
      if (relevantChunks.length > 0) {
        contextText = relevantChunks
          .map(
            (chunk, index) =>
              `[Source ${index + 1} - ${chunk.metadata?.fileName || "Unknown File"}]: ${chunk.chunk_text}`,
          )
          .join("\n\n");
      } else {
        contextText = "No relevant course materials found";
      }

      //Step 3: Build optimized system prompt

      const fileNames = [
        ...new Set(
          relevantChunks.map((c) => c.metadata?.fileName).filter(Boolean),
        ),
      ];

      const systemPrompt = isSummary
        ? `You are an AI teaching assistant. Summarize ALL of the following course materials.

You MUST cover every source listed below. The session has ${fileNames.length} file(s): ${fileNames.join(", ")}.
Do NOT skip any file. Dedicate a clear section to each one.

COURSE MATERIALS:
${contextText}`
        : `You are an AI teaching assistant. Answer questions ONLY using the provided course materials below.

RULES:
- Use ONLY information from the sources
- If answer not in sources: "I don't have this information in the course materials. Please ask your teacher."
- Be clear and educational
- Reference sources when answering (e.g., "According to lecture_notes.pdf...")

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
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.3,
        max_tokens: 2000,
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
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      });

      return { success: true, message: "Groq API connected successfully" };
    } catch (error) {
      console.error("groq connection test failed", error);
      return { success: false, error: error.message };
    }
  },

  //Detect if the question is targeting a specific session
  detectSessionReference: (question) => {
    const lower = question.toLowerCase();

    //Match patterns like "session 2", "session2", "session two"
    const numberMap = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    let sessionNumber = null;

    //Match "session 2" or "session2"
    const digitMatch = lower.match(/session\s*(\d+)/);
    if (digitMatch) {
      sessionNumber = parseInt(digitMatch[1]);
    }

    // Match "session two", "session three" etc.
    if (!sessionNumber) {
      for (const [word, num] of Object.entries(numberMap)) {
        if (lower.includes(`session ${word}`)) {
          sessionNumber = num;
          break;
        }
      }
    }

    //Detect if it's a summary request
    const isSummary =
      /summarize|overview|recap|what was covered|what did we cover/i.test(
        question,
      );

    return { sessionNumber, isSummary };
  },
};

module.exports = aiService;

/*
1-findRelevantChunks: Embeds a question, Gets all sessions for a group, gets the artifacts connected to these sessions, performs vector similarity search

*/
