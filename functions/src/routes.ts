import { Express } from "express";
import { storage } from "./storage";
import { authenticateFirebase, requireAdmin, requireSuperAdmin, requirePersonnel } from "./firebaseAuth";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as admin from "firebase-admin";
import {
  personnelSchema,
  branchSchema,
  departmentSchema,
  shiftSchema,
  shiftAssignmentSchema,
  leaveRequestSchema,
  qrCodeSchema,
  attendanceRecordSchema,
  notificationSchema,
  taskSchema,
  teamSchema,
} from "./schema";
import multer from "multer";
import * as xlsx from "xlsx";
import { collections } from "./firebase";
import { parse } from "date-fns";

// Personnel routes
export function setupPersonnelRoutes(app: Express) {
  // Get all personnel
  app.get("/api/personnel", requireAdmin, async (req, res) => {
    try {
      const personnel = await storage.getPersonnel();
      res.json(personnel);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      res.status(500).json({ error: "Failed to fetch personnel" });
    }
  });

  // Get personnel by ID
  app.get("/api/personnel/:id", requirePersonnel, async (req, res) => {
    try {
      const personnel = await storage.getPersonnelById(req.params.id);
      if (!personnel) {
        return res.status(404).json({ error: "Personnel not found" });
      }
      res.json(personnel);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      res.status(500).json({ error: "Failed to fetch personnel" });
    }
  });

  // Create personnel
  app.post("/api/personnel", requireAdmin, async (req, res) => {
    try {
      const validatedData = personnelSchema.parse(req.body);
      const personnel = await storage.createPersonnel({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.status(201).json(personnel);
    } catch (error) {
      console.error("Error creating personnel:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create personnel" });
    }
  });

  // Update personnel
  app.put("/api/personnel/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = personnelSchema.partial().parse(req.body);
      const personnel = await storage.updatePersonnel(req.params.id, {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      });
      res.json(personnel);
    } catch (error) {
      console.error("Error updating personnel:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update personnel" });
    }
  });

  // Delete personnel
  app.delete("/api/personnel/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePersonnel(req.params.id);
      res.json({ message: "Personnel deleted successfully" });
    } catch (error) {
      console.error("Error deleting personnel:", error);
      res.status(500).json({ error: "Failed to delete personnel" });
    }
  });
}

// Branch routes
export function setupBranchRoutes(app: Express) {
  // Get all branches
  app.get("/api/branches", requirePersonnel, async (req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ error: "Failed to fetch branches" });
    }
  });

  // Get branch by ID
  app.get("/api/branches/:id", requirePersonnel, async (req, res) => {
    try {
      const branch = await storage.getBranchById(req.params.id);
      if (!branch) {
        return res.status(404).json({ error: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error fetching branch:", error);
      res.status(500).json({ error: "Failed to fetch branch" });
    }
  });

  // Create branch
  app.post("/api/branches", requireAdmin, async (req, res) => {
    try {
      const validatedData = branchSchema.parse(req.body);
      const branch = await storage.createBranch({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.status(201).json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create branch" });
    }
  });

  // Update branch
  app.put("/api/branches/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = branchSchema.partial().parse(req.body);
      const branch = await storage.updateBranch(req.params.id, {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      });
      res.json(branch);
    } catch (error) {
      console.error("Error updating branch:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update branch" });
    }
  });

  // Delete branch
  app.delete("/api/branches/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBranch(req.params.id);
      res.json({ message: "Branch deleted successfully" });
    } catch (error) {
      console.error("Error deleting branch:", error);
      res.status(500).json({ error: "Failed to delete branch" });
    }
  });
}

