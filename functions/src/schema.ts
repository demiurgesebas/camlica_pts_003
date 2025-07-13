import { z } from "zod";

// Basic schemas for Firebase Functions
export const personnelSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tcNo: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  branch: z.string().optional(),
  hireDate: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  role: z.enum(["super_admin", "admin", "personnel"]).default("personnel"),
  permissions: z.array(z.string()).default([]),
});

export const branchSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  manager: z.string().optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  manager: z.string().optional(),
});

export const shiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  description: z.string().optional(),
});

export const shiftAssignmentSchema = z.object({
  personnelId: z.string(),
  shiftId: z.string(),
  assignedDate: z.string(),
  shiftType: z.enum(["morning", "evening", "off", "working"]).default("working"),
  status: z.enum(["active", "completed", "absent"]).default("active"),
  notes: z.string().optional(),
});

export const leaveRequestSchema = z.object({
  personnelId: z.string(),
  leaveType: z.enum(["annual", "sick", "maternity", "unpaid"]),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  reason: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export const qrCodeSchema = z.object({
  branchId: z.string(),
  code: z.string(),
  screenId: z.string().optional(),
  expiresAt: z.string(),
  isActive: z.boolean().default(true),
});

export const attendanceRecordSchema = z.object({
  personnelId: z.string(),
  date: z.string(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  qrCodeId: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["present", "absent", "late", "early_leave"]).default("present"),
  notes: z.string().optional(),
});

export const notificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "warning", "error", "success"]).default("info"),
  isRead: z.boolean().default(false),
});

export const taskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  assignedTo: z.string(),
  assignedBy: z.string(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
});

export const teamSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  branchId: z.string().optional(),
  leaderId: z.string().optional(),
});

// Export types
export type Personnel = z.infer<typeof personnelSchema>;
export type Branch = z.infer<typeof branchSchema>;
export type Department = z.infer<typeof departmentSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type ShiftAssignment = z.infer<typeof shiftAssignmentSchema>;
export type LeaveRequest = z.infer<typeof leaveRequestSchema>;
export type QrCode = z.infer<typeof qrCodeSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Team = z.infer<typeof teamSchema>; 