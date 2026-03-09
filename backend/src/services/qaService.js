// This file is to implement the Q&A functionality

const supabase = require("../config/database");
const aiService = require("./aiService");

const qaService = {
  //Get or create Q&A conversation for a learner in a group
  getOrCreateConversation: async (userId, groupId) => {
    //Verify user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("id,role")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .eq("has_joined", true)
      .single();
    if (memberError || !membership) {
      throw new Error("You are not a member of this group");
    }

    //Teachers cannot use Q&A (they answer questions, not ask)
    const { data: group } = await supabase
      .from("groups")
      .select("creator_id")
      .eq("id", groupId)
      .single();
    if (group && group.creator_id === userId) {
      throw new Error(
        "Teachers cannot use the Q&A feature. You can view learner questions in the group chat",
      );
    }

    //Check if conversation exists
    let { data: conversation, error: convError } = await supabase
      .from("qa_conversations")
      .select("id, group_id, user_id, created_at, updated_at")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    //Create if doesn't exists
    if (convError || !conversation) {
      const { data: newConv, error: createError } = await supabase
        .from("qa_conversations")
        .insert([
          {
            group_id: groupId,
            user_id: userId,
          },
        ])
        .select()
        .single();
      if (createError) {
        throw new Error(
          `Failed to create conversation: ${createError.message}`,
        );
      }
      conversation = newConv;
    }
    return conversation;
  },

  // Ask a question and get AI answer
  askQuestion: async (userId, groupId, question) => {
    //Get or create conversation
    const conversation = await qaService.getOrCreateConversation(
      userId,
      groupId,
    );

    // Get conversation history (last 5 Q&A pairs for context)
    const { data: history } = await supabase
      .from("qa_messages")
      .select("role,content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Reverse to chronological order
    const conversationHistory = history ? history.reverse() : [];

    //Generate AI answer using RAG
    const aiResponse = await aiService.generateAnswer(
      question,
      groupId,
      conversationHistory,
    );

    //Save user question
    const { error: questionError } = await supabase.from("qa_messages").insert([
      {
        conversation_id: conversation.id,
        role: "user",
        content: question,
      },
    ]);
    if (questionError) {
      throw new Error(`Failed to save question: ${questionError.message}`);
    }

    //Save AI answer
    const { data: answerMessage, error: answerError } = await supabase
      .from("qa_messages")
      .insert([
        {
          conversation_id: conversation.id,
          role: "assistant",
          content: aiResponse.answer,
        },
      ])
      .select()
      .single();
    if (answerError) {
      throw new Error(`Failed to save answer: ${answerError.message}`);
    }

    //Update conversation timestamp
    await supabase
      .from("qa_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    return {
      question,
      answer: aiResponse.answer,
      sourcesUsed: aiResponse.sourcesUsed,
      sources: aiResponse.sources,
      messageId: answerMessage.id,
      conversationId: conversation.id,
    };
  },

  // Get conversation History
  getConversationHistory: async (userId, groupId, limit = 50) => {
    //Get conversation
    const conversation = await qaService.getOrCreateConversation(
      userId,
      groupId,
    );

    //Get messages
    let { data: messages, error } = await supabase
      .from("qa_messages")
      .select(`id,role,content,created_at`)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
    if (messages) {
      messages = messages.reverse();
    }

    return messages || [];
  },

  // Clear entire conversation history
  clearConversation: async (userId, groupId) => {
    const conversation = await qaService.getOrCreateConversation(
      userId,
      groupId,
    );
    const { error } = await supabase
      .from("qa_messages")
      .delete()
      .eq("conversation_id", conversation.id);

    if (error) {
      throw new Error(`Failed to clear conversation: ${error.message}`);
    }
    return { message: "Conversation History cleared successfully" };
  },
};
module.exports = qaService;
/*
1- getOrCreateConversation: First checks that the user is a member of the group, then checks if the user is the creator or teacher of the group (cannot ask questions). Then checks if a conversation
exists, and if not creates a new one and returns it.
2- askQuestion: First gets or create a new conversation to the user. Then, retrieves the last 5 Q&A pairs, and requests a response from the AI. Then, it saves the question and the response, updates 
the conversation history and returns the message.
3- getConversationHistory: First, it gets or creats the conversation and then it selects the latest 50 messages in this conversation (if limit is not specified).
4- clearConversation: This service gets or creates the conversation, and then goes on to delete the entire history.
*/
