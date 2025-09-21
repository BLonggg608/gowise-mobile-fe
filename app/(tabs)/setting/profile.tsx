// Profile screen for user information and editing
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

// Initial profile data (should be fetched from API in real app)
const initialProfile = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@email.com",
  phone: "",
  bio: "",
};

const Profile = () => {
  // State for profile data
  const [profile, setProfile] = useState(initialProfile);
  // State for edit mode
  const [editing, setEditing] = useState(false);

  // Handle input changes for each field
  const handleChange = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // Save profile changes (call API here)
  const handleSave = () => {
    setEditing(false);
    // TODO: Call API to update profile with 'profile' state
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header row with title and edit/cancel button */}
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setEditing((e) => !e)}>
          <View style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.GREEN} />
            <Text style={styles.editText}>{editing ? "Cancel" : "Edit"}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.profileContainer}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.memberText}>Premium Member</Text>
              <Text style={styles.memberSince}>Member since January 2024</Text>
            </View>
          </View>
        </View>

        {/* Card container for profile info and form */}
        <View style={styles.card}>
          {/* Form fields for profile info */}
          <View style={styles.formRow}>
            {/* First Name */}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={profile.firstName}
                editable={editing}
                onChangeText={(v) => handleChange("firstName", v)}
                placeholder="First Name"
                placeholderTextColor={Colors.GRAY}
              />
            </View>

            {/* Last Name */}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={profile.lastName}
                editable={editing}
                onChangeText={(v) => handleChange("lastName", v)}
                placeholder="Last Name"
                placeholderTextColor={Colors.GRAY}
              />
            </View>
          </View>
          {/* <View style={styles.formRow}> */}
          {/* Email */}
          <View style={styles.inputCol}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              editable={editing}
              onChangeText={(v) => handleChange("email", v)}
              placeholder="Email"
              placeholderTextColor={Colors.GRAY}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputCol}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              editable={editing}
              onChangeText={(v) => handleChange("phone", v)}
              placeholder="Phone"
              placeholderTextColor={Colors.GRAY}
              keyboardType="phone-pad"
            />
          </View>
          {/* </View> */}
          <View style={styles.inputColFull}>
            {/* Bio */}
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.inputBio}
              value={profile.bio}
              editable={editing}
              onChangeText={(v) => handleChange("bio", v)}
              placeholder="Bio"
              placeholderTextColor={Colors.GRAY}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save button only shown in edit mode */}
          {editing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
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
    borderBottomColor: "#eee",
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eafcf7",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
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
    color: Colors.GREEN,
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
  inputCol: {
    flex: 1,
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
    backgroundColor: "#f2fef7ff",
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
    backgroundColor: "#f2fef7ff",
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
