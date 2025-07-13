import {
  users,
  branches,
  departments,
  teams,
  personnel,
  shifts,
  shiftAssignments,
  leaveRequests,
  qrCodes,
  attendanceRecords,
  notifications,
  personnelDocuments,
  systemSettings,
  type User,
  type UpsertUser,
  type Branch,
  type InsertBranch,
  type Department,
  type InsertDepartment,
  type Team,
  type InsertTeam,
  type Personnel,
  type InsertPersonnel,
  type Shift,
  type InsertShift,
  type ShiftAssignment,
  type InsertShiftAssignment,
  type LeaveRequest,
  type InsertLeaveRequest,
  type QrCode,
  type InsertQrCode,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type Notification,
  type InsertNotification,
  type PersonnelDocument,
  type InsertPersonnelDocument,
  type SystemSetting,
  type InsertSystemSetting,
  QrScreen,
  InsertQrScreen,
  qrScreens,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, gt, lte, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserPermissions(id: string, permissions: string[]): Promise<User>;
  updateUserStatus(id: string, isActive: boolean): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  createUserByAdmin(userData: {
    username: string;
    password: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: string;
    permissions?: string[];
  }): Promise<User>;
  getUserByCredentials(username: string, password: string): Promise<User | undefined>;

  // Branch operations
  getBranches(): Promise<Branch[]>;
  getBranchById(id: number): Promise<Branch | undefined>;
  getBranchesByManagerId(managerId: string): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;

  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | undefined>;
  getDepartmentsByBranchId(branchId: number): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: number): Promise<void>;

  // Team operations
  getTeams(): Promise<Team[]>;
  getTeamById(id: number): Promise<Team | undefined>;
  getTeamsByBranchId(branchId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Personnel operations
  getPersonnel(): Promise<Personnel[]>;
  getPersonnelById(id: number): Promise<Personnel | undefined>;
  getPersonnelByBranchId(branchId: number): Promise<Personnel[]>;
  createPersonnel(personnel: InsertPersonnel): Promise<Personnel>;
  updatePersonnel(id: number, personnel: Partial<InsertPersonnel>): Promise<Personnel>;
  deletePersonnel(id: number): Promise<void>;
  
  // Personnel with dynamic shift info
  getPersonnelWithCurrentShift(personnelId: number, date?: string): Promise<Personnel & { currentShift?: string; currentShiftType?: string }>;
  getPersonnelListWithCurrentShifts(date?: string): Promise<(Personnel & { currentShift?: string; currentShiftType?: string })[]>;
  
  // Annual leave calculations
  calculateAnnualLeaveEntitlement(hireDate: Date): number;
  updatePersonnelAnnualLeave(personnelId: number): Promise<Personnel>;
  updateAllPersonnelAnnualLeave(): Promise<void>;

  // Shift operations
  getShifts(): Promise<Shift[]>;
  getShiftById(id: number): Promise<Shift | undefined>;
  getShiftsByBranchId(branchId: number): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift>;
  deleteShift(id: number): Promise<void>;

  // Shift assignment operations
  getShiftAssignments(): Promise<ShiftAssignment[]>;
  getShiftAssignmentsByDate(date: string): Promise<ShiftAssignment[]>;
  getShiftAssignmentsByPersonnelId(personnelId: number): Promise<ShiftAssignment[]>;
  createShiftAssignment(assignment: InsertShiftAssignment): Promise<ShiftAssignment>;
  updateShiftAssignment(id: number, assignment: Partial<InsertShiftAssignment>): Promise<ShiftAssignment>;
  deleteShiftAssignment(id: number): Promise<void>;

  // Leave request operations
  getLeaveRequests(): Promise<LeaveRequest[]>;
  getLeaveRequestById(id: number): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByPersonnelId(personnelId: number): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, request: Partial<LeaveRequest>): Promise<LeaveRequest>;
  approveLeaveRequest(id: number, approvedBy: string): Promise<LeaveRequest>;
  rejectLeaveRequest(id: number, approvedBy: string, reason: string): Promise<LeaveRequest>;

  // QR code operations
  getActiveQrCodes(): Promise<QrCode[]>;
  getQrCodeByCode(code: string): Promise<QrCode | undefined>;
  getQrCodeByScreen(screenId: string): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  createQrCodeForScreen(screenId: string): Promise<QrCode>;
  expireQrCode(id: number): Promise<void>;
  cleanupExpiredQrCodes(): Promise<void>;

  // Attendance record operations
  getAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByPersonnelId(personnelId: number): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: number, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord>;

  // Personnel document operations
  getPersonnelDocuments(personnelId: number): Promise<PersonnelDocument[]>;
  getPersonnelDocumentsByCategory(personnelId: number, category: string): Promise<PersonnelDocument[]>;
  createPersonnelDocument(document: InsertPersonnelDocument): Promise<PersonnelDocument>;
  updatePersonnelDocument(id: number, document: Partial<InsertPersonnelDocument>): Promise<PersonnelDocument>;
  deletePersonnelDocument(id: number): Promise<void>;

  // Notification operations
  getNotifications(): Promise<Notification[]>;
  getNotificationsByTargetType(targetType: string, targetId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;

  // System settings operations
  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<void>;

  // QR screen operations
  getQrScreens(): Promise<QrScreen[]>;
  getQrScreenByScreenId(screenId: string): Promise<QrScreen | undefined>;
  createQrScreen(screen: InsertQrScreen): Promise<QrScreen>;
  updateQrScreen(screenId: string, screen: Partial<InsertQrScreen>): Promise<QrScreen>;
  deleteQrScreen(screenId: string): Promise<void>;
  updateQrScreenActivity(screenId: string): Promise<void>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalPersonnel: number;
    workingToday: number;
    onLeave: number;
    lateArrivals: number;
    todayQrScans: number;
    pendingLeaveRequests: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      username: users.username,
      password: users.password,
      role: users.role,
      permissions: users.permissions,
      isActive: users.isActive,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByCredentials(username: string, password: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.password, password)));
    return user;
  }

  async createUserByAdmin(userData: {
    username: string;
    password: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: string;
    permissions?: string[];
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserPermissions(id: string, permissions: string[]): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        permissions,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        password,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Branch operations
  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(asc(branches.name));
  }

  async getBranchById(id: number): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async getBranchesByManagerId(managerId: string): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.managerId, managerId));
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [newBranch] = await db.insert(branches).values(branch).returning();
    return newBranch;
  }

  async updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch> {
    const [updatedBranch] = await db
      .update(branches)
      .set({ ...branch, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    return updatedBranch;
  }

  async deleteBranch(id: number): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.name));
  }

  async getDepartmentById(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async getDepartmentsByBranchId(branchId: number): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.branchId, branchId));
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department> {
    const [updatedDepartment] = await db
      .update(departments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Personnel operations
  async getPersonnel(): Promise<Personnel[]> {
    return await db.select().from(personnel).orderBy(asc(personnel.lastName));
  }

  async getPersonnelById(id: number): Promise<Personnel | undefined> {
    const [person] = await db.select().from(personnel).where(eq(personnel.id, id));
    return person;
  }

  async getPersonnelByBranchId(branchId: number): Promise<Personnel[]> {
    return await db.select().from(personnel).where(eq(personnel.branchId, branchId));
  }

  async createPersonnel(person: InsertPersonnel): Promise<Personnel> {
    const [newPersonnel] = await db.insert(personnel).values(person).returning();
    return newPersonnel;
  }

  async updatePersonnel(id: number, person: Partial<InsertPersonnel>): Promise<Personnel> {
    const [updatedPersonnel] = await db
      .update(personnel)
      .set({ ...person, updatedAt: new Date() })
      .where(eq(personnel.id, id))
      .returning();
    return updatedPersonnel;
  }

  async deletePersonnel(id: number): Promise<void> {
    await db.delete(personnel).where(eq(personnel.id, id));
  }

  // Personnel with dynamic shift info
  async getPersonnelWithCurrentShift(personnelId: number, date?: string): Promise<Personnel & { currentShift?: string; currentShiftType?: string }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Validate personnelId
    if (!personnelId || isNaN(personnelId) || personnelId <= 0) {
      throw new Error('Invalid personnel ID');
    }
    
    // Get personnel info
    const [person] = await db.select().from(personnel).where(eq(personnel.id, personnelId));
    if (!person) {
      throw new Error('Personnel not found');
    }
    
    // Get current shift assignment for the date
    const [shiftAssignment] = await db
      .select()
      .from(shiftAssignments)
      .where(
        and(
          eq(shiftAssignments.personnelId, personnelId),
          eq(shiftAssignments.date, targetDate)
        )
      );
    
    // Get shift details if assignment exists
    let currentShift = '';
    let currentShiftType = '';
    
    if (shiftAssignment) {
      currentShiftType = shiftAssignment.shiftType || '';
      
      // Convert shift type to Turkish display names
      switch (currentShiftType) {
        case 'morning':
          currentShift = 'Sabah (08:00-20:00)';
          break;
        case 'evening':
          currentShift = 'Akşam (20:00-08:00)';
          break;
        case 'off':
          currentShift = 'İzinli';
          break;
        case 'working':
          currentShift = 'Çalışıyor';
          break;
        default:
          currentShift = 'Tanımlanmamış';
      }
    } else {
      // No shift assignment for today
      currentShift = 'Vardiya atanmamış';
      currentShiftType = 'unassigned';
    }
    
    return {
      ...person,
      currentShift,
      currentShiftType
    };
  }

  async getPersonnelListWithCurrentShifts(date?: string): Promise<(Personnel & { currentShift?: string; currentShiftType?: string })[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log('Getting personnel with current shifts for date:', targetDate);
      
      // Get all personnel
      const personnelList = await db.select().from(personnel).orderBy(asc(personnel.firstName));
      console.log('Found personnel count:', personnelList.length);
      
      // Get all shift assignments for the target date
      const shiftAssignmentsList = await db
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.date, targetDate));
      console.log('Found shift assignments for date:', shiftAssignmentsList.length);
      
      // Create a map of personnel ID to shift assignment
      const shiftAssignmentMap = new Map();
      shiftAssignmentsList.forEach(assignment => {
        if (assignment.personnelId) {
          shiftAssignmentMap.set(assignment.personnelId, assignment);
        }
      });
      
      // Add current shift info to each personnel
      return personnelList.map(person => {
        const shiftAssignment = shiftAssignmentMap.get(person.id);
        let currentShift = '';
        let currentShiftType = '';
        
        if (shiftAssignment) {
          currentShiftType = shiftAssignment.shiftType || '';
          
          // Convert shift type to Turkish display names
          switch (currentShiftType) {
            case 'morning':
              currentShift = 'Sabah (08:00-20:00)';
              break;
            case 'evening':
              currentShift = 'Akşam (20:00-08:00)';
              break;
            case 'off':
              currentShift = 'İzinli';
              break;
            case 'working':
              currentShift = 'Çalışıyor';
              break;
            default:
              currentShift = 'Tanımlanmamış';
          }
        } else {
          // No shift assignment for today
          currentShift = 'Vardiya atanmamış';
          currentShiftType = 'unassigned';
        }
        
        return {
          ...person,
          currentShift,
          currentShiftType
        };
      });
    } catch (error) {
      console.error('Error in getPersonnelListWithCurrentShifts:', error);
      throw error;
    }
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(asc(teams.name));
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamsByBranchId(branchId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.branchId, branchId));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Shift operations
  async getShifts(): Promise<Shift[]> {
    return await db.select().from(shifts).orderBy(asc(shifts.startTime));
  }

  async getShiftById(id: number): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  }

  async getShiftsByBranchId(branchId: number): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.branchId, branchId));
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }

  async updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift> {
    const [updatedShift] = await db
      .update(shifts)
      .set({ ...shift, updatedAt: new Date() })
      .where(eq(shifts.id, id))
      .returning();
    return updatedShift;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  // Shift assignment operations
  async getShiftAssignments(): Promise<ShiftAssignment[]> {
    return await db.select().from(shiftAssignments).orderBy(desc(shiftAssignments.assignedDate));
  }

  async getShiftAssignmentsByDate(date: string): Promise<ShiftAssignment[]> {
    return await db.select().from(shiftAssignments).where(eq(shiftAssignments.assignedDate, date));
  }

  async getShiftAssignmentsByPersonnelId(personnelId: number): Promise<ShiftAssignment[]> {
    return await db.select().from(shiftAssignments).where(eq(shiftAssignments.personnelId, personnelId));
  }

  async createShiftAssignment(assignment: InsertShiftAssignment): Promise<ShiftAssignment> {
    const [newAssignment] = await db.insert(shiftAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updateShiftAssignment(id: number, assignment: Partial<InsertShiftAssignment>): Promise<ShiftAssignment> {
    const [updatedAssignment] = await db
      .update(shiftAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(shiftAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteShiftAssignment(id: number): Promise<void> {
    await db.delete(shiftAssignments).where(eq(shiftAssignments.id, id));
  }

  // Leave request operations
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequestById(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request;
  }

  async getLeaveRequestsByPersonnelId(personnelId: number): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.personnelId, personnelId));
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.status, "pending"));
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [newRequest] = await db.insert(leaveRequests).values(request).returning();
    return newRequest;
  }

  async updateLeaveRequest(id: number, request: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async approveLeaveRequest(id: number, approvedBy: string): Promise<LeaveRequest> {
    // İlk olarak izin talebini al
    const [leaveRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));
    
    if (!leaveRequest) {
      throw new Error("İzin talebi bulunamadı");
    }

    // İzin talebini onayla
    const [approvedRequest] = await db
      .update(leaveRequests)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    // Eğer yıllık izin ise, personelin kullanılan izin günlerini güncelle
    if (leaveRequest.leaveType === "yillik" && leaveRequest.personnelId) {
      await db
        .update(personnel)
        .set({
          usedAnnualLeave: sql`${personnel.usedAnnualLeave} + ${leaveRequest.totalDays}`,
          updatedAt: new Date(),
        })
        .where(eq(personnel.id, leaveRequest.personnelId));
    }

    return approvedRequest;
  }

  async rejectLeaveRequest(id: number, approvedBy: string, reason: string): Promise<LeaveRequest> {
    const [rejectedRequest] = await db
      .update(leaveRequests)
      .set({
        status: "rejected",
        approvedBy,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return rejectedRequest;
  }

  // QR code operations
  async getActiveQrCodes(): Promise<QrCode[]> {
    return await db
      .select()
      .from(qrCodes)
      .where(and(eq(qrCodes.isActive, true), gte(qrCodes.expiresAt, new Date())));
  }

  async getQrCodeByCode(code: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.code, code));
    return qrCode;
  }

  async getQrCodeByScreen(screenId: string): Promise<QrCode | undefined> {
    const [qrCode] = await db
      .select()
      .from(qrCodes)
      .where(and(
        eq(qrCodes.screenId, screenId),
        eq(qrCodes.isActive, true),
        gt(qrCodes.expiresAt, new Date())
      ));
    return qrCode;
  }

  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const [newQrCode] = await db.insert(qrCodes).values(qrCode).returning();
    return newQrCode;
  }

  async createQrCodeForScreen(screenId: string): Promise<QrCode> {
    const { nanoid } = await import('nanoid');
    const code = nanoid(10);
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 saniye
    
    console.log(`Creating QR code for screen ${screenId}:`);
    console.log(`Generated code: ${code}`);
    console.log(`Expires at: ${expiresAt}`);
    
    // Bu ekran için mevcut aktif QR kodları sil
    await db
      .update(qrCodes)
      .set({ isActive: false })
      .where(and(
        eq(qrCodes.screenId, screenId),
        eq(qrCodes.isActive, true)
      ));
    
    const [newQrCode] = await db
      .insert(qrCodes)
      .values({
        screenId,
        code,
        expiresAt,
        isActive: true,
        branchId: 2, // Mevcut şube ID'si sabit olarak kullan
        lastUpdated: new Date()
      })
      .returning();
    
    console.log(`New QR code inserted:`, newQrCode);
    return newQrCode;
  }

  async expireQrCode(id: number): Promise<void> {
    await db.update(qrCodes).set({ isActive: false }).where(eq(qrCodes.id, id));
  }

  async cleanupExpiredQrCodes(): Promise<void> {
    await db.update(qrCodes).set({ isActive: false }).where(lte(qrCodes.expiresAt, new Date()));
  }

  // Attendance record operations
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords).orderBy(desc(attendanceRecords.date));
  }

  async getAttendanceRecordsByPersonnelId(personnelId: number): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords).where(eq(attendanceRecords.personnelId, personnelId));
  }

  async getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords).where(eq(attendanceRecords.date, date));
  }

  async getAttendanceRecordsByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .where(and(
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ))
      .orderBy(desc(attendanceRecords.date));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async updateAttendanceRecord(id: number, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord> {
    const [updatedRecord] = await db
      .update(attendanceRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Notification operations
  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByTargetType(targetType: string, targetId?: number): Promise<Notification[]> {
    if (targetId) {
      return await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.targetType, targetType), eq(notifications.targetId, targetId)));
    } else {
      return await db.select().from(notifications).where(eq(notifications.targetType, targetType));
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalPersonnel: number;
    workingToday: number;
    onLeave: number;
    lateArrivals: number;
    todayQrScans: number;
    pendingLeaveRequests: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const [
      totalPersonnelResult,
      workingTodayResult,
      onLeaveResult,
      lateArrivalsResult,
      todayQrScansResult,
      pendingLeaveRequestsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(personnel).where(eq(personnel.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(shiftAssignments)
        .where(and(eq(shiftAssignments.assignedDate, today), eq(shiftAssignments.status, "active"))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(and(eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, today), gte(leaveRequests.endDate, today))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceRecords)
        .where(and(eq(attendanceRecords.date, today), eq(attendanceRecords.status, "late"))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.date, today)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(eq(leaveRequests.status, "pending")),
    ]);

    return {
      totalPersonnel: totalPersonnelResult[0]?.count || 0,
      workingToday: workingTodayResult[0]?.count || 0,
      onLeave: onLeaveResult[0]?.count || 0,
      lateArrivals: lateArrivalsResult[0]?.count || 0,
      todayQrScans: todayQrScansResult[0]?.count || 0,
      pendingLeaveRequests: pendingLeaveRequestsResult[0]?.count || 0,
    };
  }

  // Personnel document operations
  async getPersonnelDocuments(personnelId: number): Promise<PersonnelDocument[]> {
    return await db.select().from(personnelDocuments)
      .where(eq(personnelDocuments.personnelId, personnelId))
      .orderBy(desc(personnelDocuments.uploadedAt));
  }

  async getPersonnelDocumentsByCategory(personnelId: number, category: string): Promise<PersonnelDocument[]> {
    return await db.select().from(personnelDocuments)
      .where(and(
        eq(personnelDocuments.personnelId, personnelId),
        eq(personnelDocuments.documentCategory, category)
      ))
      .orderBy(desc(personnelDocuments.uploadedAt));
  }

  async createPersonnelDocument(document: InsertPersonnelDocument): Promise<PersonnelDocument> {
    const [newDocument] = await db.insert(personnelDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async updatePersonnelDocument(id: number, document: Partial<InsertPersonnelDocument>): Promise<PersonnelDocument> {
    const [updatedDocument] = await db.update(personnelDocuments)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(personnelDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deletePersonnelDocument(id: number): Promise<void> {
    await db.delete(personnelDocuments).where(eq(personnelDocuments.id, id));
  }

  // Annual leave calculations
  calculateAnnualLeaveEntitlement(hireDate: Date): number {
    const today = new Date();
    const yearsDiff = today.getFullYear() - hireDate.getFullYear();
    const monthsDiff = today.getMonth() - hireDate.getMonth();
    const daysDiff = today.getDate() - hireDate.getDate();
    
    // Tam hizmet süresini hesapla
    let yearsOfService = yearsDiff;
    if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
      yearsOfService--;
    }
    
    // Yıllık izin hesaplama kuralları
    if (yearsOfService < 1) {
      return 0; // İlk yıl tamamlanmadan izin hakkı yok
    } else if (yearsOfService >= 1 && yearsOfService <= 5) {
      return 15; // 1-5 yıl: 15 gün
    } else if (yearsOfService > 5 && yearsOfService < 15) {
      return 20; // 5-15 yıl: 20 gün
    } else {
      return 26; // 15+ yıl: 26 gün
    }
  }

  async updatePersonnelAnnualLeave(personnelId: number): Promise<Personnel> {
    const person = await this.getPersonnelById(personnelId);
    if (!person || !person.hireDate) {
      throw new Error("Personel bulunamadı veya işe alım tarihi eksik");
    }

    const currentEntitlement = this.calculateAnnualLeaveEntitlement(person.hireDate);
    const currentYear = new Date().getFullYear();
    
    // Önceki yıldan kalan izinleri hesapla (devreden izin)
    let carryOverLeave = person.carryOverLeave || 0;
    
    // Eğer yeni yılsa, kullanılmayan izinleri devret
    const lastUpdateYear = person.updatedAt ? person.updatedAt.getFullYear() : currentYear;
    if (lastUpdateYear < currentYear) {
      // Geçen yıldan kalan izinleri devret
      carryOverLeave = (person.remainingAnnualLeave || 0);
    }
    
    // Toplam izin = Bu yılki hak + devreden izin
    const totalLeave = currentEntitlement + carryOverLeave;
    const remainingLeave = totalLeave - (person.usedAnnualLeave || 0);

    const [updatedPersonnel] = await db
      .update(personnel)
      .set({
        annualLeaveEntitlement: currentEntitlement,
        carryOverLeave: carryOverLeave,
        remainingAnnualLeave: Math.max(0, remainingLeave),
        updatedAt: new Date(),
      })
      .where(eq(personnel.id, personnelId))
      .returning();

    return updatedPersonnel;
  }

  async updateAllPersonnelAnnualLeave(): Promise<void> {
    const allPersonnel = await this.getPersonnel();
    
    for (const person of allPersonnel) {
      if (person.hireDate) {
        try {
          await this.updatePersonnelAnnualLeave(person.id);
        } catch (error) {
          console.error(`Error updating annual leave for personnel ${person.id}:`, error);
        }
      }
    }
  }

  // System settings operations
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(asc(systemSettings.category), asc(systemSettings.key));
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [upserted] = await db
      .insert(systemSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: setting.value,
          category: setting.category,
          description: setting.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  // QR screen operations
  async getQrScreens(): Promise<QrScreen[]> {
    return await db.select().from(qrScreens);
  }

  async getQrScreenByScreenId(screenId: string): Promise<QrScreen | undefined> {
    const [screen] = await db.select().from(qrScreens).where(eq(qrScreens.screenId, screenId));
    return screen;
  }

  async createQrScreen(screenData: InsertQrScreen): Promise<QrScreen> {
    const [screen] = await db.insert(qrScreens).values(screenData).returning();
    return screen;
  }

  async updateQrScreen(screenId: string, screenData: Partial<InsertQrScreen>): Promise<QrScreen> {
    console.log('storage.updateQrScreen called with:', { screenId, screenData });
    const [screen] = await db
      .update(qrScreens)
      .set({ ...screenData, updatedAt: new Date() })
      .where(eq(qrScreens.screenId, screenId))
      .returning();
    console.log('storage.updateQrScreen result:', screen);
    return screen;
  }

  async deleteQrScreen(screenId: string): Promise<void> {
    await db.delete(qrScreens).where(eq(qrScreens.screenId, screenId));
  }

  async updateQrScreenActivity(screenId: string): Promise<void> {
    await db
      .update(qrScreens)
      .set({ lastActivity: new Date() })
      .where(eq(qrScreens.screenId, screenId));
  }
}

export const storage = new DatabaseStorage();
