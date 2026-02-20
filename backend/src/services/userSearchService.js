/* This file is to search a user, get recent searches, add a recent search, remove 
a recenet search, clear all searches*/
const supabase = require("../config/database");

const userSearchService = {
  //Search users by full_name or nick_name
  searchUsers: async (currentUserId, query) => {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, full_name, nick_name,profile_image_url, biography")
      .neq("id", currentUserId)
      .or(`full_name.like.%${query}%,nick_name.like.%${query}%`)
      .limit(20);
    if (error) {
      throw new Error(`Search Failed: ${error.message}`);
    }
    console.log("Data is", users);
    return users;
  },
  //Get recent searches of a user
  getRecentSearches: async (userId) => {
    const { data, error } = await supabase
      .from("recent_searches")
      .select(
        `
        id,
        created_at,
        searched_user:searched_user_id (
          id,
          full_name,
          nick_name,
          profile_image_url,
          biography
        )
      `,
      )
      .eq("searcher_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) {
      throw new Error(`Failed to fetch recent searches : ${error.message}`);
    }
    return data;
  },

  //Save or update a recent search
  saveRecentSearch: async (searcherId, searchedUserId) => {
    const { data, error } = await supabase
      .from("recent_searches")
      .upsert(
        {
          searcher_id: searcherId,
          searched_user_id: searchedUserId,
          created_at: new Date().toISOString(),
        },
        { onConflict: "searcher_id,searched_user_id" },
      )
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to save recent search: ${error.message}`);
    }
    return data;
  },

  //Remove one recent search
  removeRecentSearch: async (searcherId, searchedUserId) => {
    const { error } = await supabase
      .from("recent_searches")
      .delete()
      .eq("searcher_id", searcherId)
      .eq("searched_user_id", searchedUserId);
    if (error) {
      throw new Error(`Failed to remove recent search: ${error.message}`);
    }
  },

  //Clear all recent searches
  clearRecentSearches: async (userId) => {
    const { error } = await supabase
      .from("recent_searches")
      .delete()
      .eq("searcher_id", userId);
    if (error) {
      throw new Error(`Failed to clear recent searches: ${error.message}`);
    }
  },
};
module.exports = userSearchService;

/*
1- searchUsers: searches up users from the 'users' table by checking the query against either
the fullname or the nickname of a user. the ilike is for case-insensitive checking.
2- getRecentSearches: Get a list of searches a user has made.
3- saveRecentSearch: Add a new search to the list of previous searches done by a user.
4- removeRecentSearch: remove a search from the list of done searches.
5- clearRecenetSearches: Clear all recent searches of a user.
*/
