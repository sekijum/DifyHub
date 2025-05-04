export interface MyProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "ADMINISTRATOR" | "DEVELOPER" | "USER"; // Role Enum
  planName: string;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  status: string; // UserStatus Enum
  developerStatus: 'UNSUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}