// Department routes
export function setupDepartmentRoutes(app: Express) {
  // Get all departments
  app.get("/api/departments", requirePersonnel, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  // Get department by ID
  app.get("/api/departments/:id", requirePersonnel, async (req, res) => {
    try {
      const department = await storage.getDepartmentById(req.params.id);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({ error: "Failed to fetch department" });
    }
  });

  // Create department
  app.post("/api/departments", requireAdmin, async (req, res) => {
    try {
      const validatedData = departmentSchema.parse(req.body);
      const department = await storage.createDepartment({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  // Update department
  app.put("/api/departments/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = departmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(req.params.id, {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      });
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update department" });
    }
  });

  // Delete department
  app.delete("/api/departments/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteDepartment(req.params.id);
      res.json({ message: "Department deleted successfully" });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });
}

// Shift routes
export function setupShiftRoutes(app: Express) {
  // Get all shifts
  app.get("/api/shifts", requirePersonnel, async (req, res) => {
    try {
      const shifts = await storage.getShifts();
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ error: "Failed to fetch shifts" });
    }
  });

  // Get shift by ID
  app.get("/api/shifts/:id", requirePersonnel, async (req, res) => {
    try {
      const shift = await storage.getShiftById(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ error: "Failed to fetch shift" });
    }
  });

  // Create shift
  app.post("/api/shifts", requireAdmin, async (req, res) => {
    try {
      const validatedData = shiftSchema.parse(req.body);
      const shift = await storage.createShift({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.status(201).json(shift);
    } catch (error) {
      console.error("Error creating shift:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create shift" });
    }
  });

  // Update shift
  app.put("/api/shifts/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = shiftSchema.partial().parse(req.body);
      const shift = await storage.updateShift(req.params.id, {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      });
      res.json(shift);
    } catch (error) {
      console.error("Error updating shift:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update shift" });
    }
  });

  // Delete shift
  app.delete("/api/shifts/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteShift(req.params.id);
      res.json({ message: "Shift deleted successfully" });
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ error: "Failed to delete shift" });
    }
  });
}

