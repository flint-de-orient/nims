import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (isNaN(amount)) return "₹0";
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const str = abs.toFixed(0);
  let result = "";
  const len = str.length;
  if (len <= 3) {
    result = str;
  } else {
    result = str.slice(-3);
    let remaining = str.slice(0, len - 3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + "," + result;
      remaining = remaining.slice(0, remaining.length - 2);
    }
    result = remaining + "," + result;
  }
  return (isNegative ? "-₹" : "₹") + result;
}

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertHundreds(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertHundreds(n % 100) : "");
}

export function numberToWordsIN(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";
  const n = Math.floor(amount);
  const paise = Math.round((amount - n) * 100);
  let result = "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore) result += convertHundreds(crore) + " Crore ";
  if (lakh) result += convertHundreds(lakh) + " Lakh ";
  if (thousand) result += convertHundreds(thousand) + " Thousand ";
  if (rest) result += convertHundreds(rest);
  result = result.trim() + " Rupees";
  if (paise) result += " and " + convertHundreds(paise) + " Paise";
  return result + " Only";
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function generateReceiptNumber(seq: number): string {
  return `NIN/2025-26/${String(seq).padStart(5, "0")}`;
}
