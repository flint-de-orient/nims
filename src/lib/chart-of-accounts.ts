export interface COALeaf {
  id: string;
  name: string;
}

export interface COASubHead {
  id: string;
  name: string;
  leaves: COALeaf[] | null; // null = subHead IS the leaf
}

export interface COABranch {
  id: string;
  name: string;
  side: "Expense" | "Income";
  color: string;
  subHeads: COASubHead[];
}

export const CHART_OF_ACCOUNTS: COABranch[] = [
  {
    id: "college-expense",
    name: "College Expense",
    side: "Expense",
    color: "#0F766E",
    subHeads: [
      {
        id: "college-salary",
        name: "College Salary",
        leaves: [
          { id: "teacher-salary", name: "Teacher Salary" },
          { id: "management-salary", name: "Management Salary" },
          { id: "non-staff-salary", name: "Non-Staff Salary" },
        ],
      },
      {
        id: "college-paperwork",
        name: "College Paperwork",
        leaves: [
          { id: "eco-hospital", name: "Eco Hospital" },
          { id: "wbnc-inc", name: "WBNC & INC" },
          { id: "permission", name: "Permission" },
          { id: "govt-fees", name: "Govt Fees" },
          { id: "nasiruddin-agreement", name: "Nasiruddin Agreement" },
          { id: "land-paper", name: "Land Paper" },
        ],
      },
      {
        id: "college-transport",
        name: "College Transport",
        leaves: [
          { id: "bus", name: "Bus" },
          { id: "toto", name: "Toto" },
          { id: "eco-maruti", name: "Eco / Maruti" },
        ],
      },
      {
        id: "advertisement",
        name: "Advertisement",
        leaves: [
          { id: "online-advertisement", name: "Online Advertisement" },
          { id: "offline-advertisement", name: "Offline Advertisement" },
          { id: "website-social-media", name: "Website / Social Media" },
          { id: "column-poster", name: "Column Poster" },
        ],
      },
      {
        id: "consultancy",
        name: "Consultancy",
        leaves: null, // leaf itself — per-student ledger
      },
      {
        id: "purchase",
        name: "Purchase",
        leaves: [
          { id: "stationery", name: "Stationery" },
          { id: "lab-consumables", name: "Lab Consumables" },
          { id: "office-supplies", name: "Office Supplies" },
          { id: "it-equipment", name: "IT & Equipment" },
        ],
      },
      {
        id: "book-account",
        name: "Book Account",
        leaves: [
          { id: "anand-books-kolkata", name: "Anand Books Kolkata" },
          { id: "other-booksellers", name: "Other Booksellers" },
        ],
      },
      {
        id: "development",
        name: "Development",
        leaves: [
          { id: "faculty-development", name: "Faculty Development" },
          { id: "training-workshops", name: "Training & Workshops" },
        ],
      },
      {
        id: "miscellaneous",
        name: "Miscellaneous",
        leaves: [
          { id: "electric-bill", name: "Electric Bill" },
          { id: "guest-teacher-salary", name: "Guest Teacher Salary" },
          { id: "visit-expenses", name: "Visit Expenses" },
        ],
      },
    ],
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    side: "Expense",
    color: "#7C3AED",
    subHeads: [
      {
        id: "building",
        name: "Building",
        leaves: [
          { id: "civil-work", name: "Civil Work" },
          { id: "glass-work", name: "Glass Work" },
          { id: "wood-work", name: "Wood Work" },
          { id: "electric-work", name: "Electric Work" },
          { id: "plumbing-work", name: "Plumbing Work" },
          { id: "marble-work", name: "Marble Work" },
          { id: "colour-work", name: "Colour Work" },
          { id: "construction-work", name: "Construction Work" },
          { id: "building-miscellaneous", name: "Miscellaneous" },
          { id: "purchase-building-materials", name: "Purchase of Building Materials" },
        ],
      },
      {
        id: "field-ground",
        name: "Field / Ground",
        leaves: null,
      },
      {
        id: "new-project",
        name: "New Project",
        leaves: null,
      },
    ],
  },
  {
    id: "hostel-expense",
    name: "Hostel Expense",
    side: "Expense",
    color: "#D97706",
    subHeads: [
      { id: "hostel-salary", name: "Salary", leaves: null },
      { id: "hostel-grocery", name: "Grocery", leaves: null },
      { id: "hostel-vegetables", name: "Vegetables", leaves: null },
      { id: "hostel-chicken", name: "Chicken", leaves: null },
      { id: "hostel-fish", name: "Fish", leaves: null },
      { id: "hostel-rice", name: "Rice", leaves: null },
      { id: "hostel-gas-firewood", name: "Gas / Firewood", leaves: null },
      { id: "hostel-tiffin", name: "Tiffin", leaves: null },
      { id: "hostel-cooking-materials", name: "Cooking Materials", leaves: null },
      { id: "hostel-medicine", name: "Medicine", leaves: null },
    ],
  },
];

export const INCOME_HEADS: { id: string; name: string; note: string }[] = [
  {
    id: "admission-fees",
    name: "Admission Fees",
    note: "One-time fee collected at the time of admission for each new student.",
  },
  {
    id: "tuition-fees",
    name: "Tuition Fees",
    note: "Semester / annual academic fees for GNM, B.Sc Nursing, P.B. B.Sc, and M.Sc Nursing courses.",
  },
  {
    id: "hostel-registration-fees",
    name: "Hostel Registration Fees",
    note: "One-time registration fee for hostel accommodation.",
  },
  {
    id: "hostel-monthly-fees",
    name: "Hostel Monthly Fees",
    note: "Monthly recurring charges covering boarding, lodging, and mess for hostel residents.",
  },
];

export const APPROVAL_THRESHOLDS = {
  auto: 5000,       // < ₹5,000 → auto-approved
  principal: 25000, // ₹5,000–₹25,000 → Principal approval; > ₹25,000 → Principal + Committee
};
