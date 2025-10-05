import Constants from "expo-constants";
import { jwtDecode } from "jwt-decode";
import { deleteSecureData, getSecureData, saveSecureData } from "./storage";

// decode JWT token
export const decodeToken = (token: string) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

// check if token is valid
export const isAccessTokenValid = async (): Promise<boolean> => {
  const accessToken = await getSecureData("accessToken");
  if (!accessToken) return false;

  const decoded = decodeToken(accessToken as string);
  if (!decoded || !decoded.exp) return false;

  const currentTime = Date.now() / 1000; // in seconds
  const exp = Number(decoded.iat) + 300;
  if (exp < currentTime) {
    try {
      // call api refresh
      const refreshToken = await getSecureData("refreshToken");

      const response = await fetch(
        Constants.expoConfig?.extra?.env.REFRESH_TOKEN_URL as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: refreshToken }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // save new access token and refresh token
        await saveSecureData({ key: "accessToken", value: data.accessToken });
        await saveSecureData({ key: "refreshToken", value: data.refreshToken });

        // console.log("access:", data.accessToken);
        // console.log("refresh:", data.refreshToken);

        return true;
      } else {
        // remove tokens
        await deleteSecureData("accessToken");
        await deleteSecureData("refreshToken");

        console.log("Tokens removed");

        return false;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      await deleteSecureData("accessToken");
      await deleteSecureData("refreshToken");
    }

    return false;
  }

  return true;
};
