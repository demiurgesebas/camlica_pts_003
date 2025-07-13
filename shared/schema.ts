import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  time,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  password: varchar("password"),
  role: varchar("role").notNull().default("personnel"), // super_admin, admin, personnel
  permissions: jsonb("permissions").$type<string[]>().default([]), // Array of menu permissions
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Branches table
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  managerId: varchar("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name").notNull(),
  description: text("description"),
  managerId: integer("manager_id").references(() => personnel.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  branchId: integer("branch_id").references(() => branches.id),
  leaderId: integer("leader_id").references(() => personnel.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Personnel table
export const personnel = pgTable("personnel", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  branchId: integer("branch_id").references(() => branches.id),
  departmentId: integer("department_id").references(() => departments.id),
  shiftId: integer("shift_id").references(() => shifts.id),
  teamId: integer("team_id").references(() => teams.id),
  employeeNumber: varchar("employee_number").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  position: varchar("position"),
  department: varchar("department"),
  hireDate: date("hire_date"),
  birthDate: date("birth_date"),
  tcNo: varchar("tc_no"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact"),
  emergencyPhone: varchar("emergency_phone"),
  salary: decimal("salary"),
  annualLeaveEntitlement: integer("annual_leave_entitlement").default(20), // Yıllık izin hakkı
  usedAnnualLeave: integer("used_annual_leave").default(0), // Kullanılan yıllık izin
  remainingAnnualLeave: integer("remaining_annual_leave").default(20), // Kalan yıllık izin
  carryOverLeave: integer("carry_over_leave").default(0), // Devreden izin
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shifts table
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift assignments table
export const shiftAssignments = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").references(() => personnel.id),
  shiftId: integer("shift_id").references(() => shifts.id),
  assignedDate: date("assigned_date").notNull(),
  date: varchar("date", { length: 10 }), // Excel import için ek tarih field'ı
  shiftType: varchar("shift_type", { length: 20 }), // morning, evening, off, working
  status: varchar("status").default("active"), // active, completed, absent
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave requests table
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").references(() => personnel.id),
  leaveType: varchar("leave_type").notNull(), // annual, sick, maternity, unpaid
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: varchar("status").default("pending"), // pending, approved, rejected
  requestedBy: varchar("requested_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR codes table
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id),
  code: varchar("code").notNull().unique(),
  screenId: varchar("screen_id"), // Ekran ID'si için
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").references(() => personnel.id),
  date: date("date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  qrCodeId: integer("qr_code_id").references(() => qrCodes.id),
  qrScreenId: integer("qr_screen_id").references(() => qrScreens.id),
  location: varchar("location"),
  status: varchar("status").default("present"), // present, absent, late, early_leave
  notes: text("notes"), // Ekran bilgisi ve ek notlar
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Personnel Documents table
export const personnelDocuments = pgTable("personnel_documents", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").references(() => personnel.id).notNull(),
  documentType: varchar("document_type").notNull(), // cv, id_copy, address, military, etc.
  documentCategory: varchar("document_category").notNull(), // kimlik, ise-alim, egitim, sgk-vergi, saglik, performans, diger
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected
  notes: text("notes"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR screens table
export const qrScreens = pgTable("qr_screens", {
  id: serial("id").primaryKey(),
  screenId: varchar("screen_id").notNull().unique(),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name").notNull(),
  accessCode: varchar("access_code").notNull(),
  active: boolean("active").default(true),
  deviceId: varchar("device_id"),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // info, warning, error, success
  targetType: varchar("target_type").notNull(), // all, branch, individual, team
  targetId: integer("target_id"), // branch_id or personnel_id
  senderUserId: varchar("sender_user_id").references(() => users.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedBranches: many(branches),
  sentNotifications: many(notifications),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  manager: one(users, { fields: [branches.managerId], references: [users.id] }),
  personnel: many(personnel),
  departments: many(departments),
  teams: many(teams),
  shifts: many(shifts),
  qrCodes: many(qrCodes),
  qrScreens: many(qrScreens),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  branch: one(branches, { fields: [departments.branchId], references: [branches.id] }),
  manager: one(personnel, { fields: [departments.managerId], references: [personnel.id] }),
  personnel: many(personnel),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  branch: one(branches, { fields: [teams.branchId], references: [branches.id] }),
  leader: one(personnel, { fields: [teams.leaderId], references: [personnel.id] }),
  members: many(personnel),
}));

export const personnelRelations = relations(personnel, ({ one, many }) => ({
  user: one(users, { fields: [personnel.userId], references: [users.id] }),
  branch: one(branches, { fields: [personnel.branchId], references: [branches.id] }),
  department: one(departments, { fields: [personnel.departmentId], references: [departments.id] }),
  shift: one(shifts, { fields: [personnel.shiftId], references: [shifts.id] }),
  team: one(teams, { fields: [personnel.teamId], references: [teams.id] }),
  managedDepartments: many(departments),
  managedTeams: many(teams),
  shiftAssignments: many(shiftAssignments),
  leaveRequests: many(leaveRequests),
  attendanceRecords: many(attendanceRecords),
  documents: many(personnelDocuments),
}));

export const personnelDocumentsRelations = relations(personnelDocuments, ({ one }) => ({
  personnel: one(personnel, { fields: [personnelDocuments.personnelId], references: [personnel.id] }),
  uploader: one(users, { fields: [personnelDocuments.uploadedBy], references: [users.id] }),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  branch: one(branches, { fields: [shifts.branchId], references: [branches.id] }),
  personnel: many(personnel),
  assignments: many(shiftAssignments),
}));

export const shiftAssignmentsRelations = relations(shiftAssignments, ({ one }) => ({
  personnel: one(personnel, { fields: [shiftAssignments.personnelId], references: [personnel.id] }),
  shift: one(shifts, { fields: [shiftAssignments.shiftId], references: [shifts.id] }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  personnel: one(personnel, { fields: [leaveRequests.personnelId], references: [personnel.id] }),
  approver: one(users, { fields: [leaveRequests.approvedBy], references: [users.id] }),
}));

export const qrCodesRelations = relations(qrCodes, ({ one, many }) => ({
  branch: one(branches, { fields: [qrCodes.branchId], references: [branches.id] }),
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  personnel: one(personnel, { fields: [attendanceRecords.personnelId], references: [personnel.id] }),
  qrCode: one(qrCodes, { fields: [attendanceRecords.qrCodeId], references: [qrCodes.id] }),
  qrScreen: one(qrScreens, { fields: [attendanceRecords.qrScreenId], references: [qrScreens.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  sender: one(users, { fields: [notifications.senderUserId], references: [users.id] }),
}));

export const qrScreensRelations = relations(qrScreens, ({ one, many }) => ({
  branch: one(branches, { fields: [qrScreens.branchId], references: [branches.id] }),
  attendanceRecords: many(attendanceRecords),
}));

// Schema exports
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonnelSchema = createInsertSchema(personnel).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;
export type Personnel = typeof personnel.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type QrCode = typeof qrCodes.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export const insertPersonnelDocumentSchema = createInsertSchema(personnelDocuments).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});

export type InsertPersonnelDocument = z.infer<typeof insertPersonnelDocumentSchema>;
export type PersonnelDocument = typeof personnelDocuments.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// System settings table for app configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// QR screen schema exports
export const insertQrScreenSchema = createInsertSchema(qrScreens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQrScreen = z.infer<typeof insertQrScreenSchema>;
export type QrScreen = typeof qrScreens.$inferSelect;
