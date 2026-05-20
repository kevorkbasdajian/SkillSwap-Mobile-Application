// This file is needed to setup the embeddingModel once and create embeddings for file chunks, which are a list of numbers that represent semantic meaning. This file also transforms a text into
// manageable chunks

const { pipeline } = require("@xenova/transformers");

//Global variable to cache the model (loads once, reuses forever)
let embeddingModel = null;

const embeddingService = {
  //Initialize the embedding model (happens once on first use)
  initializeModel: async () => {
    if (!embeddingModel) {
      console.log("Loading embedding model... (this happens once)");
      //Load the all-MiniLM-L6-v2 model - fast and good quality
      embeddingModel = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      );
      console.log("Embedding model loaded successfully");
    }
    return embeddingModel;
  },

  // Generate embedding for a single text
  generateEmbedding: async (text) => {
    try {
      //Ensure model is loaded
      const model = await embeddingService.initializeModel();

      //Generate embedding
      const output = await model(text, { pooling: "mean", normalize: true });

      //Convert to array
      const embedding = Array.from(output.data);

      return embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  },

  //Generating embeddings for multiple texts (batch processing - faster)
  generateEmbeddings: async (texts) => {
    try {
      const model = await embeddingService.initializeModel();

      const embeddings = await Promise.all(
        texts.map((text) => embeddingService.generateEmbedding(text)),
      );

      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw new Error("Failed to generate embeddings");
    }
  },

  // Split text into chunks (for processing large documents)
  chunkText: (text, chunkSize = 500, overlap = 50) => {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      if (chunk.trim().length > 0) {
        chunks.push({
          text: chunk,
          index: chunks.length,
          startWord: i,
          endWord: Math.min(i + chunkSize, words.length),
        });
      }
    }

    return chunks;
  },
};
module.exports = embeddingService;

/*
1-generateEmbedding: Takes a single text, ensures the model has been setup, generates the embedding, converts it into an array, and returns that array.
2-generateEmbeddings: Takes texts as input, ensures the model is running, generates the embedding for individual text, puts them in an array, and returns that array.
3- chunkText: Important parameters are chunkSize = # of words in a chunk , and overlap of words among chunks. Takes a text, converts it into string based on whitespace,
divides the array into chunks based on chunksize, transforms the array items in the chunk into a single string, pushes the string, startWord index and endWord index and index into the 
chunks array, and returns that array.
*/
