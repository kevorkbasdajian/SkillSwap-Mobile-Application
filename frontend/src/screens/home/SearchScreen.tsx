import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { searchAPI } from "@/src/services/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, TabParamList } from "@/src/navigation/types";

export default function SearchScreen() {
  //Interface for searched User
  interface SearchedUser {
    id: string;
    full_name: string;
    nick_name?: string;
    profile_image_url?: string;
    biography?: string;
  }
  //Interface for a Recent Search
  interface RecentSearch {
    id: number;
    created_at: string;
    searched_user: SearchedUser;
  }

  //type for navigation
  type searchScreenNavigationProp =
    NativeStackNavigationProp<RootStackParamList>;

  //---------------Constants-----------
  //For navigation
  const navigation = useNavigation<searchScreenNavigationProp>();
  //Store Recent Searches
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  //Store search query
  const [searchQuery, setSearchQuery] = useState("");
  //Store search results
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  //For loading recent searches
  const [isLoadingRecent, setisLoadingRecent] = useState(true);
  //For searching state
  const [isSearching, setIsSearching] = useState(false);

  //for storing timeout for debounced searching
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  //for error handling
  const toast = useErrorToast();

  //---------------Hooks-----------
  // Load recent searches on mount and when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadRecentSearches();
    }, []),
  );

  //Debounced search when query changes
  useEffect(() => {
    //Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    //If query is empty, don't search
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    //Set searching state immediately
    setIsSearching(true);

    //Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 500);

    //Clean timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  //---------------Functions-----------
  //This function fetches and stores recent searches in a variable
  const loadRecentSearches = async () => {
    setisLoadingRecent(true);
    try {
      const response = await searchAPI.getRecentSearches();
      if (response.success) {
        setRecentSearches(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load recent searches", error);
    } finally {
      setisLoadingRecent(false);
    }
  };

  //This function performs search
  const performSearch = async (query: string) => {
    try {
      const response = await searchAPI.searchUsers(query);
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error: any) {
      toast.showError(`Search failed. Please try again`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  //This function saved a search once a user clicks on a profile
  const handleUserClick = async (user: SearchedUser) => {
    try {
      await searchAPI.saveRecentSearch(user.id);
      loadRecentSearches();
    } catch (error) {
      console.error("Failed to save recent search:", error);
    }

    navigation.navigate("UserProfile", { userId: user.id });
  };

  //This function is to remove recent search
  const handleRemoveRecent = async (searchId: number, userId: string) => {
    try {
      await searchAPI.removeRecentSearch(userId);
      //Remove from local state
      setRecentSearches(
        recentSearches.filter((search) => search.id !== searchId),
      );
    } catch (error: any) {
      toast.showError("Failed to remove search");
    }
  };

  //This function removes all searches
  const handleClearAll = async () => {
    try {
      await searchAPI.clearRecentSearches();
      setRecentSearches([]);
    } catch (error: any) {
      toast.showError("Failed to clear searches");
    }
  };

  //UI for every recent search
  const renderUserCard = (
    user: SearchedUser,
    isRecent: boolean = false,
    searchId?: number,
  ) => {
    const displayName = user.nick_name || user.full_name;
    const briefBio = user.biography
      ? user.biography.length > 50
        ? user.biography.substring(0, 50) + "..."
        : user.biography
      : "No bio available";
    return (
      <TouchableOpacity
        key={isRecent ? `recent-${searchId}` : `result-${user.id}`}
        style={styles.userCard}
        onPress={() => handleUserClick(user)}
        activeOpacity={0.7}
      >
        <Image
          source={
            user.profile_image_url
              ? { uri: user.profile_image_url }
              : require("../../assets/images/Avatar.png")
          }
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userBio}>{briefBio}</Text>
        </View>
        {isRecent && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Prevent card click
              handleRemoveRecent(searchId!, user.id);
            }}
            style={styles.removeButton}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={COLORS.skinToneOrange}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };
  const showingResults = searchQuery.trim().length >= 2;
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={24}
          color={COLORS.midBlack}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={COLORS.midBlack}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={COLORS.midBlack}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showingResults ? (
          // Search Results
          <>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.midBlue} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Results</Text>
                  <Text style={styles.resultCount}>
                    {searchResults.length} users
                  </Text>
                </View>
                {searchResults.map((user) => renderUserCard(user, false))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="account-search-outline"
                  size={80}
                  color={COLORS.darkBlue}
                />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching with a different name
                </Text>
              </View>
            )}
          </>
        ) : (
          // Recent Searches
          <>
            {isLoadingRecent ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.midBlue} />
              </View>
            ) : recentSearches.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <TouchableOpacity onPress={handleClearAll}>
                    <Text style={styles.clearAllButton}>Clear all</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((search) =>
                  renderUserCard(search.searched_user, true, search.id),
                )}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="history"
                  size={80}
                  color={COLORS.darkBlue}
                />
                <Text style={styles.emptyText}>No recent searches</Text>
                <Text style={styles.emptySubtext}>
                  Search for users to see them here
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      <ErrorToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={toast.hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.midBlue,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    paddingVertical: SPACING.md,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  clearAllButton: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.skinToneOrange,
  },
  resultCount: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.8,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightBlue,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginBottom: 2,
  },
  userBio: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.massive,
  },
  loadingText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.massive,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
});
