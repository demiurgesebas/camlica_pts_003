import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { smsService } from "./smsService";
import { createFirebaseUser, updateFirebaseUser, deleteFirebaseUser } from "./firebase";
import { setupFirebaseAuth, authenticateFirebase, requireAdmin, requireSuperAdmin, requirePersonnel } from "./firebaseAuth";
import { firebaseStorage } from "./firebaseStorage";
import { z } from "zod";
import {
  insertBranchSchema,
  insertDepartmentSchema,
  insertPersonnelSchema,
  insertShiftSchema,
  insertShiftAssignmentSchema,
  insertLeaveRequestSchema,
  insertQrCodeSchema,
  insertAttendanceRecordSchema,
  insertNotificationSchema,
} from "@shared/schema";
import { nanoid } from "nanoid";
import multer from "multer";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import healthRouter from "./routes/health";

// Debug endpoint - Firebase'daki vardiya atamalarını kontrol et
async function addDebugEndpoint(app: Express) {
  app.get("/api/debug/firebase-assignments", authenticateFirebase, async (req, res) => {
    try {
      const assignments = await storage.getShiftAssignments();
      res.json({
        count: assignments.length,
        sample: assignments.slice(0, 3),
        allData: assignments
      });
    } catch (error) {
      console.error("Debug endpoint hatası:", error);
      res.status(500).json({ error: "Firebase verisi alınamadı" });
    }
  });
}

// PDF dilekçe oluşturma fonksiyonu
async function generatePetitionPDF(leaveRequest: any, personnel: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.276, 841.89]); // A4 boyutu

  // Helvetica fontlarını kullanacağız ve Türkçe karakterleri daha iyi görünüm için değiştireceğiz
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 80; // Kenarlarda 80 pt boşluk
  const fontSize = 12;
  const titleFontSize = 16;
  const lineHeight = 24;

  // Türkçe karakterleri daha okunabilir şekilde değiştiren fonksiyon
  function convertTurkishChars(text: string): string {
    return text
      .replace(/İ/g, "I")
      .replace(/ı/g, "i")
      .replace(/Ğ/g, "G")
      .replace(/ğ/g, "g")
      .replace(/Ü/g, "U")
      .replace(/ü/g, "u")
      .replace(/Ş/g, "S")
      .replace(/ş/g, "s")
      .replace(/Ç/g, "C")
      .replace(/ç/g, "c")
      .replace(/Ö/g, "O")
      .replace(/ö/g, "o");
  }

  // Metin yazma yardımcı fonksiyonu
  function drawText(
    text: string,
    x: number,
    y: number,
    options: { bold?: boolean; size?: number } = {},
  ) {
    const selectedFont = options.bold ? boldFont : font;
    const selectedSize = options.size || fontSize;

    page.drawText(convertTurkishChars(text), {
      x,
      y,
      size: selectedSize,
      font: selectedFont,
      color: rgb(0, 0, 0),
    });
  }

  let currentY = height - margin - 80;

  // Başlık - ortalanmış, basit
  const title = "PERSONEL IZIN DILEKÇESI";
  const titleWidth = boldFont.widthOfTextAtSize(
    convertTurkishChars(title),
    titleFontSize,
  );
  drawText(title, (width - titleWidth) / 2, currentY, {
    bold: true,
    size: titleFontSize,
  });

  currentY -= lineHeight * 3;

  // Kime
  drawText("Çamlıca Eğitim Kültür Vakfı Yönetimine;", margin, currentY, {
    bold: true,
  });

  currentY -= lineHeight * 2;

  // Ana paragraf
  const position = personnel.position || "görev unvanı";
  const startDate = formatDate(leaveRequest.startDate);
  const endDate = formatDate(leaveRequest.endDate);
  const totalDays = calculateDaysBetween(
    leaveRequest.startDate,
    leaveRequest.endDate,
  );
  const leaveType = getLeaveTypeText(leaveRequest.leaveType);

  // İlk satır
  drawText("Kurumunuzda ", margin, currentY);
  let currentX =
    margin +
    font.widthOfTextAtSize(convertTurkishChars("Kurumunuzda "), fontSize);

  drawText(`${position}`, currentX, currentY, { bold: true });
  currentX += boldFont.widthOfTextAtSize(
    convertTurkishChars(`${position}`),
    fontSize,
  );

  drawText(" olarak görev yapmaktayım. ", currentX, currentY);
  currentX += font.widthOfTextAtSize(
    convertTurkishChars(" olarak görev yapmaktayım. "),
    fontSize,
  );

  drawText(`${startDate}`, currentX, currentY, { bold: true });
  currentY -= lineHeight;

  // İkinci satır
  drawText("tarihinden ", margin, currentY);
  currentX =
    margin +
    font.widthOfTextAtSize(convertTurkishChars("tarihinden "), fontSize);

  drawText(`${endDate}`, currentX, currentY, { bold: true });
  currentX += boldFont.widthOfTextAtSize(endDate, fontSize);

  drawText(" tarihine kadar, toplam ", currentX, currentY);
  currentX += font.widthOfTextAtSize(
    convertTurkishChars(" tarihine kadar, toplam "),
    fontSize,
  );

  drawText(`${totalDays}`, currentX, currentY, { bold: true });
  currentX += boldFont.widthOfTextAtSize(totalDays.toString(), fontSize);

  drawText(" gün ", currentX, currentY);
  currentY -= lineHeight;

  // Üçüncü satır - izin türü kalın
  drawText(` ${leaveType}`, margin, currentY, { bold: true });
  currentX =
    margin +
    boldFont.widthOfTextAtSize(convertTurkishChars(` ${leaveType}`), fontSize);

  drawText(" izni kullanmak istiyorum.", currentX, currentY);
  currentY -= lineHeight;

  drawText(
    "İlgili tarihler arasında izinli sayılmam hususunda gereğini arz ederim.",
    margin,
    currentY,
  );

  currentY -= lineHeight * 2;

  drawText("Saygılarımla,", margin, currentY);

  currentY -= lineHeight * 6;

  // Personel bilgileri - basit liste
  const personalInfo = [
    `Adı Soyadı : ${personnel.firstName} ${personnel.lastName}`,
    `T.C. Kimlik No: ${personnel.tcNo || "T.C. Numaranız"}`,
    `Görev Unvanı : ${personnel.position || "Unvanınızı Yazınız"}`,
    `Birim : ${personnel.department || "Çalıştığınız Birim"}`,
    `Tarih : ${formatDate(new Date())}`,
  ];

  personalInfo.forEach((info) => {
    drawText(info, margin, currentY, { bold: true });
    currentY -= lineHeight;
  });

  currentY -= lineHeight * 2;

  // İmza alanı - basit
  drawText("İmza :", margin, currentY, { bold: true });

  return await pdfDoc.save();
}

// Yardımcı fonksiyonlar
function formatDate(date: Date | string) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function calculateDaysBetween(
  startDate: Date | string,
  endDate: Date | string,
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
}

function getLeaveTypeText(leaveType: string) {
  const types: { [key: string]: string } = {
    yillik: "yillik",
    mazeret: "mazeret",
    saglik: "saglik",
    ucretsiz: "ucretsiz",
    dogum: "dogum",
    evlilik: "evlilik",
  };
  return types[leaveType] || leaveType;
}

