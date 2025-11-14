// Profile screen for user information and editing
import { Colors } from "@/constant/Colors";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

const statusBarHeight = Constants.statusBarHeight;

type profileType = {
  isPremium: boolean;
  createdAt: string;
  firstName: string;
  lastName: string;
  bio: string;
};

// Initial profile data (should be fetched from API in real app)
const initialProfile = {
  isPremium: true,
  createdAt: "2025-10-08T10:14:06.312546",
  firstName: "Nguyễn",
  lastName: "Văn A",
  bio: "",
};

const Profile = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  // State for profile data
  const [profile, setProfile] = useState<profileType>(initialProfile);
  // State for edit mode
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserIdFromToken();
      setUserId(id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) getProfile(userId);
  }, [userId]);

  const getProfile = async (uid: string) => {
    // Fetch profile data from API
    try {
      const response = await fetch(
        Constants.expoConfig?.extra?.env.USER_URL + `/${uid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProfile({
          isPremium: data.data.isPremium,
          createdAt: data.data.createdAt,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          bio: data.data.bio || "",
        });
      } else {
        console.error("Failed to fetch profile", data.message);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  // Handle input changes for each field
  const handleChange = (field: keyof profileType, value: string | boolean) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Save profile changes (call API here)
  const handleSave = async () => {
    // TODO: Call API to update profile with 'profile' state
    if (!userId) return;
    try {
      const response = await fetch(
        Constants.expoConfig?.extra?.env.USER_URL + `/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: profile.firstName,
            lastName: profile.lastName,
            // bio: profile.bio,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEditing(false);
        Toast.show({
          type: "success",
          text1: "Update successful!",
          text2: "Your profile has been updated.",
        });
      } else {
        console.error("Failed to update profile", data.message);
      }
    } catch {
      console.error("Failed to update profile");
    }
  };

  const handleToggleEdit = () => {
    setEditing((e) => !e);
    if (editing && userId) {
      getProfile(userId); // reload from API when cancel
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {/* Header row with title and edit/cancel button */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
          </TouchableOpacity>
          <Text style={styles.cardTitle}>Hồ sơ cá nhân</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.profileContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={handleToggleEdit}>
          <View
            style={[styles.editBtn, editing && { backgroundColor: Colors.RED }]}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={editing ? Colors.WHITE : Colors.GREEN}
            />
            <Text style={[styles.editText, editing && { color: Colors.WHITE }]}>
              {editing ? "Huỷ" : "Chỉnh sửa"}
            </Text>
          </View>
        </TouchableOpacity>
        {/* Card container for profile info and form */}
        <View style={styles.card}>
          {/* User avatar and basic info */}
          <View style={styles.infoRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile.firstName.charAt(0)}
                {profile.lastName.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nameText}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text
                style={[
                  styles.memberText,
                  !profile.isPremium && { color: Colors.GREEN },
                ]}
              >
                {profile.isPremium
                  ? "Thành viên Premium"
                  : "Thành viên miễn phí"}
                {profile.isPremium && (
                  <MaterialCommunityIcons
                    name="crown-outline"
                    size={13}
                    color={Colors.YELLOW}
                  />
                )}
              </Text>
              <Text style={styles.memberSince}>
                {/* month but in words */}
                Thành viên từ{" "}
                {new Date(profile.createdAt).toLocaleString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Card container for profile info and form */}
        <View style={styles.card}>
          {/* Form fields for profile info */}
          <View style={styles.formRow}>
            {/* First Name */}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Họ</Text>
              <TextInput
                style={styles.input}
                value={profile.firstName}
                editable={editing}
                onChangeText={(v) => handleChange("firstName", v)}
                placeholder="Họ"
                placeholderTextColor={Colors.GRAY}
              />
            </View>

            {/* Last Name */}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Tên</Text>
              <TextInput
                style={styles.input}
                value={profile.lastName}
                editable={editing}
                onChangeText={(v) => handleChange("lastName", v)}
                placeholder="Tên"
                placeholderTextColor={Colors.GRAY}
              />
            </View>
          </View>

          <View style={styles.inputColFull}>
            {/* Bio */}
            <Text style={styles.label}>Giới thiệu</Text>
            <TextInput
              style={styles.inputBio}
              value={profile.bio}
              editable={editing}
              onChangeText={(v) => handleChange("bio", v)}
              placeholder="Giới thiệu bản thân"
              placeholderTextColor={Colors.GRAY}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save button only shown in edit mode */}
          {editing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Lưu</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;

// Styles for profile screen, responsive and consistent with app theme
const styles = StyleSheet.create({
  profileContainer: {
    flexGrow: 1,
    padding: 18,
  },
  card: {
    backgroundColor: "#f8fafb",
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#9c9c9c1e",
  },
  cardTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  editBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#eafcf7",
    backgroundColor: Colors.GREEN + "40",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  editText: {
    color: Colors.GREEN,
    fontSize: 15,
    fontFamily: "inter-medium",
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  avatarText: {
    color: Colors.WHITE,
    fontSize: 22,
    fontFamily: "inter-medium",
  },
  nameText: {
    fontSize: 17,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 2,
  },
  memberText: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.YELLOW,
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  inputColFull: {
    width: "100%",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f0f0f0ff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 2,
  },
  inputBio: {
    backgroundColor: "#f0f0f0ff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: Colors.GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontFamily: "inter-medium",
  },
});
