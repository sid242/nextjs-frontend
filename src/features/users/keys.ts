export const userKeys = {
  all: ["users"] as const,
  adminList: (page = 1) => [...userKeys.all, "adminList", page] as const,
};
