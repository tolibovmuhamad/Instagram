import { z } from "zod";

export const genderOptions = [
  { value: "Male", label: "Мужской" },
  { value: "Female", label: "Женский" },
] as const;

// Бэкенд реально сохраняет только about и gender — остальные поля профиля
// (firstName/lastName/occupation/dob/locationId) в UpdateUserProfileDto отсутствуют
// и через API не редактируются, поэтому форма редактирования ограничена этими двумя.
export const updateProfileSchema = z.object({
  about: z.string().max(500, "Слишком длинное описание"),
  gender: z.enum(["Male", "Female"]),
});
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
