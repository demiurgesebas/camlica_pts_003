import { collections } from "./firebase";
import { z } from "zod";

// Storage service for Firebase Firestore operations
export const storage = {
  // Personnel operations
  async getPersonnel() {
    const snapshot = await collections.personnel.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getPersonnelById(id: string) {
    const doc = await collections.personnel.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createPersonnel(data: any) {
    const docRef = await collections.personnel.add(data);
    return { id: docRef.id, ...data };
  },

  async updatePersonnel(id: string, data: any) {
    await collections.personnel.doc(id).update(data);
    return { id, ...data };
  },

  async deletePersonnel(id: string) {
    await collections.personnel.doc(id).delete();
    return { id };
  },

  // Branch operations
  async getBranches() {
    const snapshot = await collections.branches.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getBranchById(id: string) {
    const doc = await collections.branches.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createBranch(data: any) {
    const docRef = await collections.branches.add(data);
    return { id: docRef.id, ...data };
  },

  async updateBranch(id: string, data: any) {
    await collections.branches.doc(id).update(data);
    return { id, ...data };
  },

  async deleteBranch(id: string) {
    await collections.branches.doc(id).delete();
    return { id };
  },

  // Department operations
  async getDepartments() {
    const snapshot = await collections.departments.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getDepartmentById(id: string) {
    const doc = await collections.departments.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createDepartment(data: any) {
    const docRef = await collections.departments.add(data);
    return { id: docRef.id, ...data };
  },

  async updateDepartment(id: string, data: any) {
    await collections.departments.doc(id).update(data);
    return { id, ...data };
  },

  async deleteDepartment(id: string) {
    await collections.departments.doc(id).delete();
    return { id };
  },

  // Shift operations
  async getShifts() {
    const snapshot = await collections.shifts.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getShiftById(id: string) {
    const doc = await collections.shifts.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createShift(data: any) {
    const docRef = await collections.shifts.add(data);
    return { id: docRef.id, ...data };
  },

  async updateShift(id: string, data: any) {
    await collections.shifts.doc(id).update(data);
    return { id, ...data };
  },

  async deleteShift(id: string) {
    await collections.shifts.doc(id).delete();
    return { id };
  },

  // Shift Assignment operations
  async getShiftAssignments() {
    const snapshot = await collections.shiftAssignments.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getShiftAssignmentsByPersonnel(personnelId: string) {
    const snapshot = await collections.shiftAssignments
      .where("personnelId", "==", personnelId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createShiftAssignment(data: any) {
    const docRef = await collections.shiftAssignments.add(data);
    return { id: docRef.id, ...data };
  },

  async updateShiftAssignment(id: string, data: any) {
    await collections.shiftAssignments.doc(id).update(data);
    return { id, ...data };
  },

  async deleteShiftAssignment(id: string) {
    await collections.shiftAssignments.doc(id).delete();
    return { id };
  },

  // Attendance Record operations
  async getAttendanceRecords() {
    const snapshot = await collections.attendanceRecords.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getAttendanceRecordsByPersonnel(personnelId: string) {
    const snapshot = await collections.attendanceRecords
      .where("personnelId", "==", personnelId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createAttendanceRecord(data: any) {
    const docRef = await collections.attendanceRecords.add(data);
    return { id: docRef.id, ...data };
  },

  async updateAttendanceRecord(id: string, data: any) {
    await collections.attendanceRecords.doc(id).update(data);
    return { id, ...data };
  },

  async deleteAttendanceRecord(id: string) {
    await collections.attendanceRecords.doc(id).delete();
    return { id };
  },

  // Leave Request operations
  async getLeaveRequests() {
    const snapshot = await collections.leaveRequests.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getLeaveRequestsByPersonnel(personnelId: string) {
    const snapshot = await collections.leaveRequests
      .where("personnelId", "==", personnelId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createLeaveRequest(data: any) {
    const docRef = await collections.leaveRequests.add(data);
    return { id: docRef.id, ...data };
  },

  async updateLeaveRequest(id: string, data: any) {
    await collections.leaveRequests.doc(id).update(data);
    return { id, ...data };
  },

  async deleteLeaveRequest(id: string) {
    await collections.leaveRequests.doc(id).delete();
    return { id };
  },

  // QR Code operations
  async getQrCodes() {
    const snapshot = await collections.qrCodes.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getQrCodeById(id: string) {
    const doc = await collections.qrCodes.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createQrCode(data: any) {
    const docRef = await collections.qrCodes.add(data);
    return { id: docRef.id, ...data };
  },

  async updateQrCode(id: string, data: any) {
    await collections.qrCodes.doc(id).update(data);
    return { id, ...data };
  },

  async deleteQrCode(id: string) {
    await collections.qrCodes.doc(id).delete();
    return { id };
  },

  // Notification operations
  async getNotifications() {
    const snapshot = await collections.notifications.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getNotificationsByUser(userId: string) {
    const snapshot = await collections.notifications
      .where("userId", "==", userId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createNotification(data: any) {
    const docRef = await collections.notifications.add(data);
    return { id: docRef.id, ...data };
  },

  async updateNotification(id: string, data: any) {
    await collections.notifications.doc(id).update(data);
    return { id, ...data };
  },

  async deleteNotification(id: string) {
    await collections.notifications.doc(id).delete();
    return { id };
  },

  // Task operations
  async getTasks() {
    const snapshot = await collections.tasks.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getTaskById(id: string) {
    const doc = await collections.tasks.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createTask(data: any) {
    const docRef = await collections.tasks.add(data);
    return { id: docRef.id, ...data };
  },

  async updateTask(id: string, data: any) {
    await collections.tasks.doc(id).update(data);
    return { id, ...data };
  },

  async deleteTask(id: string) {
    await collections.tasks.doc(id).delete();
    return { id };
  },

  // Team operations
  async getTeams() {
    const snapshot = await collections.teams.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getTeamById(id: string) {
    const doc = await collections.teams.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createTeam(data: any) {
    const docRef = await collections.teams.add(data);
    return { id: docRef.id, ...data };
  },

  async updateTeam(id: string, data: any) {
    await collections.teams.doc(id).update(data);
    return { id, ...data };
  },

  async deleteTeam(id: string) {
    await collections.teams.doc(id).delete();
    return { id };
  }
}; 