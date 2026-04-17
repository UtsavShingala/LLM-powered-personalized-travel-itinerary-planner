"use client";

import { create } from "zustand";

type User = { id: string; name: string; email: string } | null;

type AuthState = {
  token: string | null;
  user: User;
  setAuth: (token: string, user: NonNullable<User>) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  }
}));