// Attendance routes
export function setupAttendanceRoutes(app: Express) {
  // Get attendance records
  app.get("/api/attendance", requirePersonnel, async (req, res) => {
    try {
      const { personnelId } = req.query;
      let records;
      
      if (personnelId) {
        records = await storage.getAttendanceRecordsByPersonnel(personnelId as string);
      } else {
        records = await storage.getAttendanceRecords();
      }
      
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  // Create attendance record
  app.post("/api/attendance", requirePersonnel, async (req, res) => {
    try {
      const { personnelId, type, timestamp, location } = req.body;
      
      if (!personnelId || !type || !timestamp) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const record = await storage.createAttendanceRecord({
        id: nanoid(),
        personnelId,
        type, // "check-in" or "check-out"
        timestamp: new Date(timestamp).toISOString(),
        location: location || null,
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  });
}

// Dashboard routes
export function setupDashboardRoutes(app: Express) {
  // Get dashboard stats
  app.get("/api/dashboard/stats", requirePersonnel, async (req, res) => {
    try {
      const [personnel, branches, departments, shifts] = await Promise.all([
        storage.getPersonnel(),
        storage.getBranches(),
        storage.getDepartments(),
        storage.getShifts(),
      ]);

      const stats = {
        totalPersonnel: personnel.length,
        activePersonnel: personnel.filter((p: any) => p.status === "active").length,
        totalBranches: branches.length,
        totalDepartments: departments.length,
        totalShifts: shifts.length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get recent activities
  app.get("/api/dashboard/recent-activities", requirePersonnel, async (req, res) => {
    try {
      // This would typically fetch recent activities from a separate collection
      // For now, we'll return a placeholder
      const activities = [
        {
          id: "1",
          type: "attendance",
          message: "Personnel checked in",
          timestamp: new Date().toISOString(),
        },
      ];

      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ error: "Failed to fetch recent activities" });
    }
  });
}

// Auth routes
export function setupAuthRoutes(app: Express) {
  // Get current user profile
  app.get("/api/auth/user", authenticateFirebase, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user profile from Firestore
      const personnel = await storage.getPersonnelById(user.uid);
      
      if (!personnel) {
        // If no personnel record found, return basic user info
        return res.json({
          user: {
            uid: user.uid,
            email: user.email,
            role: user.role || "personnel",
            permissions: user.permissions || [],
            isNewUser: true
          }
        });
      }

      res.json({
        user: {
          ...personnel,
          uid: user.uid,
          email: user.email,
          role: user.role || (personnel as any).role || "personnel",
          permissions: user.permissions || (personnel as any).permissions || [],
        }
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Set super admin (temporary endpoint for initial setup - NO AUTH REQUIRED)
  app.post("/api/auth/set-super-admin", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      if (!userRecord) {
        return res.status(404).json({ error: "User not found" });
      }
      // Set super admin custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: 'super_admin',
        permissions: [
          'dashboard','personnel','personnel_create','personnel_edit','personnel_delete','personnel_view','branches','branches_create','branches_edit','branches_delete','departments','departments_create','departments_edit','departments_delete','teams','teams_create','teams_edit','teams_delete','shifts','shifts_create','shifts_edit','shifts_delete','shifts_assign','shifts_import','attendance','attendance_view','attendance_edit','leave_management','leave_approve','leave_reject','leave_create','qr_management','qr_create','qr_view','qr_display','notifications','reports','reports_personnel','reports_attendance','reports_leaves','tasks','tasks_create','tasks_edit','tasks_delete','settings','user_management','user_create','user_edit','user_delete','user_permissions'
        ]
      });
      // Create personnel record in Firestore (opsiyonel)
      await storage.createPersonnel({
        id: userRecord.uid,
        firstName: userRecord.displayName?.split(' ')[0] || 'Admin',
        lastName: userRecord.displayName?.split(' ').slice(1).join(' ') || 'User',
        email: userRecord.email,
        role: 'super_admin',
        permissions: [
          'dashboard','personnel','personnel_create','personnel_edit','personnel_delete','personnel_view','branches','branches_create','branches_edit','branches_delete','departments','departments_create','departments_edit','departments_delete','teams','teams_create','teams_edit','teams_delete','shifts','shifts_create','shifts_edit','shifts_delete','shifts_assign','shifts_import','attendance','attendance_view','attendance_edit','leave_management','leave_approve','leave_reject','leave_create','qr_management','qr_create','qr_view','qr_display','notifications','reports','reports_personnel','reports_attendance','reports_leaves','tasks','tasks_create','tasks_edit','tasks_delete','settings','user_management','user_create','user_edit','user_delete','user_permissions'
        ],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.json({
        success: true,
        message: `User ${email} has been set as super admin`,
        uid: userRecord.uid
      });
    } catch (error) {
      console.error("Error setting super admin:", error);
      res.status(500).json({ error: "Failed to set super admin" });
    }
  });
}

// Leave Request routes
export function setupLeaveRequestRoutes(app: Express) {
  // Get all leave requests
  app.get("/api/leave-requests", requirePersonnel, async (req, res) => {
    try {
      const { personnelId } = req.query;
      let requests;
      
      if (personnelId) {
        requests = await storage.getLeaveRequestsByPersonnel(personnelId as string);
      } else {
        requests = await storage.getLeaveRequests();
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ error: "Failed to fetch leave requests" });
    }
  });

  // Create leave request
  app.post("/api/leave-requests", requirePersonnel, async (req, res) => {
    try {
      const validatedData = leaveRequestSchema.parse(req.body);
      const request = await storage.createLeaveRequest({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating leave request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create leave request" });
    }
  });

  // Update leave request
  app.put("/api/leave-requests/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = leaveRequestSchema.partial().parse(req.body);
      const request = await storage.updateLeaveRequest(req.params.id, {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      });
      res.json(request);
    } catch (error) {
      console.error("Error updating leave request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update leave request" });
    }
  });
}

// === EKSTRA ENDPOINTLER ===

export function setupExtraRoutes(app: Express) {
  // 1. Leave Requests - Pending
  app.get("/api/leave-requests/pending", requirePersonnel, async (req, res) => {
    try {
      const all = await storage.getLeaveRequests() as any[];
      const pending = all.filter(lr => lr.status === "pending");
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending leave requests" });
    }
  });

  // 2. Leave Requests - Approve
  app.put("/api/leave-requests/:id/approve", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateLeaveRequest(req.params.id, { status: "approved", updatedAt: new Date().toISOString() });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve leave request" });
    }
  });

  // 3. Leave Requests - Reject
  app.put("/api/leave-requests/:id/reject", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateLeaveRequest(req.params.id, { status: "rejected", rejectionReason: req.body?.reason || "", updatedAt: new Date().toISOString() });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject leave request" });
    }
  });

  // 4. Personnel Leave Requests
  app.get("/api/personnel/:id/leave-requests", requirePersonnel, async (req, res) => {
    try {
      const all = await storage.getLeaveRequestsByPersonnel(req.params.id) as any[];
      res.json(all);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personnel leave requests" });
    }
  });

  // 5. Leave Request Petition Download (dummy PDF)
  app.get("/api/leave-requests/:id/download-petition", requirePersonnel, async (req, res) => {
    // Dummy PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=izin_dilekce_${req.params.id}.pdf`);
    res.send(Buffer.from("PDF DILEKCE", "utf-8"));
  });

  // 6. Attendance Today
  app.get("/api/attendance/today", requirePersonnel, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const all = await storage.getAttendanceRecords() as any[];
      const filtered = all.filter(r => r.timestamp && r.timestamp.startsWith(today));
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's attendance" });
    }
  });

  // 7. Attendance by Date
  app.get("/api/attendance/date/:date", requirePersonnel, async (req, res) => {
    try {
      const date = req.params.date;
      const all = await storage.getAttendanceRecords() as any[];
      const filtered = all.filter(r => r.timestamp && r.timestamp.startsWith(date));
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance by date" });
    }
  });

  // 8. Attendance by Range
  app.get("/api/attendance/range/:startDate/:endDate", requirePersonnel, async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const all = await storage.getAttendanceRecords() as any[];
      const filtered = all.filter(r => {
        const d = r.timestamp?.split('T')[0];
        return d && d >= startDate && d <= endDate;
      });
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance by range" });
    }
  });

  // 9. Attendance by Personnel
  app.get("/api/attendance/personnel/:personnelId", requirePersonnel, async (req, res) => {
    try {
      const all = await storage.getAttendanceRecordsByPersonnel(req.params.personnelId) as any[];
      res.json(all);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personnel attendance" });
    }
  });

  // 10. Shift Assignments Today
  app.get("/api/shift-assignments/today", requirePersonnel, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const all = await storage.getShiftAssignments() as any[];
      const filtered = all.filter(s => s.date && s.date.startsWith(today));
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's shift assignments" });
    }
  });

  // 11. Shift Assignments by Personnel
  app.get("/api/shift-assignments/personnel/:personnelId", requirePersonnel, async (req, res) => {
    try {
      const all = await storage.getShiftAssignmentsByPersonnel(req.params.personnelId) as any[];
      res.json(all);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personnel shift assignments" });
    }
  });

  // 12. QR Codes Active
  app.get("/api/qr-codes/active", requirePersonnel, async (req, res) => {
    try {
      const all = await storage.getQrCodes() as any[];
      const now = new Date();
      const active = all.filter(qr => qr.isActive && new Date(qr.expiresAt) > now);
      res.json(active);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active QR codes" });
    }
  });

  // 13. QR Codes Delete All
  app.delete("/api/qr-codes/all", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getQrCodes() as any[];
      // Dummy: Sadece kaç tane silindiğini döndür
      res.json({ deletedCount: all.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete all QR codes" });
    }
  });

  // 14. QR Code by Screen
  app.get("/api/qr-codes/screen/:screenId", requirePersonnel, async (req, res) => {
    try {
      const all = await storage.getQrCodes() as any[];
      const code = all.find(qr => qr.screenId === req.params.screenId);
      res.json(code || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch QR code for screen" });
    }
  });

  // 15. QR Screens CRUD (dummy)
  app.get("/api/qr-screens", requirePersonnel, async (req, res) => {
    res.json([]); // Dummy boş liste
  });
  app.get("/api/qr-screens/:screenId", requirePersonnel, async (req, res) => {
    res.json({ screenId: req.params.screenId, active: true }); // Dummy veri
  });
  app.put("/api/qr-screens/:screenId", requireAdmin, async (req, res) => {
    res.json({ screenId: req.params.screenId, updated: true });
  });
  app.delete("/api/qr-screens/:screenId", requireAdmin, async (req, res) => {
    res.json({ screenId: req.params.screenId, deleted: true });
  });

  // 16. Personnel with current shifts (dummy implementation)
  app.get("/api/personnel/with-current-shifts", requirePersonnel, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const personnel = await storage.getPersonnel() as any[];
      const assignments = await storage.getShiftAssignments() as any[];
      // Bugünkü atamaları eşleştir
      const withShifts = personnel.map(p => {
        const shift = assignments.find(a => a.personnelId === p.id && a.date === today);
        return { ...p, currentShift: shift || null };
      });
      res.json(withShifts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personnel with current shifts" });
    }
  });

  // 17. Excel upload and import shifts (dummy implementation)
  // app.post("/api/excel/import-shifts", requireAdmin, async (req, res) => {
  //   // Not: Gerçek dosya yükleme için multer vb. gerekir, burada dummy response dönüyoruz
  //   res.json({ success: true, message: "Excel import başarılı (dummy)" });
  // });

  // 18. Shift assignments ana liste (eksikse ekle)
  app.get("/api/shift-assignments", requirePersonnel, async (req, res) => {
    try {
      const all = await storage.getShiftAssignments() as any[];
      res.json(all);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shift assignments" });
    }
  });

  // 19. Excel upload and import shifts (her iki path için de ekle)
  // const excelImportHandler = (req, res) => {
  //   res.json({ success: true, message: "Excel import başarılı (dummy)" });
  // };
  // app.post("/api/excel/import-shifts", requireAdmin, excelImportHandler);
  // app.post("/api/excel/upload-and-import-shifts", requireAdmin, excelImportHandler);
}

