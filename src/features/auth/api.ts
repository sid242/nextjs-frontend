import { authApi } from "@/lib/api/http";
import type { User } from "@/lib/api/types";
import type { LoginValues, RegisterValues } from "./schemas";

// These hit our own Next.js BFF routes (/api/auth/*), which keep tokens in httpOnly cookies.
export const login = (values: LoginValues) => authApi.post<{ user: User }>("/login", values);
export const register = (values: RegisterValues) =>
  authApi.post<{ user: User }>("/register", values);
export const logout = () => authApi.post("/logout");
