export const userKeys = {
  all: ["users"] as const,
  adminList: (page = 1, limit = 10) => [...userKeys.all, "adminList", page, limit] as const,
};
