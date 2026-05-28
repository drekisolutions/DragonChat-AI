/**
 * useUserProfile — loads the user's profile from AsyncStorage and exposes
 * helpers for building personalized Marcus greetings.
 */
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { USER_PROFILE_KEY, type UserProfile } from "@/app/onboarding";

const DEFAULT_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  company: "Dreki Solutions",
  title: "",
  greeting: "formal",
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (raw) {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
      }
    } catch {
      // use defaults
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Returns the address Marcus should use for this user, e.g. "Mr. Johnson", "Alex", or "Alex" */
  const addressName = (() => {
    if (!profile.firstName) return "";
    if (profile.greeting === "formal" && profile.lastName) {
      return profile.lastName;
    }
    return profile.firstName;
  })();

  /** Returns the opening salutation Marcus should use */
  const salutation = (() => {
    if (!profile.firstName) return "";
    switch (profile.greeting) {
      case "formal":
        return profile.lastName
          ? `Good morning, ${profile.firstName[0]}. ${profile.lastName}`
          : `Good morning, ${profile.firstName}`;
      case "casual":
        return `Hey ${profile.firstName}`;
      case "direct":
        return profile.firstName;
      default:
        return profile.firstName;
    }
  })();

  /** Returns a system prompt fragment that instructs Marcus how to address the user */
  const systemPromptFragment = (() => {
    if (!profile.firstName) return "";
    const name = profile.firstName + (profile.lastName ? ` ${profile.lastName}` : "");
    const titleStr = profile.title ? `, ${profile.title}` : "";
    const companyStr = profile.company ? ` at ${profile.company}` : "";
    const styleMap: Record<UserProfile["greeting"], string> = {
      formal: `Address them formally as "${profile.firstName[0]}. ${profile.lastName || profile.firstName}". Use professional language.`,
      casual: `Address them casually by first name "${profile.firstName}". Use a warm, friendly tone.`,
      direct: `Address them directly by first name "${profile.firstName}" with no pleasantries. Be concise and action-oriented.`,
    };
    return `The user's name is ${name}${titleStr}${companyStr}. ${styleMap[profile.greeting]}`;
  })();

  return {
    profile,
    loaded,
    reload: load,
    addressName,
    salutation,
    systemPromptFragment,
  };
}
