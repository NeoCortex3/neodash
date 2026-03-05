import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { services } from "@/lib/schema";

export type Service = InferSelectModel<typeof services>;
export type NewService = InferInsertModel<typeof services>;

export type ServiceFormData = {
  name: string;
  url: string;
  icon: string;
  color: string;
  glassEffect: boolean;
};
