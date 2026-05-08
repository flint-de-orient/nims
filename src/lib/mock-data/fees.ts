import { FeeStructure, ScholarshipRule, LateFeeRule } from "../types";

export const mockFeeStructures: FeeStructure[] = [
  // GNM Year 1
  { id: "f001", course: "GNM", year: 1, head: "Tuition", amount: 45000, effectiveFrom: "2024-07-01" },
  { id: "f002", course: "GNM", year: 1, head: "Hostel", amount: 48000, effectiveFrom: "2024-07-01" },
  { id: "f003", course: "GNM", year: 1, head: "Lab", amount: 4000, effectiveFrom: "2024-07-01" },
  { id: "f004", course: "GNM", year: 1, head: "Exam", amount: 3000, effectiveFrom: "2024-07-01" },
  { id: "f005", course: "GNM", year: 1, head: "Library", amount: 2000, effectiveFrom: "2024-07-01" },
  { id: "f006", course: "GNM", year: 1, head: "University", amount: 8000, effectiveFrom: "2024-07-01" },
  { id: "f007", course: "GNM", year: 1, head: "Misc", amount: 3000, effectiveFrom: "2024-07-01" },
  // GNM Year 2
  { id: "f008", course: "GNM", year: 2, head: "Tuition", amount: 45000, effectiveFrom: "2023-07-01" },
  { id: "f009", course: "GNM", year: 2, head: "Hostel", amount: 48000, effectiveFrom: "2023-07-01" },
  { id: "f010", course: "GNM", year: 2, head: "Lab", amount: 5000, effectiveFrom: "2023-07-01" },
  { id: "f011", course: "GNM", year: 2, head: "Exam", amount: 3500, effectiveFrom: "2023-07-01" },
  { id: "f012", course: "GNM", year: 2, head: "Library", amount: 2000, effectiveFrom: "2023-07-01" },
  { id: "f013", course: "GNM", year: 2, head: "University", amount: 8000, effectiveFrom: "2023-07-01" },
  { id: "f014", course: "GNM", year: 2, head: "Misc", amount: 3500, effectiveFrom: "2023-07-01" },
  // GNM Year 3
  { id: "f015", course: "GNM", year: 3, head: "Tuition", amount: 45000, effectiveFrom: "2022-07-01" },
  { id: "f016", course: "GNM", year: 3, head: "Hostel", amount: 48000, effectiveFrom: "2022-07-01" },
  { id: "f017", course: "GNM", year: 3, head: "Lab", amount: 5000, effectiveFrom: "2022-07-01" },
  { id: "f018", course: "GNM", year: 3, head: "Exam", amount: 4000, effectiveFrom: "2022-07-01" },
  { id: "f019", course: "GNM", year: 3, head: "Library", amount: 2000, effectiveFrom: "2022-07-01" },
  { id: "f020", course: "GNM", year: 3, head: "University", amount: 8000, effectiveFrom: "2022-07-01" },
  { id: "f021", course: "GNM", year: 3, head: "Misc", amount: 3000, effectiveFrom: "2022-07-01" },
  // B.Sc Nursing Year 1
  { id: "f022", course: "B.Sc Nursing", year: 1, head: "Tuition", amount: 60000, effectiveFrom: "2024-07-01" },
  { id: "f023", course: "B.Sc Nursing", year: 1, head: "Hostel", amount: 48000, effectiveFrom: "2024-07-01" },
  { id: "f024", course: "B.Sc Nursing", year: 1, head: "Lab", amount: 6000, effectiveFrom: "2024-07-01" },
  { id: "f025", course: "B.Sc Nursing", year: 1, head: "Exam", amount: 4000, effectiveFrom: "2024-07-01" },
  { id: "f026", course: "B.Sc Nursing", year: 1, head: "Library", amount: 3000, effectiveFrom: "2024-07-01" },
  { id: "f027", course: "B.Sc Nursing", year: 1, head: "University", amount: 8000, effectiveFrom: "2024-07-01" },
  { id: "f028", course: "B.Sc Nursing", year: 1, head: "Misc", amount: 4000, effectiveFrom: "2024-07-01" },
  // B.Sc Nursing Year 2
  { id: "f029", course: "B.Sc Nursing", year: 2, head: "Tuition", amount: 60000, effectiveFrom: "2023-07-01" },
  { id: "f030", course: "B.Sc Nursing", year: 2, head: "Hostel", amount: 48000, effectiveFrom: "2023-07-01" },
  { id: "f031", course: "B.Sc Nursing", year: 2, head: "Lab", amount: 7000, effectiveFrom: "2023-07-01" },
  { id: "f032", course: "B.Sc Nursing", year: 2, head: "Exam", amount: 4500, effectiveFrom: "2023-07-01" },
  { id: "f033", course: "B.Sc Nursing", year: 2, head: "Library", amount: 3000, effectiveFrom: "2023-07-01" },
  { id: "f034", course: "B.Sc Nursing", year: 2, head: "University", amount: 8000, effectiveFrom: "2023-07-01" },
  { id: "f035", course: "B.Sc Nursing", year: 2, head: "Misc", amount: 2500, effectiveFrom: "2023-07-01" },
  // B.Sc Nursing Year 3
  { id: "f036", course: "B.Sc Nursing", year: 3, head: "Tuition", amount: 60000, effectiveFrom: "2022-07-01" },
  { id: "f037", course: "B.Sc Nursing", year: 3, head: "Hostel", amount: 48000, effectiveFrom: "2022-07-01" },
  { id: "f038", course: "B.Sc Nursing", year: 3, head: "Lab", amount: 7000, effectiveFrom: "2022-07-01" },
  { id: "f039", course: "B.Sc Nursing", year: 3, head: "Exam", amount: 5000, effectiveFrom: "2022-07-01" },
  { id: "f040", course: "B.Sc Nursing", year: 3, head: "Library", amount: 3000, effectiveFrom: "2022-07-01" },
  { id: "f041", course: "B.Sc Nursing", year: 3, head: "University", amount: 8000, effectiveFrom: "2022-07-01" },
  { id: "f042", course: "B.Sc Nursing", year: 3, head: "Misc", amount: 2000, effectiveFrom: "2022-07-01" },
  // B.Sc Nursing Year 4
  { id: "f043", course: "B.Sc Nursing", year: 4, head: "Tuition", amount: 60000, effectiveFrom: "2021-07-01" },
  { id: "f044", course: "B.Sc Nursing", year: 4, head: "Hostel", amount: 48000, effectiveFrom: "2021-07-01" },
  { id: "f045", course: "B.Sc Nursing", year: 4, head: "Lab", amount: 8000, effectiveFrom: "2021-07-01" },
  { id: "f046", course: "B.Sc Nursing", year: 4, head: "Exam", amount: 6000, effectiveFrom: "2021-07-01" },
  { id: "f047", course: "B.Sc Nursing", year: 4, head: "Library", amount: 3000, effectiveFrom: "2021-07-01" },
  { id: "f048", course: "B.Sc Nursing", year: 4, head: "University", amount: 8000, effectiveFrom: "2021-07-01" },
  { id: "f049", course: "B.Sc Nursing", year: 4, head: "Misc", amount: 0, effectiveFrom: "2021-07-01" },
  // P.B. B.Sc Year 1
  { id: "f050", course: "P.B. B.Sc", year: 1, head: "Tuition", amount: 55000, effectiveFrom: "2024-07-01" },
  { id: "f051", course: "P.B. B.Sc", year: 1, head: "Hostel", amount: 48000, effectiveFrom: "2024-07-01" },
  { id: "f052", course: "P.B. B.Sc", year: 1, head: "Lab", amount: 5000, effectiveFrom: "2024-07-01" },
  { id: "f053", course: "P.B. B.Sc", year: 1, head: "Exam", amount: 4000, effectiveFrom: "2024-07-01" },
  { id: "f054", course: "P.B. B.Sc", year: 1, head: "Library", amount: 2500, effectiveFrom: "2024-07-01" },
  { id: "f055", course: "P.B. B.Sc", year: 1, head: "University", amount: 8000, effectiveFrom: "2024-07-01" },
  { id: "f056", course: "P.B. B.Sc", year: 1, head: "Misc", amount: 2500, effectiveFrom: "2024-07-01" },
  // P.B. B.Sc Year 2
  { id: "f057", course: "P.B. B.Sc", year: 2, head: "Tuition", amount: 55000, effectiveFrom: "2023-07-01" },
  { id: "f058", course: "P.B. B.Sc", year: 2, head: "Hostel", amount: 48000, effectiveFrom: "2023-07-01" },
  { id: "f059", course: "P.B. B.Sc", year: 2, head: "Lab", amount: 5500, effectiveFrom: "2023-07-01" },
  { id: "f060", course: "P.B. B.Sc", year: 2, head: "Exam", amount: 4500, effectiveFrom: "2023-07-01" },
  { id: "f061", course: "P.B. B.Sc", year: 2, head: "Library", amount: 2500, effectiveFrom: "2023-07-01" },
  { id: "f062", course: "P.B. B.Sc", year: 2, head: "University", amount: 8000, effectiveFrom: "2023-07-01" },
  { id: "f063", course: "P.B. B.Sc", year: 2, head: "Misc", amount: 2000, effectiveFrom: "2023-07-01" },
  // M.Sc Nursing Year 1
  { id: "f064", course: "M.Sc Nursing", year: 1, head: "Tuition", amount: 70000, effectiveFrom: "2024-07-01" },
  { id: "f065", course: "M.Sc Nursing", year: 1, head: "Hostel", amount: 48000, effectiveFrom: "2024-07-01" },
  { id: "f066", course: "M.Sc Nursing", year: 1, head: "Lab", amount: 7000, effectiveFrom: "2024-07-01" },
  { id: "f067", course: "M.Sc Nursing", year: 1, head: "Exam", amount: 5000, effectiveFrom: "2024-07-01" },
  { id: "f068", course: "M.Sc Nursing", year: 1, head: "Library", amount: 4000, effectiveFrom: "2024-07-01" },
  { id: "f069", course: "M.Sc Nursing", year: 1, head: "University", amount: 8000, effectiveFrom: "2024-07-01" },
  { id: "f070", course: "M.Sc Nursing", year: 1, head: "Misc", amount: 3000, effectiveFrom: "2024-07-01" },
  // M.Sc Nursing Year 2
  { id: "f071", course: "M.Sc Nursing", year: 2, head: "Tuition", amount: 70000, effectiveFrom: "2023-07-01" },
  { id: "f072", course: "M.Sc Nursing", year: 2, head: "Hostel", amount: 48000, effectiveFrom: "2023-07-01" },
  { id: "f073", course: "M.Sc Nursing", year: 2, head: "Lab", amount: 7000, effectiveFrom: "2023-07-01" },
  { id: "f074", course: "M.Sc Nursing", year: 2, head: "Exam", amount: 5500, effectiveFrom: "2023-07-01" },
  { id: "f075", course: "M.Sc Nursing", year: 2, head: "Library", amount: 4000, effectiveFrom: "2023-07-01" },
  { id: "f076", course: "M.Sc Nursing", year: 2, head: "University", amount: 8000, effectiveFrom: "2023-07-01" },
  { id: "f077", course: "M.Sc Nursing", year: 2, head: "Misc", amount: 2500, effectiveFrom: "2023-07-01" },
];

export const mockScholarshipRules: ScholarshipRule[] = [
  { id: "sc001", category: "SC", type: "percent", value: 50, head: "Tuition" },
  { id: "sc002", category: "ST", type: "percent", value: 100, head: "Tuition" },
  { id: "sc003", category: "OBC", type: "percent", value: 25, head: "Tuition" },
  { id: "sc004", category: "EWS", type: "percent", value: 10, head: "Tuition" },
  { id: "sc005", category: "Merit", type: "absolute", value: 5000, head: "Tuition" },
];

export const defaultLateFeeRule: LateFeeRule = {
  graceDays: 15,
  ratePerDay: 25,
  cap: 2000,
};