// QR Code routes
export function setupQrCodeRoutes(app: Express) {
  // Get all QR codes
  app.get("/api/qr-codes", requirePersonnel, async (req, res) => {
    try {
      const codes = await storage.getQrCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ error: "Failed to fetch QR codes" });
    }
  });

  // Create QR code
  app.post("/api/qr-codes", requireAdmin, async (req, res) => {
    try {
      const validatedData = qrCodeSchema.parse(req.body);
      const code = await storage.createQrCode({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(code);
    } catch (error) {
      console.error("Error creating QR code:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create QR code" });
    }
  });
}

// Task routes
export function setupTaskRoutes(app: Express) {
  // Get all tasks
  app.get("/api/tasks", requirePersonnel, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Create task
  app.post("/api/tasks", requireAdmin, async (req, res) => {
    try {
      const validatedData = taskSchema.parse(req.body);
      const task = await storage.createTask({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });
}

// Team routes
export function setupTeamRoutes(app: Express) {
  // Get all teams
  app.get("/api/teams", requirePersonnel, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Create team
  app.post("/api/teams", requireAdmin, async (req, res) => {
    try {
      const validatedData = teamSchema.parse(req.body);
      const team = await storage.createTeam({
        ...validatedData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create team" });
    }
  });
}

// Excel dosyasından vardiya atamalarını yükleyen gerçek endpoint
const upload = multer({ storage: multer.memoryStorage() });

export function setupExcelImportRoutes(app: Express) {
  app.post("/api/excel/upload-and-import-shifts", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Dosya bulunamadı" });
      }
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);
      let count = 0;
      for (const row of rows as any[]) {
        const data = typeof row === 'object' && row !== null ? row : {};
        await collections.shiftAssignments.add({
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
      res.json({ success: true, message: `${count} vardiya ataması yüklendi!` });
    } catch (error: any) {
      res.status(500).json({ error: "Excel import hatası", details: error.message });
    }
  });
}

// Gelişmiş Excel vardiya aktarım endpointi
export function setupAdvancedExcelImportRoutes(app: Express) {
  app.post("/api/excel/upload-and-import-shifts-advanced", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      const { year, month } = req.body;
      if (!req.file) {
        return res.status(400).json({ error: "Dosya bulunamadı" });
      }
      if (!year || !month) {
        return res.status(400).json({ error: "Yıl ve ay bilgisi zorunlu" });
      }
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // 2D array
      // Başlık satırlarını bul
      const numberCol = 0; // A sütunu
      const nameCol = 1; // B sütunu
      const firstDayCol = 2; // C sütunu (ilk gün)
      const dayHeaderRow = rows[2];
      const dayHeaders = Array.isArray(dayHeaderRow) ? dayHeaderRow.slice(firstDayCol) : [];
      const personRows = rows.slice(4).filter(r => r[nameCol] && typeof r[nameCol] === "string");
      const today = new Date();
      const monthStr = month.toString().padStart(2, "0");
      const todayStr = `${year}-${monthStr}-${today.getDate().toString().padStart(2, "0")}`;
      // Önce ilgili ay için eski kayıtları sil
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`;
      const oldAssignmentsSnap = await collections.shiftAssignments.where("date", ">=", startDate).where("date", "<=", endDate).get();
      const batch = collections.shiftAssignments.firestore.batch();
      oldAssignmentsSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      let count = 0;
      for (const row of personRows) {
        const number = row[numberCol]?.toString().trim();
        const fullName = (row[nameCol] || "").toString().trim();
        if (!fullName || !number) continue;
        // Benzersiz ID üret
        const personnelId = nanoid();
        // Bugünkü vardiyayı bul
        let todayShift = "";
        for (let i = 0; i < dayHeaders.length; i++) {
          const day = dayHeaders[i];
          const dayNum = parseInt(day?.toString() || "");
          if (!isNaN(dayNum) && dayNum === today.getDate()) {
            todayShift = (row[firstDayCol + i] || "").toString().trim().toUpperCase();
            break;
          }
        }
        // Personeli Firestore'a kaydet (veya güncelle)
        await collections.personnel.add({
          id: personnelId,
          number,
          fullName,
          todayShift,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        // Her gün için vardiya ataması ekle
        for (let i = 0; i < dayHeaders.length; i++) {
          const day = dayHeaders[i];
          if (!day) continue;
          const dayNum = parseInt(day.toString());
          if (isNaN(dayNum)) continue;
          const date = `${year}-${monthStr}-${dayNum.toString().padStart(2, "0")}`;
          const shiftTypeRaw = (row[firstDayCol + i] || "").toString().trim().toUpperCase();
          if (!["S", "A", "OF", "Ç"].includes(shiftTypeRaw)) continue;
          await collections.shiftAssignments.add({
            personnelId,
            fullName,
            number,
            date,
            shiftType: shiftTypeRaw,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
      }
      res.json({ success: true, message: `${count} vardiya ataması yüklendi!` });
    } catch (error: any) {
      res.status(500).json({ error: "Excel import hatası", details: error.message });
    }
  });
}

// Main routes setup function
export function setupAllRoutes(app: Express) {
  console.log("Setting up API routes...");
  
  // Setup all route groups
  setupAuthRoutes(app);
  setupPersonnelRoutes(app);
  setupBranchRoutes(app);
  setupDepartmentRoutes(app);
  setupShiftRoutes(app);
  setupAttendanceRoutes(app);
  setupLeaveRequestRoutes(app);
  setupQrCodeRoutes(app);
  setupTaskRoutes(app);
  setupTeamRoutes(app);
  setupDashboardRoutes(app);
  setupExtraRoutes(app); // <-- Ekstra endpointler burada

  // Bildirim (Notification) endpoint’leri
  app.get("/api/notifications", authenticateFirebase, async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Bildirimler alınırken hata:", error);
      res.status(500).json({ message: "Bildirimler alınamadı" });
    }
  });

  app.post("/api/notifications", authenticateFirebase, async (req, res) => {
    try {
      const notificationData = notificationSchema.parse(req.body);
      const userId = (req.user as any).uid || (req.user as any).sub || (req.user as any).claims?.sub;
      const notification = await storage.createNotification({
        ...notificationData,
        senderUserId: userId,
      });
      res.status(201).json(notification);
    } catch (error) {
      console.error("Bildirim oluşturulurken hata:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Geçersiz bildirim bilgileri",
          errors: error.errors,
        });
      } else {
        res.status(500).json({ message: "Bildirim oluşturulamadı" });
      }
    }
  });

  app.put("/api/notifications/:id/read", authenticateFirebase, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.updateNotification(id, { isRead: true });
      res.status(204).send();
    } catch (error) {
      console.error("Bildirim okundu olarak işaretlenirken hata:", error);
      res.status(500).json({ message: "Bildirim okundu olarak işaretlenemedi" });
    }
  });
  console.log("✅ All API routes configured");
} 

// FORCE DEPLOY: dummy change for redeploy 