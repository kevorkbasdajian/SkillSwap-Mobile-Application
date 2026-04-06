// This file is used to view all of a user's groups in the group page. WHen clicking on a skill in the homepage, as a teacher , all created groups will appear. As a learner, all public groups
// related to the skill will appear. The user can join a group, a page appears displaying additional info about the group. The user can confirm.

const supabase = require("../config/database");
const { uploadToSupabase } = require("../utils/supabaseUpload");
const { createNotification } = require("../utils/notification");
const friendService = require("./friendService");

//Helper : Map proficiency to difficulty levels
const mapProficiencyToDifficulties = (proficiency) => {
  const proficiencyNum = parseInt(proficiency);
  if (proficiencyNum <= 2) {
    return ["beginner", "intermediate"];
  } else if (proficiencyNum === 3) {
    return ["beginner", "intermediate", "advanced"];
  } else {
    return ["intermediate", "advanced"];
  }
};

const groupService = {
  //Create new group
  createGroup: async (userId, groupData, coverImageFile) => {
    const {
      name,
      description,
      skill_id,
      difficulty_level,
      visibility,
      max_participants,
    } = groupData;

    //Check if user has this skill with teacher role
    const { data: userSkill, error: skillError } = await supabase
      .from("user_skills")
      .select("id")
      .eq("user_id", userId)
      .eq("skill_id", skill_id)
      .eq("role", "teacher")
      .single();
    if (skillError || !userSkill) {
      throw new Error(
        "You must have this skill as a teacher to create a group",
      );
    }

    let coverImageUrl = null;

    //Upload cover image if provided, otherwise use skill icon
    if (coverImageFile) {
      coverImageUrl = await uploadToSupabase(coverImageFile, "avatars");
    } else {
      //Get skill icon as fallback
      const { data: skill } = await supabase
        .from("skills")
        .select("icon_url")
        .eq("id", skill_id)
        .single();

      coverImageUrl = skill?.icon_url || null;
    }

    //Create group
    const { data: newGroup, error: groupError } = await supabase
      .from("groups")
      .insert([
        {
          name,
          description,
          skill_id,
          creator_id: userId,
          difficulty: difficulty_level,
          visibility,
          status: "active",
          cover_image_url: coverImageUrl,
          max_participants,
        },
      ])
      .select()
      .single();
    if (groupError) {
      throw new Error(`Failed to create group: ${groupError.message}`);
    }

    // Add creator as teacher member (auto-approved)
    const { error: memberError } = await supabase.from("group_members").insert([
      {
        group_id: newGroup.id,
        user_id: userId,
        role: "teacher",
        has_joined: true,
      },
    ]);
    if (memberError) {
      throw new Error(
        `Failed to add creator as teacher : ${memberError.message}`,
      );
    }
    return newGroup;
  },

  //Get available groups for learner mode(by skill,filtered by proficiency)
  getAvailableGroupsForLearner: async (userId, userSkillId) => {
    //Get user's proficiency for this skill
    const { data: userSkill, error: skillError } = await supabase
      .from("user_skills")
      .select("proficiency_level, skill:skill_id(id)")
      .eq("user_id", userId)
      .eq("id", userSkillId)
      .eq("role", "learner")
      .single();
    if (skillError || !userSkill) {
      throw new Error("You do not have this skill as a learner");
    }

    //Map proficiency to difficulty level
    const allowedDifficulties = mapProficiencyToDifficulties(
      userSkill.proficiency_level,
    );

    //Get groups user is already in or has requested to join
    const { data: userGroups } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);
    const excludedGroupIds = userGroups.map((g) => g.group_id) || [];

    //Build query
    let query = supabase
      .from("groups")
      .select(
        `id,name,description,difficulty,visibility,cover_image_url,max_participants,created_at,skill:skill_id (id,name,icon_url),group_members (id)`,
      )
      .eq("skill_id", userSkill.skill.id)
      .eq("visibility", "public")
      .eq("status", "active")
      .in("difficulty", allowedDifficulties);
    if (excludedGroupIds.length > 0) {
      query = query.not("id", "in", `(${excludedGroupIds.join(",")})`);
    }

    const { data: groups, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch group: ${error.message}`);
    }

    // Filter out full groups and format response
    const availableGroups = groups
      .map((group) => {
        const currentParticipants = group.group_members.filter(
          (member) => member.has_joined !== false,
        ).length;
        return {
          ...group,
          current_participants: currentParticipants,
          is_full: currentParticipants >= group.max_participants,
        };
      })
      .filter((group) => !group.is_full);

    return availableGroups;
  },

  // Get teacher's own groups for a skill
  getTeacherGroups: async (userId, skillId) => {
    const { data: groups, error } = await supabase
      .from("groups")
      .select(
        `id,name,description,
        difficulty,
        visibility,
        cover_image_url,
        max_participants,
        status,
        created_at,
        creator_id,
        skill:skill_id (id, name, icon_url),
        group_members (id,user_id, has_joined)`,
      )
      .eq("skill_id", skillId)
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    //Add participant count
    const formattedGroups = groups.map((group) => {
      const approvedCount = group.group_members.filter(
        (member) => member.has_joined !== false,
      ).length;
      return {
        ...group,
        current_participants: approvedCount,
      };
    });

    return formattedGroups;
  },

  //Get group details (preview page)
  getGroupDetails: async (groupId, userId) => {
    const { data: group, error } = await supabase
      .from("groups")
      .select(
        `
        id,
        name,
        description,
        difficulty,
        visibility,
        cover_image_url,
        max_participants,
        status,
        created_at,
        creator:creator_id (id, full_name, nick_name, profile_image_url),
        skill:skill_id (id, name, icon_url),
        group_members (
          id,
          role,
          has_joined,
          user:user_id (id, full_name, nick_name, profile_image_url)
        )
      `,
      )
      .eq("id", groupId)
      .single();
    if (error || !group) {
      throw new Error("Group not found");
    }
    //Check user's membership status
    const userMembership = group.group_members.find(
      (m) => m.user.id === userId,
    );
    const approvedMembers = group.group_members.filter(
      (m) => m.has_joined === true,
    );
    const pendingMembers = group.group_members.filter(
      (m) => m.has_joined === false,
    );

    return {
      ...group,
      current_participants: approvedMembers.length,
      pending_requests: pendingMembers.length,
      is_full: approvedMembers.length >= group.max_participants,
      user_membership: userMembership
        ? {
            is_member: true,
            has_joined: userMembership.has_joined,
            role: userMembership.role,
          }
        : { is_member: false },
      members: approvedMembers,
      pending: pendingMembers,
    };
  },

  // Get all groups user is member of
  getMyGroups: async (userId, role) => {
    const { data: memberships, error } = await supabase
      .from("group_members")
      .select(
        `
        id,
        role,
        has_joined,
        joined_at,
        group:group_id (
          id,
          name,
          description,
          difficulty,
          visibility,
          cover_image_url,
          max_participants,
          status,
          skill:skill_id (id, name, icon_url),
          group_members (id, has_joined)
        )
      `,
      )
      .eq("user_id", userId)
      .eq("role", role)
      .order("joined_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    //Format response
    const formattedGroups = memberships.map((membership) => {
      const approvedCount = membership.group.group_members.filter(
        (m) => m.has_joined !== false,
      ).length;
      return {
        membership_id: membership.id,
        role: membership.role,
        has_joined: membership.has_joined,
        status: membership.has_joined ? "active" : "pending",
        ...membership.group,
        current_participants: approvedCount,
      };
    });
    return formattedGroups;
  },

  //Request to join group
  joinGroup: async (userId, groupId) => {
    const { data: group, error } = await supabase
      .from("groups")
      .select(
        "id, name, creator_id, max_participants, status, group_members(id, has_joined)",
      )
      .eq("id", groupId)
      .single();
    if (error || !group) {
      throw new Error("Group not found");
    }
    if (group.status !== "active") {
      throw new Error("This group is no longer active");
    }

    //Check if group is full
    const approvedCount = group.group_members.filter(
      (m) => m.has_joined === true,
    ).length;
    if (approvedCount >= group.max_participants) {
      throw new Error("This group is full");
    }

    //Create join request
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .insert([
        {
          group_id: groupId,
          user_id: userId,
          role: "learner",
          has_joined: false,
        },
      ])
      .select()
      .single();
    if (memberError) {
      throw new Error(`Failed to join group: ${memberError.message}`);
    }

    //Get user info for notification
    const { data: user } = await supabase
      .from("users")
      .select("full_name, nick_name")
      .eq("id", userId)
      .single();

    const displayName = user.nick_name || user.full_name;
    await createNotification({
      related_entity_type: "group",
      related_entity_id: groupId,
      sender_id: userId,
      recipient_id: group.creator_id,
      title: "New Join Request",
      message: `${displayName} wants to join your group "${group.name}".`,
    });

    return membership;
  },

  //Approve member join request (teacher only)
  approveMember: async (teacherId, groupId, memberId) => {
    // Get Group info
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id,name,creator_id")
      .eq("id", groupId)
      .single();
    if (groupError || !group) {
      throw new Error("Group not found");
    }
    if (group.creator_id !== teacherId) {
      throw new Error("Only the group creator can approve members");
    }

    // Get member info
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("id, user_id, has_joined")
      .eq("id", memberId)
      .eq("group_id", groupId)
      .single();
    if (memberError || !membership) {
      throw new Error("Member not found");
    }
    if (membership.has_joined) {
      throw new Error("Member is already approved");
    }

    const { data: updated, error: updateError } = await supabase
      .from("group_members")
      .update({ has_joined: true })
      .eq("id", memberId)
      .select()
      .single();
    if (updateError) {
      throw new Error(`Failed to approve member: ${updateError.message}`);
    }

    // Notify the user
    await createNotification({
      related_entity_type: "group",
      related_entity_id: groupId,
      sender_id: teacherId,
      recipient_id: membership.user_id,
      title: "Join Request Approved",
      message: `Your request to join "${group.name} has been approved!`,
    });
    return updated;
  },

  //Reject member join request (teacher only)
  rejectMember: async (teacherId, groupId, memberId) => {
    // Verify teacher is the creator
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== teacherId) {
      throw new Error("Only the group creator can reject members");
    }

    // Delete member request
    const { error: deleteError } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId)
      .eq("group_id", groupId)
      .eq("has_joined", false);

    if (deleteError) {
      throw new Error(`Failed to reject member: ${deleteError.message}`);
    }

    return { message: "Member request rejected" };
  },

  //Leave group
  leaveGroup: async (userId, groupId) => {
    // Check if user is the creator
    const { data: group } = await supabase
      .from("groups")
      .select("creator_id")
      .eq("id", groupId)
      .single();
    if (group && group.creator_id === userId) {
      throw new Error("Group creator cannot leave. Delete the group instead.");
    }
    // Remove user from group
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to leave group: ${error.message}`);
    }

    return { message: "Successfully left the group" };
  },

  //Update group (teacher only)
  updateGroup: async (teacherId, groupId, updateData, coverImageFile) => {
    // Verify teacher is the creator
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== teacherId) {
      throw new Error("Only the group creator can update the group");
    }

    // Handle cover image upload if provided
    if (coverImageFile) {
      const coverImageUrl = await uploadToSupabase(coverImageFile, "avatars");
      updateData.cover_image_url = coverImageUrl;
    }
    // Update group
    const { data: updatedGroup, error: updateError } = await supabase
      .from("groups")
      .update(updateData)
      .eq("id", groupId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update group: ${updateError.message}`);
    }

    return updatedGroup;
  },

  //Delete group (teacher only)
  deleteGroup: async (teacherId, groupId) => {
    // Verify teacher is the creator
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== teacherId) {
      throw new Error("Only the group creator can delete the group");
    }
    // Delete group (cascades to group_members due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      throw new Error(`Failed to delete group: ${deleteError.message}`);
    }

    return { message: "Group deleted successfully" };
  },
  // Get user's skill info (for skill detail page)
  getUserSkillInfo: async (userId, userSkillId) => {
    const { data: userSkill, error } = await supabase
      .from("user_skills")
      .select(
        `
      id,
      role,
      proficiency_level,
      is_favorite,
      skills (id, name, icon_url)
    `,
      )
      .eq("id", userSkillId)
      .eq("user_id", userId)
      .single();

    if (error || !userSkill) {
      throw new Error("Skill not found");
    }

    return userSkill;
  },
  removeGroupMember: async (userId, memberId, groupId) => {
    //Check that the user is the owner of the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== userId) {
      throw new Error("Only the group creator can remove a member");
    }

    // Check that the member is in the group
    const { data: member, error } = await supabase
      .from("group_members")
      .select(`id,user_id,role,has_joined, group:groups(name)`)
      .eq("id", memberId)
      .eq("has_joined", true)
      .eq("group_id", groupId)
      .single();
    if (error || !member) {
      throw new Error(`The user is not a member of the group`);
    }
    // Remove the member
    const { error: deleteError } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId)
      .eq("group_id", groupId);
    if (deleteError) {
      throw new Error(`Could not remove the member: ${deleteError.message}`);
    }

    return {
      message: `Member successfully removed from the group: ${member.group.name} `,
    };
  },
  getGroupMembers: async (userId, groupId) => {
    //Check that the user is the owner of the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== userId) {
      throw new Error("Only the group creator can retrieve the members");
    }

    // Get a list of the group_members
    const { data: groupMembers, error } = await supabase
      .from("group_members")
      .select(`id, user:users(full_name, nick_name, profile_image_url) `)
      .eq("has_joined", true)
      .eq("group_id", groupId)
      .eq("role", "learner");
    if (error) {
      throw new Error(
        `Could not retrieve group participants: ${error.message}`,
      );
    }
    if (groupMembers.length === 0) {
      return { message: "The group has no participants." };
    }
    const users = groupMembers.map((m) => m.user);
    return users;
  },
  getFriendsWithInterest: async (userId, groupId) => {
    //Check that the user is the owner of the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id, difficulty, skill:skills(id)")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== userId) {
      throw new Error(
        "Only the group creator can get a list of friends with interest",
      );
    }

    //Get List of friends
    const { data: friendsWithInterest, error } = await supabase
      .from("user_skills")
      .select(
        "id, user:users!user_id(id,full_name,nick_name,profile_image_url),role,skill_id, proficiency_level",
      )
      .eq("skill_id", group.skill.id)
      .eq("role", "learner");

    if (error) {
      throw new Error(
        `Failed to retrieve the list of friends: ${error.message}`,
      );
    }
    if (friendsWithInterest.length === 0) {
      return {
        message: "You have no friends who have an interest in this skill",
      };
    }

    // Get the user's friends
    const friends = await friendService.getAllFriends(userId);
    const friendIds = friends.map((f) => f.friend.id);

    //Filter out to keep only those who are the user's friends
    const finalFriendsWithInterest = friendsWithInterest.filter((f) =>
      friendIds.includes(f.user.id),
    );

    //Change the proficiency_level to difficulty (from number to text)
    const enriched = finalFriendsWithInterest.map((f) => ({
      ...f,
      difficulty: mapProficiencyToDifficulties(f.proficiency_level),
    }));

    // Final filtering to include friends with the desired difficulty
    return enriched.filter((f) => f.difficulty.includes(group.difficulty));
  },

  //Search among the list of teacher's friends who have an interest in the skill and can become members
  searchPossibleMembers: async (userId, groupId, q) => {
    const list = await groupService.getFriendsWithInterest(userId, groupId);

    //Search users by full_name or nick_name
    const searchedUsers = list.filter((u) => {
      const name = u.user.full_name?.toLowerCase() || "";
      const nickname = u.user.nick_name?.toLowerCase() || "";
      const query = q.toLowerCase();

      return name.includes(query) || nickname.includes(query);
    });

    if (searchedUsers.length === 0) {
      return { message: "No such users exists" };
    }
    return searchedUsers;
  },

  //Send notification to group members
  sendNotidicationToMembers: async (userId, groupId, data) => {
    //Check that the user is the owner of the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id, difficulty, skill:skills(id)")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    if (group.creator_id !== userId) {
      throw new Error(
        "Only the group creator can send notifications to group members",
      );
    }
    //Collect the id's of the group_members of the group
    const { data: groupMemberIds, error } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("has_joined", true)
      .eq("group_id", groupId)
      .eq("role", "learner");
    if (error) {
      throw new Error(`Failed to select group members: ${error.message}`);
    }
    if (groupMemberIds.length === 0) {
      return { message: "No group members exist." };
    }
    const recipients = groupMemberIds.map((m) => m.user_id);
    const title = data.title;
    const message = data.message;
    await createNotification({
      related_entity_type: "Group General",
      related_entity_id: groupId,
      sender_id: userId,
      recipient_id: recipients,
      title: title,
      message: message,
    });

    return { message: "Notifications sent successfully to the group members" };
  },
};
module.exports = groupService;

