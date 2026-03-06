// This file is to extract text from artifacts, and process and store them in the artifact_embeddings table

const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const supabase = require("../config/database");
const embeddingService = require("../services/embeddingService");

const artifactExtractor = {
  //Extract text from a single artifact
  extractTextFromArtifact: async (artifactUrl, fileType) => {
    try {
      //Download file from Supabase storage
      const response = await fetch(artifactUrl);
      const buffer = await response.arrayBuffer();

      let extractedText = "";

      //Extract based on file type
      if (fileType.includes("pdf")) {
        //Extract from PDF
        const data = await pdf(Buffer.from(buffer));
        extractedText = data.text;
      } else if (
        fileType.includes("word") ||
        fileType.includes("document") ||
        artifactUrl.endsWith(".docx")
      ) {
        //Extract from Word document
        const result = await mammoth.extractRawText({
          buffer: Buffer.from(buffer),
        });
        extractedText = result.value;
      } else if (fileType.includes("text") || artifactUrl.endsWith(".txt")) {
        // Plain text file
        extractedText = Buffer.from(buffer).toString("utf-8");
      } else {
        //Unsupported file type
        console.log(`Unsupported file type: ${fileType}`);
        return null;
      }

      return extractedText.trim();
    } catch (error) {
      console.error("Error extracting text from artifact:", error);
      return null;
    }
  },

  // Get all artifacts for a group and extract text
  extractTextFromGroupArtifacts: async (groupId) => {
    try {
      //Get all sessions for the group
      const { data: sessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id")
        .eq("group_id", groupId);

      if (sessionError || !sessions || sessions.length === 0) {
        return "";
      }
      const sessionIds = sessions.map((s) => s.id);

      //Get all artifacts from these sessions
      const { data: artifacts, error: artifactsError } = await supabase
        .from("artifacts")
        .select("file_url, file_type, file_name")
        .in("session_id", sessionIds);

      if (artifactsError || !artifacts || artifacts.length === 0) {
        return "";
      }

      // Extract text from each artifact
      const extractionPromises = artifacts.map(async (artifact) => {
        const text = await artifactExtractor.extractTextFromArtifact(
          artifact.file_url,
          artifact.file_type,
        );
        if (text) {
          return `\n\n--- ${artifact.file_name} ---\n${text}`;
        }
        return "";
      });

      const extractedTexts = await Promise.all(extractionPromises);
      const combinedText = extractedTexts.filter((text) => text).join("\n\n");

      return combinedText;
    } catch (error) {
      console.error("Error extracting group artifacts:", error);
      return "";
    }
  },

  // Get artifacts for a specific session
  extractTextFromSessionArtifacts: async (sessionId) => {
    try {
      const { data: artifacts, error } = await supabase
        .from("artifacts")
        .select("file_url,file_name,file_type")
        .eq("session_id", sessionId);

      if (error || !artifacts || artifacts.length === 0) {
        return "";
      }

      const extractionPromises = artifacts.map(async (artifact) => {
        const text = artifactExtractor.extractTextFromArtifact(
          artifact.file_url,
          artifact.file_name,
        );
        if (text) {
          return `\n\n--- ${artifact.file_name} --- \n${text}`;
        }
        return "";
      });

      const extractedText = await Promise.all(extractionPromises);
      const combinedText = extractedText.filter((text) => text).join("\n\n");

      return combinedText;
    } catch (error) {
      console.error("Error extracting session artifacts:", error);
      return "";
    }
  },

  //Process artifact and store embeddings
  processArtifactWithEmbeddings: async (
    artifactId,
    artifactUrl,
    fileType,
    fileName,
  ) => {
    try {
      console.log(`Processing artifact: ${fileName}`);

      //Step 1: Extract text from artifact
      const extractedText = await artifactExtractor.extractTextFromArtifact(
        artifactUrl,
        fileType,
      );

      if (!extractedText || extractedText.trim().length === 0) {
        console.log(`No text extracted from ${fileName}`);
        return { success: false, message: "No text content found" };
      }

      console.log(
        `Extracted ${extractedText.length} characters from ${fileName}`,
      );

      //Step 2: Split text into chunks
      const chunks = embeddingService.chunkText(extractedText, 500, 50);

      if (chunks.length === 0) {
        return { success: false, message: "No chunks created" };
      }

      console.log(`Created ${chunks.length} chunks`);

      //Step 3: Generate embeddings for all chunks
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await embeddingService.generateEmbeddings(chunkTexts);

      console.log(`Generated ${embeddings.length} embeddings`);

      //Step 4: Store chunks and embeddings in database
      const embeddingRecords = chunks.map((chunk, index) => ({
        artifact_id: artifactId,
        chunk_text: chunk.text,
        chunk_index: chunk.index,
        embedding: JSON.stringify(embeddings[index]),
        metadata: {
          fileName,
          startWord: chunk.startWord,
          endWord: chunk.endWord,
          wordCount: chunk.text.split(/\s+/).length,
        },
      }));

      const { data, error } = await supabase
        .from("artifact_embeddings")
        .insert(embeddingRecords);

      if (error) {
        console.error("Error storing embeddings:", error);
        throw new Error(`Failed to store embeddings: ${error.message}`);
      }

      console.log(
        `Successfully processed ${fileName}: ${chunks.length} chunks stored`,
      );
      return {
        success: true,
        chunksCreated: chunks.length,
        message: `Processed ${fileName} successfully`,
      };
    } catch (error) {
      console.error("Error processing artifact wit embeddings", error);
      throw error;
    }
  },
};

module.exports = artifactExtractor;

/*
1-extractTextFromArtifact: This service gets the file url and the file type, fetches the file from the url, converts it into raw bytes, and extracts the text based on the file type. if not supported,
it indicated that the file type is not supported.
2-extractTextFromGroupArtifacts: This service first checks that the group has sessions(because the artifacts are related to sessions), then retrieves the artifacts' file_name, file_type, and file_url
and gives it to the first service that is extractTextFromArtifact so that it can return the extracted text. Then the service retrieves the extracted texts, formats it with file name and below it the text
and joins the different file's texts into one string and returns it.
3-extractTextFromSessionArtifacts: This service performs the same functionality of the 2nd service, except it performs it on a specific session's artifacts only.
4-processArtifactWithEmbeddings: This service takes an artifactId, artifactUrl, FileType, and fileName. It first extracts the text from the artifact, then it splits the text into chunks, then it extracts
the text from each chunk, then it transforms the text of each chunk(composed of 500 words) into an embedding, reformats it for proper storage, and then stores it in the artifact_embeddings table.
*/
