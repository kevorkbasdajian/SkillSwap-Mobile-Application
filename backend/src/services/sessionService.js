// This file is to handle requests related to sessions.
const supabase = require("../config/database");
const artifactExtractor = require("../utils/artifactExtractor");
const { createNotification } = require("../utils/notification");
const { uploadMultipleToSupabase } = require("../utils/supabaseUpload");

const sessionService = {
  // Create new session (teacher only)
  createSession: async (userId, groupId, sessionData, artifactFiles) => {
    const {
      title,
      description,
      session_type,
      scheduled_date,
      start_time,
      end_time,
    } = sessionData;

    // Verify user is the group creator
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== userId) {
      throw new Error("Only the group creator can create sessions");
    }

    // Validate end_time is after start_time
    if (end_time <= start_time) {
      throw new Error("End time must be after start time");
    }

    // Create session
    const { data: newSession, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          group_id: groupId,
          title,
          description,
          session_type,
          scheduled_date,
          start_time,
          end_time,
          status: "scheduled",
        },
      ])
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    //Upload artifacts if provided
    if (artifactFiles && artifactFiles.length > 0) {
      try {
        const fileUrls = await uploadMultipleToSupabase(
          artifactFiles,
          "artifacts",
        );

        // Create artifact records
        const artifacts = artifactFiles.map((file, index) => ({
          session_id: newSession.id,
          uploaded_by: userId,
          file_url: fileUrls[index],
          file_type: file.mimetype,
          file_name: file.originalname, // Store original filename
        }));

        const { data: savedArtifacts, error: artifactsError } = await supabase
          .from("artifacts")
          .insert(artifacts)
          .select();

        if (artifactsError) {
          console.error("Failed to save artifacts:", artifactsError);
        } else {
          // Process each artifact to generate embeddings
          for (const artifact of savedArtifacts) {
            artifactExtractor
              .processArtifactWithEmbeddings(
                artifact.id,
                artifact.file_url,
                artifact.file_type,
                artifact.file_name,
              )
              .catch((error) => {
                console.error(
                  `Failed to process artifact ${artifact.file_name}:`,
                  error,
                );
              });
          }
          console.log(
            `Started processing ${savedArtifacts.length} artifacts for embeddings`,
          );
        }
      } catch (uploadError) {
        console.error("Failed to upload artifacts:", uploadError);
      }
    }

    // Get all approved group members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("has_joined", true);

    if (membersError) {
      throw new Error(`Failed to fetch group members: ${membersError.message}`);
    }

    // Add all members to session_participants with attendance_status = 'absent'
    const participants = members.map((member) => ({
      session_id: newSession.id,
      user_id: member.user_id,
      attendance_status: "absent",
    }));

    const { error: participantsError } = await supabase
      .from("session_participants")
      .insert(participants);

    if (participantsError) {
      throw new Error(
        `Failed to add participants: ${participantsError.message}`,
      );
    }

    // Send notifications to all group members (except creator)
    const recipientIds = members
      .filter((m) => m.user_id !== userId)
      .map((m) => m.user_id);

    if (recipientIds.length > 0) {
      await createNotification({
        related_entity_type: "session",
        related_entity_id: groupId,
        sender_id: userId,
        recipient_id: recipientIds,
        title: "New Session Scheduled",
        message: `A new session "${title}" has been scheduled in ${group.name} on ${scheduled_date}`,
      });
    }

    return newSession;
  },

  // Get all artifacts for a session
  getSessionArtifacts: async (sessionId, userId) => {
    // Verify user is a participant
    const { data: participant, error: participantError } = await supabase
      .from("session_participants")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (participantError || !participant) {
      throw new Error("You are not a participant of this session");
    }
    const { data: artifacts, error } = await supabase
      .from("artifacts")
      .select(
        `
      id,
      file_url,
      file_type,
      file_name,
      created_at,
      uploaded_by:uploaded_by (id, full_name, nick_name, profile_image_url)
    `,
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch artifacts: ${error.message}`);
    }

    return artifacts;
  },

  // Upload artifacts to existing session
  uploadArtifactsToSession: async (userId, sessionId, artifactFiles) => {
    // Verify user is a participant of the session and the creator of the group
    const { data: participant, error: participantError } = await supabase
      .from("session_participants")
      .select(
        "id, session:sessions!session_id(group:groups!group_id(creator_id))",
      )
      .eq("session_id", sessionId)
      .eq("sessions.groups.creator_id", userId)
      .eq("user_id", userId)
      .single();

    if (participantError || !participant) {
      throw new Error(
        `You are not a participant of this session: ${participantError.message}`,
      );
    }
    if (!artifactFiles || artifactFiles.length === 0) {
      throw new Error("No files provided");
    }
    // Upload files
    const fileUrls = await uploadMultipleToSupabase(artifactFiles, "artifacts");

    // Create artifact records
    const artifacts = artifactFiles.map((file, index) => ({
      session_id: sessionId,
      uploaded_by: userId,
      file_url: fileUrls[index],
      file_type: file.mimetype,
      file_name: file.originalname,
    }));

    const { data: savedArtifacts, error: artifactsError } = await supabase
      .from("artifacts")
      .insert(artifacts).select(`
      id,
      file_url,
      file_type,
      file_name,
      created_at,
      uploaded_by:uploaded_by (id, full_name, nick_name)
    `);

    if (artifactsError) {
      throw new Error(`Failed to save artifacts: ${artifactsError.message}`);
    }
    // Process each artifact to generate embeddings
    for (const artifact of savedArtifacts) {
      artifactExtractor
        .processArtifactWithEmbeddings(
          artifact.id,
          artifact.file_url,
          artifact.file_type,
          artifact.file_name,
        )
        .catch((error) => {
          console.error(
            `Failed to process artifact ${artifact.file_name}:`,
            error,
          );
        });
    }
    console.log(
      `Started processing ${savedArtifacts.length} artifacts for embeddings`,
    );

    return savedArtifacts;
  },

  // Delete artifact
  deleteArtifact: async (userId, artifactId) => {
    // Get artifact and verify ownership or teacher permission
    const { data: artifact, error: fetchError } = await supabase
      .from("artifacts")
      .select(
        `
      id,
      uploaded_by,
      session:session_id (
        id,
        group:group_id (creator_id)
      )
    `,
      )
      .eq("id", artifactId)
      .single();

    if (fetchError || !artifact) {
      throw new Error("Artifact not found");
    }

    // Only uploader or group creator can delete
    const isUploader = artifact.uploaded_by === userId;
    const isTeacher = artifact.session.group.creator_id === userId;

    if (!isUploader && !isTeacher) {
      throw new Error(
        "Only the uploader or group creator can delete this artifact",
      );
    }

    const { error: deleteError } = await supabase
      .from("artifacts")
      .delete()
      .eq("id", artifactId);

    if (deleteError) {
      throw new Error(`Failed to delete artifact: ${deleteError.message}`);
    }

    return { message: "Artifact deleted successfully" };
  },

  // Get session details
  getSessionDetails: async (sessionId, userId) => {
    const { data: session, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        title,
        description,
        session_type,
        scheduled_date,
        start_time,
        end_time,
        status,
        created_at,
        group:group_id (
          id,
          name,
          creator_id,
          skill:skill_id (id, name, icon_url)
        ),
        session_participants (
          id,
          attendance_status,
          user:user_id (id, full_name, nick_name, profile_image_url)
        )
      `,
      )
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      throw new Error("Session not found");
    }

    // Separate present and absent participants
    const presentCount = session.session_participants.filter(
      (p) => p.attendance_status === "present",
    ).length;
    const absentCount = session.session_participants.filter(
      (p) => p.attendance_status === "absent",
    ).length;

    return {
      ...session,
      is_creator: session.group.creator_id === userId,
      attendance_summary: {
        present: presentCount,
        absent: absentCount,
        total: session.session_participants.length,
      },
    };
  },

  // Get all sessions for a group
  getGroupSessions: async (groupId, userId) => {
    // Verify user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .eq("has_joined", true)
      .single();

    if (memberError || !membership) {
      throw new Error("You are not a member of this group");
    }

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        title,
        description,
        session_type,
        scheduled_date,
        start_time,
        end_time,
        status,
        created_at,
        session_participants (id, attendance_status)
      `,
      )
      .eq("group_id", groupId)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    // Add attendance summary to each session
    const enrichedSessions = sessions.map((session) => {
      const presentCount = session.session_participants.filter(
        (p) => p.attendance_status === "present",
      ).length;
      return {
        ...session,
        attendance_summary: {
          present: presentCount,
          total: session.session_participants.length,
        },
      };
    });

    return enrichedSessions;
  },

  // Get upcoming session for a group
  getUpcomingSession: async (userId, groupId) => {
    // Verify user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .eq("has_joined", true)
      .single();

    if (memberError || !membership) {
      throw new Error("You are not a member of this group");
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .select(
        `
          id,
          title,
          description,
          session_type,
          scheduled_date,
          start_time,
          end_time,
          status,
          created_at
        )
      `,
      )
      .eq("group_id", groupId)
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: true })
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch upcoming session: ${error.message}`);
    }

    return session;
  },

  // Check in to session (mark attendance as present)
  checkInToSession: async (userId, sessionId) => {
    // Get session participant record
    const { data: participant, error: fetchError } = await supabase
      .from("session_participants")
      .select(
        "id, attendance_status, session:session_id(status, scheduled_date, start_time)",
      )
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !participant) {
      throw new Error("You are not a participant of this session");
    }

    if (participant.attendance_status === "present") {
      throw new Error("You have already checked in to this session");
    }

    if (participant.session.status !== "scheduled") {
      throw new Error("Cannot check in to a session that is not scheduled");
    }

    // Update attendance
    const { data: updated, error: updateError } = await supabase
      .from("session_participants")
      .update({ attendance_status: "present" })
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to check in: ${updateError.message}`);
    }

    return updated;
  },

  // Update session (teacher only)
  updateSession: async (userId, sessionId, updateData) => {
    // Get session and verify creator
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, group:group_id(creator_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    if (session.group.creator_id !== userId) {
      throw new Error("Only the group creator can update sessions");
    }

    // Validate times if both are provided
    if (
      updateData.start_time &&
      updateData.end_time &&
      updateData.end_time <= updateData.start_time
    ) {
      throw new Error("End time must be after start time");
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    return updatedSession;
  },

  // Delete session (teacher only)
  deleteSession: async (userId, sessionId) => {
    // Get session and verify creator
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, group:group_id(creator_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    if (session.group.creator_id !== userId) {
      throw new Error("Only the group creator can delete sessions");
    }

    // Delete session (cascades to session_participants)
    const { error: deleteError } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (deleteError) {
      throw new Error(`Failed to delete session: ${deleteError.message}`);
    }

    return { message: "Session deleted successfully" };
  },

  // Mark session as completed (teacher only)
  markSessionCompleted: async (userId, sessionId) => {
    const result = await sessionService.updateSession(userId, sessionId, {
      status: "completed",
    });
    return result;
  },

  // Cancel session (teacher only)
  cancelSession: async (userId, sessionId) => {
    const result = await sessionService.updateSession(userId, sessionId, {
      status: "cancelled",
    });

    // Notify all participants
    const { data: participants } = await supabase
      .from("session_participants")
      .select("user_id, session:session_id(title, group:group_id(name))")
      .eq("session_id", sessionId);

    if (participants && participants.length > 0) {
      const recipientIds = participants
        .filter((p) => p.user_id !== userId)
        .map((p) => p.user_id);

      if (recipientIds.length > 0) {
        await createNotification({
          related_entity_type: "session",
          related_entity_id: sessionId,
          sender_id: userId,
          recipient_id: recipientIds,
          title: "Session Cancelled",
          message: `The session "${participants[0].session.title}" in ${participants[0].session.group.name} has been cancelled`,
        });
      }
    }

    return result;
  },
};
module.exports = sessionService;
/*
1- createSession: This service checks that the user is the creator of the group, checks that end_time is > than start_time, creates the session. Then, it gathers all active group members
and inserts them into the session_participants table, and sends notifications that the session was created.
2- getSessionArtifacts: This service first checks that the retriever is a participant in the session. And then, fetches the artifacts from the artifacts table.
3- uploadArtifactsToSession: This service first checks that the uploader is the creator of the group. Then uploads the file and retrieves its information.
4- deleteArtifact: This service first checks that the deleter is the creator of the group, and then deletes the file. 
5- getSessionDetails: This service retrieves the details of the session, the number of absent and present participants, and shows them to the user.
6- getGroupSessions: This service checks that the user is a member within the group. Then, it selects all of the sessions related to the group, and returns it by adding attendance_summary
to the sessions.
7- getUpcomingSession: This service checks that a user is part of a group, and retrieves the upcoming session in that group.
8- checkInToSession: This service checks that a user is a participant in the session. If so, it marks his attendance as present.
9- updateSession: This service first checks that the user is the creator of the group. And then, it checks that the end time is after the start time, and if so, it updates the session
information with the provided one.
10- deleteSession: This service checks that the user is the creator of the group, and then deletes the session.
11- markSessionCompleted: This service marks a session as being completed.
12- cacnelSession: This service marks a session as being cancelled. And then, it gathers the session_participants and informs them through a notification that the session has been cancelled.
*/