/*
1-createGroup: check if the user has the skill, store the group image in the 'avatars' bucket and get the url. If no image is provided, get the skill image url (fallback).
Create the group and insert the creator as a teacher group member.
2-getAvailableGroupsForLearner: Get the proficiency skill, map it to a string, get the groups to be excluded (the user has already joined them or is intending to join), get the
groups that are public, active, match the skill, and the difficulty, exclude from them the excluded groups, exclude the groups that are full.
3-getTeacherGroups: Get the groups in which the creator is the user and ther skill matches with the skill selected. Then filter the group_members by those who have has_joined = true and return 
the count of the participants , in addition to the group_info.
4-getGroupDetails: Gets the details of the group and its participants. Checks if the user is a member inside it. Calculates the number of members, the number of pending requests.
5-getMyGroups:Selects the information about the groups the user has joined, as well as information about the active users inside it.
6-joinGroup: First check if the group is still active and not full and then create a join request by inserting the user as a group_member but with has_joined being false and sending a notification
to the creator of the group indicating that this specific user is requesting to join.
7-approveMember: First get the group info and check if the creator is the teacher, the one to approve. Then get the group_member info and check if he has already joined. Then put has_joined to true
and send notification to the user.
8-rejectMember: First, verify that the teacher is the creator of the group. Then , delete the group_member row in the group_members table.
9-leaveGroup: Disallow the creator of the group from leaving it, and for other users deleting the row in the group_members table does the job.
10-updateGroup: First, verify that the teacher is the creator of the group. then handle the update of the image ( uploading the new image to the bucket). then updating the group info.
11-deleteGroup: Check if the teacher is the creator of the group, and if so delete the group (cascades to the deletion of the group_members).
12-getuserSkillInfo: When clicking on a skill in the HomePage, this service gets the info of the skill.
13-removeGroupMember: This service checks that the removes it the owner of the group, checks that the member is actually in the group and deletes or removes the member from the 'group_members'
table.
14-getGroupMembers: This service checks that the requester is the group creator, and retrieves the group members of a particular group.
15-getFriendsWithInterest: This service fetches a list of users who are friends with the creator of the group (teacher), who have assigned to themselves the same skill as the one of the group, and with
proficiency_level similar to the group difficulty.
16-searchPossibleMembers: Retrieves the teacher's list of friends who are not members but have an interest and can become members, and applies a search query on them.
17-sendNotidicationToMembers: This service sends individual notifications to the group members of a group.
*/