// Multer ayarları - dosya yükleme için
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.includes("spreadsheet") ||
      file.mimetype.includes("excel") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Sadece Excel dosyaları kabul edilir"), false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase Authentication is already setup in index.ts
  // Just add the existing routes here

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateFirebase, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Dashboard istatistikleri alınamadı" });
    }
  });

  // User Management Routes - Admin or Super Admin only
  app.get("/api/users", authenticateFirebase, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Kullanıcılar alınamadı" });
    }
  });

  app.post("/api/users", authenticateFirebase, requireAdmin, async (req, res) => {
    try {
      const { username, password, firstName, lastName, email, role, permissions } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email ve şifre gerekli" });
      }

      console.log("Creating user with Firebase Authentication...");
      
      // Firebase Authentication'da kullanıcı oluştur
      const firebaseUser = await createFirebaseUser({
        email,
        password,
        displayName: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
        role: role || 'personnel',
        permissions: permissions || []
      });
      
      console.log("Firebase user created, now creating in Firestore...");
      
      // Firestore'da kullanıcı bilgilerini kaydet
      const user = await storage.upsertUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: role || 'personnel',
        permissions: permissions || [],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("User created successfully:", user.id);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Firebase hatası varsa daha detaylı hata mesajı
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: "Bu email adresi zaten kullanımda" });
      } else if (error.code === 'auth/invalid-email') {
        return res.status(400).json({ message: "Geçersiz email adresi" });
      } else if (error.code === 'auth/weak-password') {
        return res.status(400).json({ message: "Şifre çok zayıf (en az 6 karakter gerekli)" });
      }
      
      res.status(500).json({ message: "Kullanıcı oluşturulamadı: " + error.message });
    }
  });

  app.patch("/api/users/:id/role", authenticateFirebase, requireSuperAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { role } = req.body;
      
      if (!['super_admin', 'admin', 'personnel'].includes(role)) {
        return res.status(400).json({ message: "Geçersiz rol" });
      }

      console.log("Updating user role in Firebase and Firestore...");
      
      // Firebase Custom Claims güncelle
      await updateFirebaseUser(id, { role });
      
      // Firestore'daki kullanıcı verilerini güncelle
      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Kullanıcı rolü güncellenemedi" });
    }
  });

  app.patch("/api/users/:id/status", authenticateFirebase, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await storage.updateUserStatus(id, isActive);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Kullanıcı durumu güncellenemedi" });
    }
  });

  app.patch("/api/users/:id/permissions", authenticateFirebase, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "Geçersiz izin formatı" });
      }
      
      console.log("Updating user permissions in Firebase and Firestore...");
      
      // Firebase Custom Claims güncelle
      await updateFirebaseUser(id, { permissions });
      
      // Firestore'daki kullanıcı verilerini güncelle
      const user = await storage.updateUserPermissions(id, permissions);
      res.json(user);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ message: "Kullanıcı izinleri güncellenemedi" });
    }
  });

  app.patch("/api/users/:id/password", authenticateFirebase, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Şifre gerekli" });
      }
      
      console.log("Updating user password in Firebase Authentication...");
      
      // Firebase Authentication'da şifre güncelle
      await updateFirebaseUser(id, { password });
      
      // Firestore'da da şifre güncelle (backup için)
      const user = await storage.updateUserPassword(id, password);
      res.json(user);
    } catch (error) {
      console.error("Error updating user password:", error);
      
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      } else if (error.code === 'auth/weak-password') {
        return res.status(400).json({ message: "Şifre çok zayıf (en az 6 karakter gerekli)" });
      }
      
      res.status(500).json({ message: "Şifre güncellenemedi: " + error.message });
    }
  });

  app.delete("/api/users/:id", authenticateFirebase, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log("Deleting user from Firebase Authentication and Firestore...");
      
      // Firebase Authentication'dan kullanıcı sil
      await deleteFirebaseUser(id);
      
      // Firestore'dan kullanıcı sil
      await storage.deleteUser(id);
      
      res.json({ message: "Kullanıcı başarıyla silindi" });
    } catch (error) {
      console.error("Error deleting user:", error);
      
      if (error.code === 'auth/user-not-found') {
        // Firebase'da kullanıcı bulunamadı, sadece Firestore'dan sil
        await storage.deleteUser(id);
        res.json({ message: "Kullanıcı başarıyla silindi" });
      } else {
        res.status(500).json({ message: "Kullanıcı silinemedi: " + error.message });
      }
    }
  });

  // Branch routes - admin yetkisi gerekli
  app.get("/api/branches", authenticateFirebase, requireAdmin, async (req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Şubeler alınamadı" });
    }
  });

  app.post("/api/branches", authenticateFirebase, async (req, res) => {
    try {
      const branchData = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(branchData);
      res.status(201).json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Geçersiz şube bilgileri", errors: error.errors });
      } else {
        res.status(500).json({ message: "Şube oluşturulamadı" });
      }
    }
  });

  app.get("/api/branches/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const branch = await storage.getBranchById(id);
      if (!branch) {
        return res.status(404).json({ message: "Şube bulunamadı" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error fetching branch:", error);
      res.status(500).json({ message: "Şube bilgileri alınamadı" });
    }
  });

  app.put("/api/branches/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const branchData = insertBranchSchema.partial().parse(req.body);
      const branch = await storage.updateBranch(id, branchData);
      res.json(branch);
    } catch (error) {
      console.error("Error updating branch:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Geçersiz şube bilgileri", errors: error.errors });
      } else {
        res.status(500).json({ message: "Şube güncellenemedi" });
      }
    }
  });

  app.delete("/api/branches/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBranch(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting branch:", error);
      res.status(500).json({ message: "Şube silinemedi" });
    }
  });

  // Department routes
  app.get("/api/departments", authenticateFirebase, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Birimler alınamadı" });
    }
  });

  app.post("/api/departments", authenticateFirebase, async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Geçersiz birim bilgileri", errors: error.errors });
      } else {
        res.status(500).json({ message: "Birim oluşturulamadı" });
      }
    }
  });

  app.get("/api/departments/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartmentById(id);
      if (!department) {
        return res.status(404).json({ message: "Birim bulunamadı" });
      }
      res.json(department);
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({ message: "Birim bilgileri alınamadı" });
    }
  });

  app.put("/api/departments/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, departmentData);
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Geçersiz birim bilgileri", errors: error.errors });
      } else {
        res.status(500).json({ message: "Birim güncellenemedi" });
      }
    }
  });

  app.delete("/api/departments/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDepartment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Birim silinemedi" });
    }
  });

  app.get(
    "/api/departments/branch/:branchId",
    authenticateFirebase,
    async (req, res) => {
      try {
        const branchId = parseInt(req.params.branchId);
        const departments = await storage.getDepartmentsByBranchId(branchId);
        res.json(departments);
      } catch (error) {
        console.error("Error fetching departments by branch:", error);
        res.status(500).json({ message: "Şube birimleri alınamadı" });
      }
    },
  );

  // Teams routes
  app.get("/api/teams", authenticateFirebase, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Ekip listesi alınamadı" });
    }
  });

  app.post("/api/teams", authenticateFirebase, async (req, res) => {
    try {
      const team = await storage.createTeam(req.body);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Ekip oluşturulamadı" });
    }
  });

  app.put("/api/teams/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.updateTeam(id, req.body);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Ekip güncellenemedi" });
    }
  });

  app.delete("/api/teams/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Ekip silinemedi" });
    }
  });

  app.get("/api/teams/branch/:branchId", authenticateFirebase, async (req, res) => {
    try {
      const branchId = parseInt(req.params.branchId);
      const teams = await storage.getTeamsByBranchId(branchId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams by branch:", error);
      res.status(500).json({ message: "Şube ekipleri alınamadı" });
    }
  });

  // Personnel routes
  app.get("/api/personnel", authenticateFirebase, async (req, res) => {
    try {
      const personnel = await storage.getPersonnel();
      res.json(personnel);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      res.status(500).json({ message: "Personel listesi alınamadı" });
    }
  });

  // Calculate and update annual leave for personnel
  app.post("/api/personnel/:id/calculate-annual-leave", authenticateFirebase, requireAdmin, async (req, res) => {
    try {
      const personnelId = parseInt(req.params.id);
      const updatedPersonnel = await storage.updatePersonnelAnnualLeave(personnelId);
      res.json(updatedPersonnel);
    } catch (error) {
      console.error("Error calculating annual leave:", error);
      res.status(500).json({ message: error.message || "Yıllık izin hesaplanamadı" });
    }
  });

  // Update all personnel annual leave
  app.post("/api/personnel/calculate-all-annual-leave", authenticateFirebase, requireSuperAdmin, async (req, res) => {
    try {
      await storage.updateAllPersonnelAnnualLeave();
      res.json({ message: "Tüm personelin yıllık izinleri güncellendi" });
    } catch (error) {
      console.error("Error updating all personnel annual leave:", error);
      res.status(500).json({ message: "Yıllık izinler güncellenemedi" });
    }
  });

  // Personnel with current shift info (dynamic)
  app.get(
    "/api/personnel/with-current-shifts",
    authenticateFirebase,
    async (req, res) => {
      try {
        const date = req.query.date as string; // Optional date parameter
        const personnel = await storage.getPersonnelListWithCurrentShifts(date);
        res.json(personnel);
      } catch (error) {
        console.error("Error fetching personnel with current shifts:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch personnel with current shifts" });
      }
    },
  );

  // Single personnel with current shift info
  app.get(
    "/api/personnel/:id/current-shift",
    authenticateFirebase,
    async (req, res) => {
      try {
        const personnelId = parseInt(req.params.id);

        // Validate personnelId
        if (isNaN(personnelId) || personnelId <= 0) {
          return res.status(400).json({ message: "Invalid personnel ID" });
        }

        const date = req.query.date as string; // Optional date parameter
        const personnel = await storage.getPersonnelWithCurrentShift(
          personnelId,
          date,
        );
        res.json(personnel);
      } catch (error) {
        console.error("Error fetching personnel current shift:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch personnel current shift" });
      }
    },
  );

  app.post("/api/personnel", authenticateFirebase, async (req, res) => {
    try {
      console.log("Received personnel data:", req.body);
      console.log(
        "TeamId type:",
        typeof req.body.teamId,
        "Value:",
        req.body.teamId,
      );
      console.log(
        "ShiftId type:",
        typeof req.body.shiftId,
        "Value:",
        req.body.shiftId,
      );

      // Transform data before validation - handle all possible null/none/empty values
      const safeNumberTransform = (value: any) => {
        if (
          value === null ||
          value === undefined ||
          value === "none" ||
          value === "" ||
          value === "null"
        ) {
          return null;
        }
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      const transformedData = {
        ...req.body,
        teamId: safeNumberTransform(req.body.teamId),
        shiftId: safeNumberTransform(req.body.shiftId),
        departmentId: safeNumberTransform(req.body.departmentId),
        branchId: Number(req.body.branchId),
      };

      console.log("Transformed data:", transformedData);

      const personnelData = insertPersonnelSchema.parse(transformedData);
      const personnel = await storage.createPersonnel(personnelData);
      res.status(201).json(personnel);
    } catch (error) {
      console.error("Error creating personnel:", error);
      if (error instanceof z.ZodError) {
        console.error(
          "Zod validation errors:",
          JSON.stringify(error.errors, null, 2),
        );
        res
          .status(400)
          .json({
            message: "Geçersiz personel bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "Personel oluşturulamadı" });
      }
    }
  });

  app.get("/api/personnel/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const personnel = await storage.getPersonnelById(id);
      if (!personnel) {
        return res.status(404).json({ message: "Personel bulunamadı" });
      }
      res.json(personnel);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      res.status(500).json({ message: "Personel bilgileri alınamadı" });
    }
  });

  app.put("/api/personnel/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Transform data before validation - handle all possible null/none/empty values
      const safeNumberTransform = (value: any) => {
        if (
          value === null ||
          value === undefined ||
          value === "none" ||
          value === "" ||
          value === "null"
        ) {
          return null;
        }
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      const transformedData = {
        ...req.body,
        teamId: safeNumberTransform(req.body.teamId),
        shiftId: safeNumberTransform(req.body.shiftId),
        departmentId: safeNumberTransform(req.body.departmentId),
        branchId: req.body.branchId
          ? Number(req.body.branchId)
          : req.body.branchId,
      };

      const personnelData = insertPersonnelSchema
        .partial()
        .parse(transformedData);
      const personnel = await storage.updatePersonnel(id, personnelData);
      res.json(personnel);
    } catch (error) {
      console.error("Error updating personnel:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz personel bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "Personel güncellenemedi" });
      }
    }
  });

  app.delete("/api/personnel/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePersonnel(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting personnel:", error);
      res.status(500).json({ message: "Personel silinemedi" });
    }
  });

  // Shift routes
  app.get("/api/shifts", authenticateFirebase, async (req, res) => {
    try {
      const shifts = await storage.getShifts();
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Vardiya listesi alınamadı" });
    }
  });

  app.post("/api/shifts", authenticateFirebase, async (req, res) => {
    try {
      const shiftData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(shiftData);
      res.status(201).json(shift);
    } catch (error) {
      console.error("Error creating shift:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz vardiya bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "Vardiya oluşturulamadı" });
      }
    }
  });

  // Shift assignment routes
  app.get("/api/shift-assignments", authenticateFirebase, async (req, res) => {
    try {
      console.log("🔍 Shift assignments çekiliyor...");
      const assignments = await storage.getShiftAssignments();
      console.log(`📊 Bulunan vardiya ataması sayısı: ${assignments.length}`);
      
      // İlk birkaç assignment'ı debug için logla
      if (assignments.length > 0) {
        console.log("📋 İlk 3 assignment:", assignments.slice(0, 3));
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("❌ Error fetching shift assignments:", error);
      res.status(500).json({ message: "Vardiya atamaları alınamadı" });
    }
  });

  app.get("/api/shift-assignments/today", authenticateFirebase, async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const assignments = await storage.getShiftAssignmentsByDate(today);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching today's shift assignments:", error);
      res.status(500).json({ message: "Bugünün vardiya atamaları alınamadı" });
    }
  });

  app.get(
    "/api/shift-assignments/personnel/:id",
    authenticateFirebase,
    async (req, res) => {
      try {
        const personnelId = parseInt(req.params.id);
        if (isNaN(personnelId)) {
          return res.status(400).json({ message: "Geçersiz personel ID" });
        }
        const assignments =
          await storage.getShiftAssignmentsByPersonnelId(personnelId);
        res.json(assignments);
      } catch (error) {
        console.error("Error fetching personnel shift assignments:", error);
        res
          .status(500)
          .json({ message: "Personel vardiya atamaları alınamadı" });
      }
    },
  );

  app.post("/api/shift-assignments", authenticateFirebase, async (req, res) => {
    try {
      const assignmentData = insertShiftAssignmentSchema.parse(req.body);
      const assignment = await storage.createShiftAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating shift assignment:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz vardiya atama bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "Vardiya ataması oluşturulamadı" });
      }
    }
  });

  // Toplu vardiya ataması silme endpoint'i
  app.post(
    "/api/shift-assignments/bulk-delete",
    authenticateFirebase,
    async (req, res) => {
      try {
        const { assignmentIds } = req.body;

        if (
          !assignmentIds ||
          !Array.isArray(assignmentIds) ||
          assignmentIds.length === 0
        ) {
          return res
            .status(400)
            .json({ error: "Silinecek vardiya ataması ID'leri gerekli" });
        }

        let deletedCount = 0;
        const errors = [];

        for (const id of assignmentIds) {
          try {
            await storage.deleteShiftAssignment(parseInt(id));
            deletedCount++;
          } catch (error) {
            errors.push({
              id,
              error: error instanceof Error ? error.message : "Bilinmeyen hata",
            });
          }
        }

        res.json({
          success: true,
          deleted: deletedCount,
          errors: errors.length,
          data: {
            deletedCount,
            errors,
          },
        });
      } catch (error) {
        console.error("Toplu vardiya ataması silme hatası:", error);
        res.status(500).json({ error: "Vardiya atamaları silinemedi" });
      }
    },
  );

  // Excel yükleme endpoint'leri
  app.post(
    "/api/shifts/upload-excel",
    authenticateFirebase,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Dosya bulunamadı" });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let errorCount = 0;

        const personnel = await storage.getPersonnel();
        const branches = await storage.getBranches();
        const shifts = await storage.getShifts();

        for (const row of data as any[]) {
          try {
            const personnelName =
              row["Personel"] ||
              row["Ad Soyad"] ||
              row["İsim"] ||
              row["Ad"] ||
              row["Çalışan"];
            const date = row["Tarih"] || row["Date"] || row["Gün"];
            const shiftName =
              row["Vardiya"] ||
              row["Shift"] ||
              row["Mesai"] ||
              row["Çalışma Saati"];
            const notes = row["Açıklama"] || row["Not"] || row["Notlar"] || "";
            const position = row["Pozisyon"] || row["Görev"] || "";
            const branch = row["Şube"] || row["Lokasyon"] || "";

            // İzin ve rapor durumları için özel kontrol
            if (
              shiftName &&
              (shiftName.toLowerCase().includes("izin") ||
                shiftName.toLowerCase().includes("rapor") ||
                shiftName.toLowerCase().includes("yok"))
            ) {
              errorCount++; // İzin/rapor durumları vardiya ataması yapmayacağımız için skip
              continue;
            }

            if (!personnelName || !date || !shiftName) {
              errorCount++;
              continue;
            }

            const foundPersonnel = personnel.find(
              (p) =>
                `${p.firstName} ${p.lastName}`
                  .toLowerCase()
                  .includes(personnelName.toLowerCase()) ||
                p.employeeNumber === personnelName,
            );

            if (!foundPersonnel) {
              errorCount++;
              continue;
            }

            let parsedDate: Date;
            if (typeof date === "number") {
              parsedDate = new Date((date - 25569) * 86400 * 1000);
            } else {
              parsedDate = new Date(date);
            }

            if (isNaN(parsedDate.getTime())) {
              errorCount++;
              continue;
            }

            let shift = shifts.find(
              (s) => s.name.toLowerCase() === shiftName.toLowerCase(),
            );

            if (!shift) {
              const newShift = await storage.createShift({
                name: shiftName,
                startTime: shiftName.includes("Gece")
                  ? "23:00"
                  : shiftName.includes("Akşam")
                    ? "16:00"
                    : "08:00",
                endTime: shiftName.includes("Gece")
                  ? "07:00"
                  : shiftName.includes("Akşam")
                    ? "00:00"
                    : "16:00",
                branchId: foundPersonnel.branchId || branches[0]?.id || 1,
                isActive: true,
              });
              shift = newShift;
              shifts.push(shift);
            }

            await storage.createShiftAssignment({
              personnelId: foundPersonnel.id,
              shiftId: shift.id,
              assignedDate: parsedDate.toISOString().split("T")[0],
              status: "active",
            });

            successCount++;
          } catch (rowError) {
            errorCount++;
          }
        }

        res.json({
          message: `${successCount} vardiya ataması oluşturuldu, ${errorCount} hata oluştu`,
          count: successCount,
          errors: errorCount,
        });
      } catch (error) {
        console.error("Excel yükleme hatası:", error);
        res
          .status(500)
          .json({ message: "Excel dosyası işlenirken hata oluştu" });
      }
    },
  );

  app.get("/api/shifts/template", (req, res) => {
    try {
      // Aylık vardiya şablonu oluştur
      const templateData = [];
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // Sonraki ay

      // Örnek personel listesi
      const samplePersonnel = [
        "Ahmet Yılmaz",
        "Mehmet Demir",
        "Ayşe Kaya",
        "Fatma Şahin",
        "Ali Özkan",
        "Zeynep Çelik",
        "Hasan Kurt",
        "Elif Güneş",
      ];

      // Vardiya türleri
      const shiftTypes = ["Gündüz", "Akşam", "Gece", "İzin", "Rapor"];

      // Ayın her günü için örnek veriler oluştur
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= Math.min(daysInMonth, 31); day++) {
        const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

        samplePersonnel.forEach((person, index) => {
          // Her personel için farklı vardiya deseni oluştur
          let shiftType;
          if (day % 7 === 0 || day % 7 === 6) {
            // Hafta sonu
            shiftType = index % 2 === 0 ? "İzin" : "Gündüz";
          } else {
            switch (index % 3) {
              case 0:
                shiftType = "Gündüz";
                break;
              case 1:
                shiftType = "Akşam";
                break;
              case 2:
                shiftType = "Gece";
                break;
            }
          }

          templateData.push({
            Personel: person,
            Tarih: dateStr,
            Vardiya: shiftType,
            Açıklama: shiftType === "İzin" ? "Haftalık izin" : "",
            Şube: "Çamlıca",
            Pozisyon: index % 2 === 0 ? "Güvenlik" : "Temizlik",
          });
        });
      }

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vardiya Şablonu");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="vardiya_sablonu.xlsx"',
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.send(buffer);
    } catch (error) {
      console.error("Şablon oluşturma hatası:", error);
      res.status(500).json({ message: "Şablon oluşturulamadı" });
    }
  });

  // Leave request routes
  app.get("/api/leave-requests", authenticateFirebase, async (req, res) => {
    try {
      const requests = await storage.getLeaveRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "İzin talepleri alınamadı" });
    }
  });

  app.get("/api/leave-requests/pending", authenticateFirebase, async (req, res) => {
    try {
      const requests = await storage.getPendingLeaveRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending leave requests:", error);
      res.status(500).json({ message: "Bekleyen izin talepleri alınamadı" });
    }
  });

  app.post("/api/leave-requests", authenticateFirebase, async (req, res) => {
    try {
      console.log("İzin talebi oluşturma isteği:", req.body);
      console.log("User info:", req.user);
      const requestData = insertLeaveRequestSchema.parse(req.body);
      const request = await storage.createLeaveRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating leave request:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz izin talebi bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "İzin talebi oluşturulamadı" });
      }
    }
  });

  app.put(
    "/api/leave-requests/:id/approve",
    authenticateFirebase,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.claims.sub;
        const request = await storage.approveLeaveRequest(id, userId);
        res.json(request);
      } catch (error) {
        console.error("Error approving leave request:", error);
        res.status(500).json({ message: "İzin talebi onaylanamadı" });
      }
    },
  );

  // PDF dilekçe indirme endpoint'i
  app.get(
    "/api/leave-requests/:id/download-petition",
    authenticateFirebase,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const leaveRequest = await storage.getLeaveRequestById(id);

        if (!leaveRequest) {
          return res.status(404).json({ message: "İzin talebi bulunamadı" });
        }

        if (leaveRequest.status !== "approved") {
          return res
            .status(400)
            .json({
              message:
                "Sadece onaylanmış izin talepleri için dilekçe indirilebilir",
            });
        }

        const personnel = await storage.getPersonnelById(
          leaveRequest.personnelId,
        );
        if (!personnel) {
          return res.status(404).json({ message: "Personel bulunamadı" });
        }

        const pdfBytes = await generatePetitionPDF(leaveRequest, personnel);

        // Dosya adından Türkçe karakterleri temizle
        const sanitizedFirstName = personnel.firstName.replace(
          /[^a-zA-Z0-9]/g,
          "_",
        );
        const sanitizedLastName = personnel.lastName.replace(
          /[^a-zA-Z0-9]/g,
          "_",
        );
        const sanitizedDate = formatDate(leaveRequest.startDate).replace(
          /\//g,
          "_",
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="izin_dilekce_${sanitizedFirstName}_${sanitizedLastName}_${sanitizedDate}.pdf"`,
        );
        res.send(Buffer.from(pdfBytes));
      } catch (error) {
        console.error("Error generating petition PDF:", error);
        res.status(500).json({ message: "Dilekçe PDF'i oluşturulamadı" });
      }
    },
  );

  app.put(
    "/api/leave-requests/:id/reject",
    authenticateFirebase,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.claims.sub;
        const { reason } = req.body;
        if (!reason) {
          return res.status(400).json({ message: "Ret nedeni gereklidir" });
        }
        const request = await storage.rejectLeaveRequest(id, userId, reason);
        res.json(request);
      } catch (error) {
        console.error("Error rejecting leave request:", error);
        res.status(500).json({ message: "İzin talebi reddedilemedi" });
      }
    },
  );

  app.get(
    "/api/personnel/:id/leave-requests",
    authenticateFirebase,
    async (req, res) => {
      try {
        const personnelId = parseInt(req.params.id);
        const leaveRequests =
          await storage.getLeaveRequestsByPersonnelId(personnelId);
        res.json(leaveRequests);
      } catch (error) {
        console.error("Error fetching personnel leave requests:", error);
        res.status(500).json({ message: "Personel izin talepleri alınamadı" });
      }
    },
  );

  // QR code routes
  app.get("/api/qr-codes/active", authenticateFirebase, async (req, res) => {
    try {
      const { screenId } = req.query;
      let qrCodes;
      
      if (screenId) {
        // Belirli bir ekran için QR kodları getir
        const qrCode = await storage.getQrCodeByScreen(screenId as string);
        qrCodes = qrCode ? [qrCode] : [];
      } else {
        // Sadece manuel oluşturulan QR kodları getir (screenId olmayan)
        qrCodes = await storage.getActiveQrCodes();
        qrCodes = qrCodes.filter((code: any) => !code.screenId);
      }
      
      res.json(qrCodes);
    } catch (error) {
      console.error("Error fetching active QR codes:", error);
      res.status(500).json({ message: "Aktif QR kodlar alınamadı" });
    }
  });

  app.post("/api/qr-codes", authenticateFirebase, async (req, res) => {
    try {
      const { branchId, expiryMinutes = 1 } = req.body;
      const code = nanoid(10);
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Cleanup expired QR codes before creating new one
      await storage.cleanupExpiredQrCodes();

      const qrCode = await storage.createQrCode({
        branchId,
        code,
        expiresAt,
        isActive: true,
      });

      res.status(201).json(qrCode);
    } catch (error) {
      console.error("Error creating QR code:", error);
      res.status(500).json({ message: "QR kod oluşturulamadı" });
    }
  });

  // Ekran bazlı QR kod servisi
  app.get("/api/qr-codes/screen/:screenId", async (req, res) => {
    try {
      const screenId = req.params.screenId;
      console.log(`QR CODE REQUEST for screen: ${screenId}`);
      
      const qrCode = await storage.getQrCodeByScreen(screenId);
      console.log(`Existing QR code for screen ${screenId}:`, qrCode);

      if (!qrCode) {
        // Eğer bu ekran için QR kod yoksa yeni bir tane oluştur
        console.log(`Creating new QR code for screen: ${screenId}`);
        const newQrCode = await storage.createQrCodeForScreen(screenId);
        console.log(`New QR code created:`, newQrCode);
        
        const branch = await storage.getBranchById(newQrCode.branchId || 2);

        const response = {
          ...newQrCode,
          branchName: branch?.name || "Ana Şube",
        };
        console.log(`Response for screen ${screenId}:`, response);
        res.json(response);
      } else {
        const branch = await storage.getBranchById(qrCode.branchId || 2);

        const response = {
          ...qrCode,
          branchName: branch?.name || "Ana Şube",
        };
        console.log(`Response for screen ${screenId}:`, response);
        res.json(response);
      }
    } catch (error) {
      console.error("Error fetching screen QR code:", error);
      res.status(500).json({ message: "Ekran QR kodu alınırken hata oluştu" });
    }
  });

  // QR kod taramayı kaydet
  app.post("/api/qr-codes/scan", async (req, res) => {
    try {
      const { code, personnelId } = req.body;

      // QR kodu kontrol et
      const qrCode = await storage.getQrCodeByCode(code);
      if (!qrCode) {
        return res.status(404).json({ message: "QR kod bulunamadı" });
      }

      // QR kod süresi dolmuş mu kontrol et
      if (new Date() > new Date(qrCode.expiresAt)) {
        return res.status(400).json({ message: "QR kod süresi dolmuş" });
      }

      // Hangi ekrandan okutulduğunu belirle
      let qrScreen = null;
      if (qrCode.screenId) {
        qrScreen = await storage.getQrScreenByScreenId(qrCode.screenId);
      }

      // Attendance kaydı oluştur
      const attendanceRecord = await storage.createAttendanceRecord({
        personnelId,
        qrCodeId: qrCode.id,
        qrScreenId: qrScreen?.id || null,
        checkInTime: new Date(),
        location: qrScreen?.name || qrCode.screenId || "Manuel QR",
        notes: qrScreen ? `QR Ekran: ${qrScreen.name} (ID: ${qrScreen.screenId})` : "Manuel QR kod ile giriş",
        date: new Date().toISOString().split("T")[0],
      });

      // Bu ekran için yeni QR kod oluştur
      await storage.expireQrCode(qrCode.id);
      if (qrCode.screenId) {
        await storage.createQrCodeForScreen(qrCode.screenId);
      }

      res.json({
        message: "Yoklama başarılı",
        attendanceRecord,
      });
    } catch (error) {
      console.error("Error processing QR scan:", error);
      res
        .status(500)
        .json({ message: "QR kod taraması işlenirken hata oluştu" });
    }
  });

  // Tüm QR kodlarını sil
  app.delete("/api/qr-codes/all", authenticateFirebase, async (req, res) => {
    try {
      // Aktif QR kodlarını al ve hepsini expire et
      const activeQrCodes = await storage.getActiveQrCodes();
      for (const qrCode of activeQrCodes) {
        await storage.expireQrCode(qrCode.id);
      }
      
      res.json({ 
        message: "Tüm QR kodlar silindi",
        deletedCount: activeQrCodes.length 
      });
    } catch (error) {
      console.error("Error deleting all QR codes:", error);
      res.status(500).json({ message: "QR kodlar silinirken hata oluştu" });
    }
  });

  app.post("/api/qr-codes/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "QR kod gereklidir" });
      }

      const qrCode = await storage.getQrCodeByCode(code);
      if (!qrCode) {
        return res.status(404).json({ message: "QR kod bulunamadı" });
      }

      if (!qrCode.isActive || new Date() > qrCode.expiresAt) {
        return res
          .status(400)
          .json({ message: "QR kod geçersiz veya süresi dolmuş" });
      }

      res.json({ valid: true, qrCode });
    } catch (error) {
      console.error("Error validating QR code:", error);
      res.status(500).json({ message: "QR kod doğrulanamadı" });
    }
  });

  // Attendance record routes
  app.get("/api/attendance", authenticateFirebase, async (req, res) => {
    try {
      const records = await firebaseStorage.getAttendanceRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Devam kayıtları alınamadı" });
    }
  });

  app.get("/api/attendance/today", authenticateFirebase, async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const records = await firebaseStorage.getAttendanceRecordsByDate(today);
      res.json(records);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Bugünün devam kayıtları alınamadı" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const recordData = insertAttendanceRecordSchema.parse(req.body);
      const record = await firebaseStorage.createAttendanceRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz devam kayıt bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "Devam kaydı oluşturulamadı" });
      }
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateFirebase, async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Bildirimler alınamadı" });
    }
  });

  app.post("/api/notifications", authenticateFirebase, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification({
        ...notificationData,
        senderUserId: req.user.claims.sub,
      });
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
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
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res
        .status(500)
        .json({ message: "Bildirim okundu olarak işaretlenemedi" });
    }
  });

  // Leave request routes
  app.get("/api/leave-requests", authenticateFirebase, async (req, res) => {
    try {
      const leaveRequests = await storage.getLeaveRequests();
      res.json(leaveRequests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "İzin talepleri alınamadı" });
    }
  });

  app.post("/api/leave-requests", authenticateFirebase, async (req, res) => {
    try {
      const leaveRequestData = insertLeaveRequestSchema.parse(req.body);
      const leaveRequest = await storage.createLeaveRequest({
        ...leaveRequestData,
        requestedBy: req.user.claims.sub,
      });
      res.status(201).json(leaveRequest);
    } catch (error) {
      console.error("Error creating leave request:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz izin talebi bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "İzin talebi oluşturulamadı" });
      }
    }
  });

  app.get("/api/leave-requests/pending", authenticateFirebase, async (req, res) => {
    try {
      const pendingLeaveRequests = await storage.getPendingLeaveRequests();
      res.json(pendingLeaveRequests);
    } catch (error) {
      console.error("Error fetching pending leave requests:", error);
      res.status(500).json({ message: "Bekleyen izin talepleri alınamadı" });
    }
  });

  app.put(
    "/api/leave-requests/:id/approve",
    authenticateFirebase,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const approvedBy = req.user.claims.sub;
        const leaveRequest = await storage.approveLeaveRequest(id, approvedBy);
        res.json(leaveRequest);
      } catch (error) {
        console.error("Error approving leave request:", error);
        res.status(500).json({ message: "İzin talebi onaylanamadı" });
      }
    },
  );

  app.put(
    "/api/leave-requests/:id/reject",
    authenticateFirebase,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const approvedBy = req.user.claims.sub;
        const { reason } = req.body;
        const leaveRequest = await storage.rejectLeaveRequest(
          id,
          approvedBy,
          reason,
        );
        res.json(leaveRequest);
      } catch (error) {
        console.error("Error rejecting leave request:", error);
        res.status(500).json({ message: "İzin talebi reddedilemedi" });
      }
    },
  );

  // Personnel document routes
  app.get("/api/personnel/:id/documents", authenticateFirebase, async (req, res) => {
    try {
      const personnelId = parseInt(req.params.id);
      const documents = await storage.getPersonnelDocuments(personnelId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching personnel documents:", error);
      res.status(500).json({ message: "Personel belgeleri alınamadı" });
    }
  });

  app.get(
    "/api/personnel/:id/documents/:category",
    authenticateFirebase,
    async (req, res) => {
      try {
        const personnelId = parseInt(req.params.id);
        const category = req.params.category;
        const documents = await storage.getPersonnelDocumentsByCategory(
          personnelId,
          category,
        );
        res.json(documents);
      } catch (error) {
        console.error("Error fetching personnel documents by category:", error);
        res.status(500).json({ message: "Kategori belgeleri alınamadı" });
      }
    },
  );

  app.post(
    "/api/personnel/:id/documents",
    authenticateFirebase,
    async (req, res) => {
      try {
        const personnelId = parseInt(req.params.id);
        const user = req.user as any;

        console.log("Request body:", req.body);
        console.log("User info:", user);

        // Validate required fields
        const {
          documentType,
          documentCategory,
          fileName,
          filePath,
          fileSize,
          mimeType,
        } = req.body;

        if (
          !documentType ||
          !documentCategory ||
          !fileName ||
          !filePath ||
          !fileSize ||
          !mimeType
        ) {
          return res.status(400).json({
            message:
              "Eksik alanlar: documentType, documentCategory, fileName, filePath, fileSize, mimeType gerekli",
          });
        }

        const documentData = {
          personnelId,
          documentType,
          documentCategory,
          fileName,
          filePath,
          fileSize: parseInt(fileSize),
          mimeType,
          status: req.body.status || "pending",
          notes: req.body.notes || null,
          uploadedBy: user?.claims?.sub || user?.id || null,
        };

        console.log("Creating document with data:", documentData);
        const document = await storage.createPersonnelDocument(documentData);
        console.log("Document created successfully:", document);
        res.status(201).json(document);
      } catch (error: any) {
        console.error("Error creating personnel document:", error);
        console.error("Error details:", error.message, error.stack);
        res.status(500).json({
          message: "Belge yüklenemedi: " + (error.message || "Bilinmeyen hata"),
        });
      }
    },
  );

  app.put("/api/personnel-documents/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.updatePersonnelDocument(id, req.body);
      res.json(document);
    } catch (error) {
      console.error("Error updating personnel document:", error);
      res.status(500).json({ message: "Belge güncellenemedi" });
    }
  });

  app.delete(
    "/api/personnel-documents/:id",
    authenticateFirebase,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deletePersonnelDocument(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting personnel document:", error);
        res.status(500).json({ message: "Belge silinemedi" });
      }
    },
  );

  // Dosya görüntüleme endpoint'i (demo için base64 data URL döndürüyoruz)
  app.get("/api/documents/view/:id", authenticateFirebase, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const documents = await storage.getPersonnelDocuments(1); // Demo için
      const document = documents.find((doc: any) => doc.id === documentId);

      if (!document) {
        return res.status(404).json({ message: "Belge bulunamadı" });
      }

      // Demo amaçlı placeholder response
      res.json({
        fileName: document.fileName,
        mimeType: document.mimeType,
        message: "Dosya görüntüleme demo modda çalışıyor",
      });
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ message: "Belge görüntülenemedi" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", authenticateFirebase, async (req, res) => {
    try {
      const records = await firebaseStorage.getAttendanceRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Devam kayıtları alınamadı" });
    }
  });

  app.get("/api/attendance/today", authenticateFirebase, async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const records = await firebaseStorage.getAttendanceRecordsByDate(today);
      res.json(records);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Bugünkü devam kayıtları alınamadı" });
    }
  });

  app.get("/api/attendance/date/:date", authenticateFirebase, async (req, res) => {
    try {
      const date = req.params.date;
      const records = await firebaseStorage.getAttendanceRecordsByDate(date);
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance by date:", error);
      res
        .status(500)
        .json({ message: "Belirtilen tarih için devam kayıtları alınamadı" });
    }
  });

  app.get(
    "/api/attendance/range/:startDate/:endDate",
    authenticateFirebase,
    async (req, res) => {
      try {
        const { startDate, endDate } = req.params;
        const records = await firebaseStorage.getAttendanceRecordsByDateRange(
          startDate,
          endDate,
        );
        res.json(records);
      } catch (error) {
        console.error("Error fetching attendance by date range:", error);
        res
          .status(500)
          .json({
            message: "Belirtilen tarih aralığı için devam kayıtları alınamadı",
          });
      }
    },
  );

  app.get(
    "/api/attendance/personnel/:id",
    authenticateFirebase,
    async (req, res) => {
      try {
        const personnelId = parseInt(req.params.id);
        const records =
          await firebaseStorage.getAttendanceRecordsByPersonnelId(personnelId);
        res.json(records);
      } catch (error) {
        console.error("Error fetching attendance by personnel:", error);
        res.status(500).json({ message: "Personel devam kayıtları alınamadı" });
      }
    },
  );

  app.post("/api/attendance", authenticateFirebase, async (req, res) => {
    try {
      const attendanceData = insertAttendanceRecordSchema.parse(req.body);
      const record = await firebaseStorage.createAttendanceRecord(attendanceData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz devam kayıt bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "Devam kaydı oluşturulamadı" });
      }
    }
  });

  app.put("/api/attendance/:id", authenticateFirebase, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attendanceData = insertAttendanceRecordSchema
        .partial()
        .parse(req.body);
      const record = await storage.updateAttendanceRecord(id, attendanceData);
      res.json(record);
    } catch (error) {
      console.error("Error updating attendance record:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            message: "Geçersiz devam kayıt bilgileri",
            errors: error.errors,
          });
      } else {
        res.status(500).json({ message: "Devam kaydı güncellenemedi" });
      }
    }
  });

  // Excel dosyasından personel yükleme endpoint'i
  app.post("/api/excel/import-personnel", authenticateFirebase, async (req, res) => {
    try {
      const { fileName } = req.body;

      if (!fileName) {
        return res.status(400).json({ error: "fileName parametresi gerekli" });
      }

      // Dosya yolunu oluştur
      const filePath = path.join(process.cwd(), "attached_assets", fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Dosya bulunamadı" });
      }

      // Excel dosyasını oku
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Çamlıca şubesini bul
      const branches = await storage.getBranches();
      const camlicaBranch = branches.find((b) =>
        b.name.toLowerCase().includes("çamlıca"),
      );

      if (!camlicaBranch) {
        return res.status(404).json({ error: "Çamlıca şubesi bulunamadı" });
      }

      const importedPersonnel = [];
      const errors = [];

      // Personelleri işle (5. satırdan başla)
      for (let i = 5; i < data.length; i++) {
        const row = data[i] as any[];
        if (row[0] && row[1] && row[1].toString().trim() !== "") {
          try {
            const employeeId = row[0].toString();
            const fullName = row[1].toString().trim();

            // Ad ve soyadı ayır
            const nameParts = fullName.split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            // Personeli sisteme ekle
            const newPersonnel = await storage.createPersonnel({
              employeeNumber: employeeId,
              firstName: firstName,
              lastName: lastName,
              branchId: camlicaBranch.id,
              position: "Güvenlik Görevlisi", // Varsayılan pozisyon
              phone: "",
              email: "",
              address: "",
              hireDate: new Date().toISOString().split("T")[0],
              salary: 0,
            });

            importedPersonnel.push(newPersonnel);
          } catch (error) {
            errors.push({
              employeeId: row[0],
              name: row[1],
              error: error instanceof Error ? error.message : "Bilinmeyen hata",
            });
          }
        }
      }

      res.json({
        success: true,
        imported: importedPersonnel.length,
        errors: errors.length,
        data: {
          importedPersonnel,
          errors,
        },
      });
    } catch (error) {
      console.error("Excel personel yükleme hatası:", error);
      res.status(500).json({ error: "Excel dosyası işlenemedi" });
    }
  });

  // Excel dosyası yükleme ve vardiya import endpoint'i
  app.post(
    "/api/excel/upload-and-import-shifts",
    authenticateFirebase,
    upload.single("file"),
    async (req, res) => {
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: "Dosya yüklenmedi" });
        }

        const month = req.body.month
          ? parseInt(req.body.month)
          : new Date().getMonth() + 1;
        const year = req.body.year
          ? parseInt(req.body.year)
          : new Date().getFullYear();

        // Excel dosyasını oku
        const workbook = XLSX.read(file.buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedShiftAssignments = [];
        const errors = [];

        // Tarih başlıklarını al (4. satır)
        const dateHeaders = data[3] as any[];
        console.log("Date headers:", dateHeaders);

        // Tüm personelleri ve vardiyaları önceden yükle (performans optimizasyonu)
        const allPersonnel = await storage.getPersonnel();
        const allShifts = await storage.getShifts();
        
        // Vardiyaları cache'le
        const shiftCache = {
          morning: allShifts.find(s => 
            s.name.toLowerCase().includes("sabah") || 
            s.name.toLowerCase().includes("morning")
          ),
          evening: allShifts.find(s => 
            s.name.toLowerCase().includes("akşam") || 
            s.name.toLowerCase().includes("evening") || 
            s.name.toLowerCase().includes("gece")
          )
        };

        // Batch işlem için shift assignment listesi
        const shiftAssignmentsToCreate = [];
        const personnelUpdates = [];

        // Personelleri işle (5. satırdan başla)
        for (let i = 4; i < data.length; i++) {
          const row = data[i] as any[];
          if (row[0] && row[1] && row[1].toString().trim() !== "") {
            try {
              const employeeNumber = row[0].toString();
              console.log(
                "Processing employee:",
                employeeNumber,
                "Name:",
                row[1],
              );

              // Personeli bul (cache'den)
              const foundPersonnel = allPersonnel.find(
                (p) => p.employeeNumber === employeeNumber,
              );

              if (!foundPersonnel) {
                errors.push({
                  employeeNumber,
                  error: "Personel bulunamadı",
                });
                continue;
              }

              // Her gün için vardiya ataması oluştur
              for (
                let dayIndex = 2;
                dayIndex < Math.min(dateHeaders.length, 33);
                dayIndex++
              ) {
                const dayNumber = dateHeaders[dayIndex];
                if (
                  dayNumber &&
                  typeof dayNumber === "number" &&
                  dayNumber >= 1 &&
                  dayNumber <= 31
                ) {
                  const shiftValue = row[dayIndex];

                  if (shiftValue && shiftValue.toString().trim() !== "") {
                    const shiftCode = shiftValue
                      .toString()
                      .toUpperCase()
                      .trim();

                    // Tarih oluştur
                    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${dayNumber.toString().padStart(2, "0")}`;

                    // Vardiya türünü belirle
                    let shiftType = null;
                    let shiftId = null;
                    
                    if (shiftCode === "S") {
                      shiftType = "morning";
                      shiftId = shiftCache.morning?.id;
                    } else if (shiftCode === "A") {
                      shiftType = "evening";
                      shiftId = shiftCache.evening?.id;
                    } else if (shiftCode === "OF") {
                      shiftType = "off";
                    } else if (shiftCode === "Ç") {
                      shiftType = "working";
                    }

                    if (shiftType) {
                      // Shift assignment'i batch listesine ekle
                      shiftAssignmentsToCreate.push({
                        personnelId: foundPersonnel.id,
                        shiftId: shiftId,
                        assignedDate: dateStr,
                        date: dateStr,
                        shiftType: shiftType,
                        status: "assigned",
                        notes: `Excel'den import edildi (${shiftCode})`,
                      });

                      // Personelin varsayılan vardiya bilgisini güncelle (S veya A atamasında)
                      if (shiftId && (shiftCode === "S" || shiftCode === "A")) {
                        const existingUpdate = personnelUpdates.find(u => u.id === foundPersonnel.id);
                        if (!existingUpdate) {
                          personnelUpdates.push({
                            id: foundPersonnel.id,
                            shiftId: shiftId,
                          });
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              errors.push({
                employeeNumber: row[0],
                error:
                  error instanceof Error ? error.message : "Bilinmeyen hata",
              });
            }
          }
        }

        // Batch işlem: Tüm shift assignment'ları Firebase'a kaydet
        console.log(`📝 Toplam kaydedilecek vardiya ataması: ${shiftAssignmentsToCreate.length}`);
        let successfulAssignments = 0;
        for (const assignment of shiftAssignmentsToCreate) {
          try {
            // Personnel ID'yi string olarak kaydet (Firebase uyumluluğu için)
            const firebaseAssignment = {
              ...assignment,
              personnelId: assignment.personnelId.toString(),
            };
            console.log(`🔄 Kaydetmeye çalışıyor:`, firebaseAssignment);
            await storage.createShiftAssignment(firebaseAssignment);
            successfulAssignments++;
            console.log(`✅ Başarılı: ${successfulAssignments}/${shiftAssignmentsToCreate.length}`);
          } catch (error) {
            console.error(`❌ Vardiya ataması hatası:`, error);
            errors.push({
              employeeNumber: assignment.personnelId,
              error: error instanceof Error ? error.message : "Vardiya ataması başarısız",
            });
          }
        }

        // Batch işlem: Personel güncellemelerini yap
        for (const update of personnelUpdates) {
          try {
            await storage.updatePersonnel(update.id, { shiftId: update.shiftId });
          } catch (error) {
            console.error("Personel güncelleme hatası:", error);
          }
        }

        importedShiftAssignments.push(...Array(successfulAssignments).fill({}));

        res.json({
          success: true,
          imported: importedShiftAssignments.length,
          errors: errors.length,
          data: {
            importedShiftAssignments: importedShiftAssignments.length,
            errors,
          },
        });
      } catch (error) {
        console.error("Excel vardiya yükleme hatası:", error);
        res.status(500).json({ error: "Excel dosyası işlenemedi" });
      }
    },
  );

  // Personel Excel dosyası yükleme endpoint'i kaldırıldı - artık vardiya planları sayfasından otomatik olarak tüm personele atanıyor

  // Excel'den vardiya planlama yükleme endpoint'i
  app.post("/api/excel/import-shifts", authenticateFirebase, async (req, res) => {
    try {
      const { fileName, month, year } = req.body;
      console.log("Excel import başladı:", { fileName, month, year });

      if (!fileName) {
        return res.status(400).json({ error: "fileName parametresi gerekli" });
      }

      // Dosya yolunu oluştur
      const filePath = path.join(process.cwd(), "attached_assets", fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Dosya bulunamadı" });
      }

      // Excel dosyasını oku
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });
      console.log("Excel okundu, toplam satır:", data.length);
      console.log("Workbook sheet names:", workbook.SheetNames);
      console.log("İlk 10 satır (raw):", data.slice(0, 10));

      const importedShiftAssignments = [];
      const errors = [];

      // Tarih başlıklarını al (4. satır)
      const dateHeaders = data[3] as any[];
      console.log("Date headers:", dateHeaders);

      // Personel listesini başta al
      const personnel = await storage.getPersonnel();
      console.log("Toplam personel sayısı:", personnel.length);
      console.log("Excel satır sayısı:", data.length);
      console.log("İlk 5 satır:", data.slice(0, 5));

      // Personelleri işle (5. satırdan başla)
      for (let i = 4; i < data.length; i++) {
        const row = data[i] as any[];
        if (
          row &&
          row.length > 1 &&
          row[0] &&
          row[1] &&
          row[1].toString().trim() !== ""
        ) {
          console.log(`Satır ${i}:`, row.slice(0, 5)); // İlk 5 kolonu göster

          const employeeNumber = row[0].toString();
          console.log("Processing employee:", employeeNumber, "Name:", row[1]);

          // Employee number ile ara
          let foundPersonnel = personnel.find(
            (p) => p.employeeNumber === employeeNumber,
          );

          if (foundPersonnel) {
            console.log(
              `✅ Personel bulundu: ${foundPersonnel.firstName} ${foundPersonnel.lastName} (ID: ${foundPersonnel.id})`,
            );

            // Personelin dominant vardiya tipini belirlemek için sayaçlar
            let morningCount = 0;
            let eveningCount = 0;
            let workingCount = 0;
            let offCount = 0;

            // Excel format: A sütunu = Personel No, B sütunu = İsim, C sütunu = 1. gün...
            // Kullanıcı bunu değiştirip A sütununda 1. günün başlamasını istiyor
            // Bu durumda personel bilgileri farklı şekilde sağlanmalı

            // Şu anki mevcut formatı koruyarak çalışmaya devam et
            for (
              let dayIndex = 2;
              dayIndex < Math.min(row.length, 34);
              dayIndex++
            ) {
              const shiftValue = row[dayIndex];

              if (shiftValue && shiftValue.toString().trim() !== "") {
                const shiftCode = shiftValue.toString().toUpperCase().trim();

                // Vardiya türünü belirle ve say
                let shiftType = "assigned";
                if (shiftCode === "S") {
                  shiftType = "morning";
                  morningCount++;
                } else if (shiftCode === "A") {
                  shiftType = "evening";
                  eveningCount++;
                } else if (shiftCode === "OF") {
                  shiftType = "off";
                  offCount++;
                } else if (shiftCode === "Ç") {
                  shiftType = "working";
                  workingCount++;
                }

                // Tarih oluştur - dayIndex 2 = ayın 1. günü (C sütunu)
                const currentYear = 2025;
                const currentMonth = 7;
                const dayNumber = dayIndex - 1; // dayIndex 2 → gün 1, dayIndex 3 → gün 2...
                const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-${dayNumber.toString().padStart(2, "0")}`;

                try {
                  // Vardiya ataması oluştur
                  const shiftAssignment = await storage.createShiftAssignment({
                    personnelId: foundPersonnel.id,
                    shiftId: null,
                    assignedDate: dateStr,
                    date: dateStr,
                    shiftType: shiftType,
                    status: "assigned",
                    notes: `Excel'den import edildi (${shiftCode})`,
                  });

                  importedShiftAssignments.push(shiftAssignment);
                } catch (error) {
                  console.error(`Vardiya ataması oluşturma hatası:`, error);
                }
              }
            }

            // Personelin dominant vardiya tipine göre varsayılan vardiyasını güncelle
            try {
              const shifts = await storage.getShifts();
              let defaultShiftId = null;

              if (morningCount > eveningCount && morningCount > 0) {
                // Sabah vardiyası dominant
                const morningShift = shifts.find(
                  (s) =>
                    s.name.toLowerCase().includes("sabah") ||
                    s.name.toLowerCase().includes("morning") ||
                    s.startTime === "08:00:00",
                );
                if (morningShift) defaultShiftId = morningShift.id;
                console.log(
                  `📝 ${foundPersonnel.firstName} ${foundPersonnel.lastName} - Sabah vardiyası dominant (${morningCount} gün)`,
                );
              } else if (eveningCount > morningCount && eveningCount > 0) {
                // Akşam vardiyası dominant
                const eveningShift = shifts.find(
                  (s) =>
                    s.name.toLowerCase().includes("akşam") ||
                    s.name.toLowerCase().includes("evening") ||
                    s.name.toLowerCase().includes("gece") ||
                    s.startTime === "20:00:00",
                );
                if (eveningShift) defaultShiftId = eveningShift.id;
                console.log(
                  `📝 ${foundPersonnel.firstName} ${foundPersonnel.lastName} - Akşam vardiyası dominant (${eveningCount} gün)`,
                );
              }

              // Personel vardiyasını güncelle
              if (defaultShiftId) {
                await storage.updatePersonnel(foundPersonnel.id, {
                  shiftId: defaultShiftId,
                });
                console.log(
                  `✅ ${foundPersonnel.firstName} ${foundPersonnel.lastName} personelinin varsayılan vardiyası güncellendi (Shift ID: ${defaultShiftId})`,
                );
              }
            } catch (updateError) {
              console.error(`Personel vardiya güncelleme hatası:`, updateError);
            }

            console.log(
              `📊 ${foundPersonnel.firstName} ${foundPersonnel.lastName} vardiya dağılımı: S:${morningCount}, A:${eveningCount}, Ç:${workingCount}, OF:${offCount}`,
            );
          } else {
            console.log(
              `❌ Personel bulunamadı - ${employeeNumber}: ${row[1]}`,
            );
            errors.push({
              employeeNumber,
              error: "Personel bulunamadı",
            });
          }
        }
      }

      res.json({
        success: true,
        imported: importedShiftAssignments.length,
        errors: errors.length,
        data: {
          importedShiftAssignments: importedShiftAssignments.length,
          errors,
        },
      });
    } catch (error) {
      console.error("Excel vardiya yükleme hatası:", error);
      res.status(500).json({ error: "Excel dosyası işlenemedi" });
    }
  });

  // Excel dosyası analiz endpoint'i
  app.post("/api/excel/analyze", authenticateFirebase, (req, res) => {
    try {
      const { fileName, personnelName, date } = req.body;

      if (!fileName || !personnelName || !date) {
        return res
          .status(400)
          .json({
            error: "fileName, personnelName ve date parametreleri gerekli",
          });
      }

      // Dosya yolunu oluştur
      const filePath = path.join(process.cwd(), "attached_assets", fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Dosya bulunamadı" });
      }

      // Excel dosyasını oku
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Personel ismini ara
      let personnelRowIndex = -1;
      let dateColumnIndex = -1;

      // İlk satırda tarihleri bul
      const headerRow = data[0] as any[];
      for (let i = 0; i < headerRow.length; i++) {
        if (
          headerRow[i] &&
          headerRow[i].toString().includes(date.split("-")[2])
        ) {
          // Gün kısmını ara
          dateColumnIndex = i;
          break;
        }
      }

      // Personel ismini ara
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (
          row[0] &&
          row[0].toString().toUpperCase().includes(personnelName.toUpperCase())
        ) {
          personnelRowIndex = i;
          break;
        }
      }

      if (personnelRowIndex === -1) {
        return res.status(404).json({ error: "Personel bulunamadı" });
      }

      if (dateColumnIndex === -1) {
        return res.status(404).json({ error: "Tarih bulunamadı" });
      }

      const shiftValue = (data[personnelRowIndex] as any[])[dateColumnIndex];
      let shiftType = "Bilinmiyor";

      if (shiftValue) {
        const value = shiftValue.toString().toUpperCase();
        if (value === "S") {
          shiftType = "Sabah";
        } else if (value === "A") {
          shiftType = "Akşam";
        } else if (value === "OF") {
          shiftType = "Çalışmıyor";
        }
      }

      res.json({
        personnelName,
        date,
        shiftType,
        shiftValue,
      });
    } catch (error) {
      console.error("Excel analiz hatası:", error);
      res.status(500).json({ error: "Excel dosyası analiz edilemedi" });
    }
  });

  // Dashboard - Son aktiviteler endpoint'i
  app.get(
    "/api/dashboard/recent-activities",
    authenticateFirebase,
    async (req, res) => {
      try {
        const activities = [];

        // Son 5 devam kaydı
        const recentAttendance = await firebaseStorage.getAttendanceRecords();
        const sortedAttendance = recentAttendance
          .sort(
            (a, b) =>
              new Date(b.checkInTime || "").getTime() -
              new Date(a.checkInTime || "").getTime(),
          )
          .slice(0, 5);

        for (const record of sortedAttendance) {
          activities.push({
            id: `attendance-${record.id}`,
            type: "attendance",
            message: `${record.personnel?.firstName} ${record.personnel?.lastName} giriş yaptı`,
            timestamp: record.checkInTime,
            status: record.status,
          });
        }

        // Son 5 izin talebi
        const recentLeaves = await storage.getLeaveRequests();
        const sortedLeaves = recentLeaves
          .sort(
            (a, b) =>
              new Date(b.createdAt || "").getTime() -
              new Date(a.createdAt || "").getTime(),
          )
          .slice(0, 5);

        for (const leave of sortedLeaves) {
          activities.push({
            id: `leave-${leave.id}`,
            type: "leave",
            message: `${leave.personnel?.firstName} ${leave.personnel?.lastName} izin talebinde bulundu`,
            timestamp: leave.createdAt,
            status: leave.status,
          });
        }

        // Tüm aktiviteleri tarihe göre sırala ve son 10'unu al
        const allActivities = activities
          .sort(
            (a, b) =>
              new Date(b.timestamp || "").getTime() -
              new Date(a.timestamp || "").getTime(),
          )
          .slice(0, 10);

        res.json(allActivities);
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        res.status(500).json({ message: "Son aktiviteler alınamadı" });
      }
    },
  );

  // System settings routes
  app.get('/api/settings', authenticateFirebase, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.get('/api/settings/:key', authenticateFirebase, async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ message: "Failed to fetch system setting" });
    }
  });

  app.post('/api/settings', authenticateFirebase, async (req, res) => {
    try {
      const { key, value, category, description } = req.body;
      
      if (!key) {
        return res.status(400).json({ message: "Setting key is required" });
      }

      const setting = await storage.upsertSystemSetting({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        category,
        description
      });

      res.json(setting);
    } catch (error) {
      console.error("Error saving system setting:", error);
      res.status(500).json({ message: "Failed to save system setting" });
    }
  });

  app.delete('/api/settings/:key', authenticateFirebase, async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deleteSystemSetting(key);
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting system setting:", error);
      res.status(500).json({ message: "Failed to delete system setting" });
    }
  });

  // Bulk settings save endpoint for settings page
  app.post('/api/settings/bulk', authenticateFirebase, async (req, res) => {
    try {
      const { settings } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ message: "Settings object is required" });
      }

      const savedSettings = [];
      
      for (const [key, value] of Object.entries(settings)) {
        const setting = await storage.upsertSystemSetting({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          category: key.includes('sms') || key.includes('netgsm') ? 'sms' : 
                   key.includes('email') || key.includes('smtp') ? 'email' :
                   key.includes('security') ? 'security' :
                   key.includes('notification') ? 'notification' :
                   key.includes('qr') ? 'qr' : 'general',
          description: `${key} system setting`
        });
        savedSettings.push(setting);
      }

      res.json({ 
        message: "Settings saved successfully", 
        settings: savedSettings 
      });
    } catch (error) {
      console.error("Error saving bulk settings:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // SMS API endpoints
  app.post('/api/sms/send', authenticateFirebase, async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Telefon numarası ve mesaj gerekli" });
      }

      const result = await smsService.sendSMS(phoneNumber, message);
      
      if (result.status === 'success') {
        res.json({
          success: true,
          message: result.message,
          jobID: result.jobID
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("SMS send error:", error);
      res.status(500).json({ 
        success: false,
        message: "SMS gönderilemedi" 
      });
    }
  });

  app.post('/api/sms/send-bulk', authenticateFirebase, async (req, res) => {
    try {
      const { phoneNumbers, message } = req.body;
      
      if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
        return res.status(400).json({ message: "Telefon numaraları (array) ve mesaj gerekli" });
      }

      const results = await smsService.sendBulkSMS(phoneNumbers, message);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.length - successCount;
      
      res.json({
        success: true,
        message: `${successCount} SMS başarıyla gönderildi, ${errorCount} hata`,
        results: results
      });
    } catch (error) {
      console.error("Bulk SMS send error:", error);
      res.status(500).json({ 
        success: false,
        message: "Toplu SMS gönderilemedi" 
      });
    }
  });

  app.post('/api/sms/test-connection', authenticateFirebase, async (req, res) => {
    try {
      const result = await smsService.testConnection();
      res.json(result);
    } catch (error) {
      console.error("SMS connection test error:", error);
      res.status(500).json({ 
        success: false,
        message: "Bağlantı testi başarısız" 
      });
    }
  });

  // QR screens API endpoints
  app.get('/api/qr-screens', authenticateFirebase, async (req, res) => {
    try {
      const screens = await storage.getQrScreens();
      res.json(screens);
    } catch (error) {
      console.error('Error fetching QR screens:', error);
      res.status(500).json({ message: 'Failed to fetch QR screens' });
    }
  });

  app.get('/api/qr-screens/:screenId', async (req, res) => {
    try {
      const { screenId } = req.params;
      
      // Screen activity'yi güncelle
      try {
        await storage.updateQrScreenActivity(screenId);
      } catch (updateError) {
        // Activity update error'ı ana işlemi engellemez
        console.warn('Failed to update screen activity:', updateError);
      }
      
      let screen = await storage.getQrScreenByScreenId(screenId);
      
      // Ekran bulunamazsa oluştur
      if (!screen) {
        const generateAccessCode = () => {
          return Math.random().toString(36).substring(2, 8).toUpperCase();
        };
        
        screen = await storage.createQrScreen({
          screenId,
          branchId: 2, // Varsayılan şube
          name: `Ekran ${screenId}`,
          accessCode: generateAccessCode(),
          active: true
        });
      }
      
      res.json(screen);
    } catch (error) {
      console.error('Error fetching QR screen:', error);
      res.status(500).json({ message: 'Failed to fetch QR screen' });
    }
  });

  app.post('/api/qr-screens', authenticateFirebase, async (req, res) => {
    try {
      const screenData = req.body;
      const screen = await storage.createQrScreen(screenData);
      res.status(201).json(screen);
    } catch (error) {
      console.error('Error creating QR screen:', error);
      res.status(500).json({ message: 'Failed to create QR screen' });
    }
  });

  app.put('/api/qr-screens/:screenId', async (req, res) => {
    try {
      const { screenId } = req.params;
      const screenData = req.body;
      
      console.log('PUT /api/qr-screens/:screenId - Request received:', { screenId, screenData });
      
      // Eğer screenId değiştiriliyorsa, yeni bir kayıt oluştur ve eskisini sil
      if (screenData.screenId && screenData.screenId !== screenId) {
        const oldScreen = await storage.getQrScreenByScreenId(screenId);
        if (oldScreen) {
          // Yeni screen oluştur
          const newScreen = await storage.createQrScreen({
            screenId: screenData.screenId,
            branchId: oldScreen.branchId,
            name: screenData.name || oldScreen.name,
            accessCode: oldScreen.accessCode,
            active: oldScreen.active,
            deviceId: oldScreen.deviceId
          });
          
          // Eski screen'i sil
          await storage.deleteQrScreen(screenId);
          
          res.json(newScreen);
        } else {
          res.status(404).json({ message: 'Screen not found' });
        }
      } else {
        // Normal güncelleme
        console.log('Normal update - updating screenId:', screenId, 'with data:', screenData);
        
        // Eğer screen bulunamazsa önce oluştur
        const existingScreen = await storage.getQrScreenByScreenId(screenId);
        if (!existingScreen) {
          console.log('Screen not found, creating new one');
          const newScreen = await storage.createQrScreen({
            screenId,
            branchId: screenData.branchId || 2,
            name: screenData.name || `Ekran ${screenId}`,
            accessCode: screenData.accessCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
            active: screenData.active !== undefined ? screenData.active : true,
            deviceId: screenData.deviceId || null
          });
          console.log('New screen created:', newScreen);
          res.json(newScreen);
        } else {
          const screen = await storage.updateQrScreen(screenId, screenData);
          console.log('Update result:', screen);
          res.json(screen);
        }
      }
    } catch (error) {
      console.error('Error updating QR screen:', error);
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ message: 'Failed to update QR screen' });
    }
  });

  app.delete('/api/qr-screens/:screenId', authenticateFirebase, async (req, res) => {
    try {
      const { screenId } = req.params;
      await storage.deleteQrScreen(screenId);
      res.json({ message: 'QR screen deleted successfully' });
    } catch (error) {
      console.error('Error deleting QR screen:', error);
      res.status(500).json({ message: 'Failed to delete QR screen' });
    }
  });

  // Logout endpoint
  app.get('/api/logout', async (req, res) => {
    try {
      // Since we're using Firebase Auth, we don't need to clear server-side sessions
      // Just return success - the client will handle Firebase logout
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Health check endpoint
  app.use(healthRouter);

  // Debug endpoint - Firebase'daki vardiya atamalarını kontrol et
  app.get("/api/debug/firebase-assignments", authenticateFirebase, async (req, res) => {
    try {
      const assignments = await storage.getShiftAssignments();
      res.json({
        count: assignments.length,
        sample: assignments.slice(0, 3),
        allData: assignments
      });
    } catch (error) {
      console.error("Debug endpoint hatası:", error);
      res.status(500).json({ error: "Firebase verisi alınamadı" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
