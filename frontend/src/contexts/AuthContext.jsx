import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setUserProfile(null);
      setAuthError("");

      if (!firebaseUser) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function register({ email, password, displayName, role }) {
    let createdUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      createdUser = userCredential.user;

      await updateProfile(createdUser, { displayName });

      const profile = await saveUserProfile({
        uid: createdUser.uid,
        email: createdUser.email,
        displayName,
        role: role || "buyer",
      });

      setCurrentUser(createdUser);
      setUserProfile(profile);
      setAuthError("");

      return profile;
    } catch (error) {
      if (createdUser) {
        await rollbackCreatedUser(createdUser);
      }

      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const profile = await fetchUserProfile(userCredential.user.uid);

    setCurrentUser(userCredential.user);
    setUserProfile(profile);
    setAuthError("");

    return profile;
  }

  async function logout() {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setAuthError("");
  }

  async function refreshUserProfile() {
    if (!auth.currentUser) {
      setUserProfile(null);
      return null;
    }

    const profile = await fetchUserProfile(auth.currentUser.uid);
    setUserProfile(profile);
    setAuthError("");
    return profile;
  }

  async function requestDealerApproval() {
    if (!currentUser) {
      throw new Error("로그인 후 딜러 신청을 할 수 있습니다.");
    }

    const response = await fetch("/api/users/dealer-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterUid: currentUser.uid }),
    });

    if (!response.ok) {
      const message = await getApiErrorMessage(
        response,
        "딜러 신청을 처리하지 못했습니다.",
      );
      throw new Error(message);
    }

    const profile = await response.json();
    setUserProfile(profile);
    return profile;
  }

  const value = useMemo(
    () => ({
      authError,
      currentUser,
      isAuthLoading,
      isAdmin: userProfile?.role === "admin",
      isDealer:
        userProfile?.role === "dealer" &&
        userProfile?.dealerStatus === "approved",
      login,
      logout,
      refreshUserProfile,
      register,
      requestDealerApproval,
      userProfile,
    }),
    [authError, currentUser, isAuthLoading, userProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth는 AuthProvider 안에서 사용해야 합니다.");
  }

  return context;
}

async function fetchUserProfile(uid) {
  const response = await fetch(`/api/users/me?uid=${encodeURIComponent(uid)}`);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      "사용자 정보를 조회하지 못했습니다.",
    );
    throw new Error(message);
  }

  return response.json();
}

async function saveUserProfile(profileInput) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileInput),
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      "사용자 정보를 저장하지 못했습니다.",
    );
    throw new Error(message);
  }

  return response.json();
}

async function rollbackCreatedUser(user) {
  try {
    await deleteUser(user);
  } catch (error) {
    throw new Error(
      `${getFirebaseErrorMessage(error)} Firebase 계정 삭제 보정도 실패했습니다. Firebase 콘솔에서 계정 상태를 확인해주세요.`,
    );
  }
}

async function getApiErrorMessage(response, fallbackMessage) {
  try {
    const errorData = await response.json();
    return errorData.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
}

function getFirebaseErrorMessage(error) {
  const code = error.code || "";

  if (code === "auth/email-already-in-use") {
    return "이미 가입된 이메일입니다.";
  }
  if (code === "auth/invalid-email") {
    return "이메일 형식이 올바르지 않습니다.";
  }
  if (code === "auth/weak-password") {
    return "비밀번호는 6자 이상으로 입력해주세요.";
  }
  if (code === "auth/invalid-credential") {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (code === "auth/configuration-not-found") {
    return "Firebase Authentication 설정을 확인해주세요.";
  }

  return error.message || "인증 요청을 처리하지 못했습니다.";
}
