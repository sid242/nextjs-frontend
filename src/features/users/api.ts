import { api } from "@/lib/api/http";
import type { User } from "@/lib/api/types";
import type { ProfileValues } from "./schemas";

export const updateMe = (values: ProfileValues) => api.patch<User>("/users/me", values);
