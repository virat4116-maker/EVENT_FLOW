import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { newId, inviteCode } from "../utils/ids.js";
import { generateTicketQR } from "../utils/qr.js";
import store from "./store.js";

export async function seed() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const departments = [
    { id: newId("dept"), name: "Computer Science", kind: "DEPARTMENT" },
    { id: newId("dept"), name: "Electronics", kind: "DEPARTMENT" },
    { id: newId("dept"), name: "Mechanical", kind: "DEPARTMENT" },
    { id: newId("dept"), name: "Civil", kind: "DEPARTMENT" },
    { id: newId("dept"), name: "Cultural Committee", kind: "COMMITTEE" },
    { id: newId("dept"), name: "Sports Committee", kind: "COMMITTEE" },
    { id: newId("dept"), name: "NSS", kind: "COMMITTEE" },
    { id: newId("dept"), name: "Robotics Club", kind: "CLUB" },
  ];
  const dep = (name) => departments.find((d) => d.name === name).name;

  const users = [
    { id: newId("usr"), name: "Main Admin", email: "admin@eventflow.com", passwordHash, role: "SUPER_ADMIN", department: null, studentId: null },
    { id: newId("usr"), name: "CSE Admin", email: "cse@eventflow.com", passwordHash, role: "DEPARTMENT_ADMIN", department: dep("Computer Science"), studentId: null },
    { id: newId("usr"), name: "Cultural Admin", email: "cultural@eventflow.com", passwordHash, role: "DEPARTMENT_ADMIN", department: dep("Cultural Committee"), studentId: null },
    { id: newId("usr"), name: "Sports Admin", email: "sports@eventflow.com", passwordHash, role: "DEPARTMENT_ADMIN", department: dep("Sports Committee"), studentId: null },
    { id: newId("usr"), name: "Priya Nair", email: "volunteer@eventflow.com", passwordHash, role: "VOLUNTEER", department: dep("Computer Science"), studentId: null },
    { id: newId("usr"), name: "Riya Sharma", email: "student@eventflow.com", passwordHash, role: "PARTICIPANT", department: null, studentId: "STU2026041" },
    { id: newId("usr"), name: "Rahul Mehta", email: "rahul@eventflow.com", passwordHash, role: "PARTICIPANT", department: null, studentId: "STU2026042" },
    { id: newId("usr"), name: "Aman Verma", email: "aman@eventflow.com", passwordHash, role: "PARTICIPANT", department: null, studentId: "STU2026043" },
  ];
  const cseAdmin = users.find((u) => u.email === "cse@eventflow.com");
  const culturalAdmin = users.find((u) => u.email === "cultural@eventflow.com");
  const sportsAdmin = users.find((u) => u.email === "sports@eventflow.com");
  const student = users.find((u) => u.email === "student@eventflow.com");
  const rahul = users.find((u) => u.email === "rahul@eventflow.com");

  const baseEvent = (overrides) => ({
    id: newId("evt"),
    type: "EVENT",
    category: "",
    description: "",
    banner: "",
    startTime: "",
    endTime: "",
    venue: "",
    rules: "",
    instructions: "",
    participation: "INDIVIDUAL",
    teamMin: 2,
    teamMax: 5,
    teamLeaderRequired: true,
    payment: "FREE",
    fee: 0,
    attendanceRequired: true,
    qrMode: "INDIVIDUAL",
    certificateEnabled: false,
    capacityEnabled: false,
    maxCapacity: null,
    capacityType: "PARTICIPANTS",
    registrationDeadline: "",
    customFields: [],
    reviewNote: "",
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  const events = [
    baseEvent({
      name: "Hackathon 2026",
      type: "COMPETITION",
      category: "Technology",
      department: dep("Computer Science"),
      description: "A 24-hour build sprint for teams tackling real campus problems.",
      date: "2026-09-15",
      startTime: "09:00",
      endTime: "09:00 (+1d)",
      venue: "Innovation Lab",
      rules: "Teams of 2-4. Original code only. Judged on impact, execution and demo.",
      participation: "TEAM",
      teamMin: 2,
      teamMax: 4,
      payment: "PAID",
      fee: 199,
      qrMode: "TEAM",
      certificateEnabled: true,
      capacityEnabled: true,
      maxCapacity: 100,
      capacityType: "TEAMS",
      registrationDeadline: "2026-09-12 23:59",
      status: "REGISTRATION_OPEN",
      createdBy: cseAdmin.id,
      customFields: [
        { id: "f1", type: "SHORT_ANSWER", label: "Problem Statement", placeholder: "One line on what you're building", required: true },
        { id: "f2", type: "SHORT_ANSWER", label: "GitHub URL", placeholder: "https://github.com/...", required: false },
        { id: "f3", type: "FILE_UPLOAD", label: "Upload Abstract", required: false },
      ],
    }),
    baseEvent({
      name: "Coding Challenge",
      type: "COMPETITION",
      category: "Technology",
      department: dep("Computer Science"),
      description: "Timed competitive programming rounds, solo entry.",
      date: "2026-09-18",
      startTime: "14:00",
      endTime: "17:00",
      venue: "CS Lab 2",
      participation: "INDIVIDUAL",
      payment: "FREE",
      certificateEnabled: true,
      capacityEnabled: true,
      maxCapacity: 150,
      status: "REGISTRATION_OPEN",
      createdBy: cseAdmin.id,
      customFields: [{ id: "f1", type: "DROPDOWN", label: "Preferred Language", options: ["C++", "Java", "Python"], required: true }],
    }),
    baseEvent({
      name: "Robotics Battle",
      type: "COMPETITION",
      category: "Technology",
      department: dep("Robotics Club"),
      description: "Bot-vs-bot elimination rounds on the campus arena.",
      date: "2026-10-04",
      venue: "Main Arena",
      participation: "TEAM",
      teamMin: 2,
      teamMax: 3,
      payment: "PAID",
      fee: 299,
      qrMode: "TEAM",
      certificateEnabled: true,
      status: "PENDING_APPROVAL",
      createdBy: cseAdmin.id,
    }),
    baseEvent({
      name: "Cultural Night",
      type: "CULTURAL",
      category: "Performance",
      department: dep("Cultural Committee"),
      description: "An evening of music, dance and drama from every department.",
      date: "2026-09-10",
      startTime: "18:00",
      venue: "Open Air Theatre",
      participation: "INDIVIDUAL",
      payment: "PAID",
      fee: 199,
      certificateEnabled: true,
      capacityEnabled: true,
      maxCapacity: 500,
      status: "REGISTRATION_OPEN",
      createdBy: culturalAdmin.id,
    }),
    baseEvent({
      name: "Dance Competition",
      type: "CULTURAL",
      category: "Performance",
      department: dep("Cultural Committee"),
      description: "Solo and duo freestyle rounds — all styles welcome.",
      date: "2026-09-22",
      venue: "Auditorium",
      participation: "EITHER",
      teamMin: 2,
      teamMax: 2,
      payment: "PAID",
      fee: 99,
      status: "REGISTRATION_OPEN",
      createdBy: culturalAdmin.id,
      customFields: [
        { id: "f1", type: "DROPDOWN", label: "Dance Style", options: ["Classical", "Hip-Hop", "Contemporary", "Folk"], required: true },
        { id: "f2", type: "SHORT_ANSWER", label: "Experience Level", required: false },
      ],
    }),
    baseEvent({
      name: "Photography Competition",
      type: "CULTURAL",
      category: "Arts",
      department: dep("Cultural Committee"),
      description: "Submit your best campus-life shot for a chance to be featured.",
      date: "2026-09-28",
      venue: "Online Submission",
      participation: "INDIVIDUAL",
      payment: "FREE",
      certificateEnabled: true,
      status: "CHANGES_REQUESTED",
      reviewNote: "Please add a clear submission deadline and file-size limit before resubmitting.",
      createdBy: culturalAdmin.id,
    }),
    baseEvent({
      name: "Inter-Department Football",
      type: "SPORTS",
      category: "Sports",
      department: dep("Sports Committee"),
      description: "Knockout football between department teams.",
      date: "2026-09-20",
      venue: "Sports Ground",
      participation: "TEAM",
      teamMin: 7,
      teamMax: 11,
      payment: "FREE",
      qrMode: "TEAM",
      capacityEnabled: true,
      maxCapacity: 16,
      capacityType: "TEAMS",
      status: "REGISTRATION_OPEN",
      createdBy: sportsAdmin.id,
    }),
    baseEvent({
      name: "Tree Plantation Drive",
      type: "CAMPAIGN",
      category: "Sustainability",
      department: dep("NSS"),
      description: "Join hands to green the campus — saplings and tools provided.",
      date: "2026-09-05",
      venue: "Campus Green Belt",
      participation: "INDIVIDUAL",
      payment: "FREE",
      certificateEnabled: true,
      status: "REGISTRATION_OPEN",
      createdBy: cseAdmin.id,
    }),
    baseEvent({
      name: "Clean Campus Campaign",
      type: "CAMPAIGN",
      category: "Sustainability",
      department: dep("NSS"),
      description: "A weekend campus clean-up with the NSS unit.",
      date: "2026-10-02",
      venue: "Whole Campus",
      participation: "INDIVIDUAL",
      payment: "FREE",
      status: "DRAFT",
      createdBy: cseAdmin.id,
    }),
    baseEvent({
      name: "Tech Workshop: Intro to AI",
      type: "WORKSHOP",
      category: "Technology",
      department: dep("Computer Science"),
      description: "A hands-on half-day workshop on practical machine learning.",
      date: "2026-08-20",
      venue: "CS Seminar Hall",
      participation: "INDIVIDUAL",
      payment: "PAID",
      fee: 99,
      certificateEnabled: true,
      status: "COMPLETED",
      createdBy: cseAdmin.id,
    }),
  ];

  const registrations = [];
  const teams = [];
  const payments = [];
  const attendance = [];
  const certificates = [];

  // Completed workshop: give Riya an attended, paid, certificate-eligible history.
  const workshop = events.find((e) => e.name.startsWith("Tech Workshop"));
  const wsReg = {
    id: newId("reg"), eventId: workshop.id, userId: student.id, teamId: null,
    answers: {}, status: "CONFIRMED", qrToken: null, checkedIn: true,
    checkedInAt: "2026-08-20T10:15:00.000Z", createdAt: "2026-08-18T09:00:00.000Z",
  };
  const wsQR = await generateTicketQR({ registrationId: wsReg.id });
  wsReg.qrToken = wsQR.token;
  registrations.push(wsReg);
  payments.push({ id: newId("pay"), registrationId: wsReg.id, eventId: workshop.id, userId: student.id, amount: 99, status: "SUCCESS", method: "DEMO", createdAt: "2026-08-18T09:00:00.000Z" });
  attendance.push({ id: newId("att"), registrationId: wsReg.id, eventId: workshop.id, userId: student.id, teamId: null, scannedBy: cseAdmin.id, scannedAt: wsReg.checkedInAt });

  // Cultural Night: Riya paid and confirmed, ready to demo the scanner.
  const culturalNight = events.find((e) => e.name === "Cultural Night");
  const cnReg = {
    id: newId("reg"), eventId: culturalNight.id, userId: student.id, teamId: null,
    answers: {}, status: "CONFIRMED", qrToken: null, checkedIn: false, createdAt: new Date().toISOString(),
  };
  const cnQR = await generateTicketQR({ registrationId: cnReg.id });
  cnReg.qrToken = cnQR.token;
  registrations.push(cnReg);
  payments.push({ id: newId("pay"), registrationId: cnReg.id, eventId: culturalNight.id, userId: student.id, amount: 199, status: "SUCCESS", method: "DEMO", createdAt: new Date().toISOString() });

  // Tree Plantation Drive: free event, already registered + QR issued.
  const plantation = events.find((e) => e.name === "Tree Plantation Drive");
  const tpReg = {
    id: newId("reg"), eventId: plantation.id, userId: student.id, teamId: null,
    answers: {}, status: "CONFIRMED", qrToken: null, checkedIn: false, createdAt: new Date().toISOString(),
  };
  const tpQR = await generateTicketQR({ registrationId: tpReg.id });
  tpReg.qrToken = tpQR.token;
  registrations.push(tpReg);

  // Hackathon: a forming team, "Code Warriors", led by Riya, waiting on one more member.
  const hackathon = events.find((e) => e.name === "Hackathon 2026");
  const codeWarriors = {
    id: newId("team"), eventId: hackathon.id, name: "Code Warriors", leaderId: student.id,
    memberIds: [student.id, rahul.id], inviteCode: inviteCode("Code Warriors"),
    status: "FORMING", answers: {}, registrationId: null, createdAt: new Date().toISOString(),
  };
  teams.push(codeWarriors);

  const db = { users, departments, events, registrations, teams, payments, attendance, certificates };
  store.reset(db);
  console.log("Seed complete:");
  console.log(`  ${users.length} users, ${departments.length} departments, ${events.length} events`);
  console.log("Demo accounts (password: 123456):");
  users.forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email}`));
}
// Only run-and-exit when invoked directly (`npm run seed`). When imported
// (e.g. by server.js for an automatic first-boot seed), just export seed().
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
