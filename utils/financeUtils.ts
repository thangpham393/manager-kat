
import { DayOfWeek, ClassSession } from '../types';

export const calculateSessionsBetweenDates = (
  startDateStr: string,
  endDateStr: string,
  schedule: ClassSession[]
): number => {
  if (!startDateStr || !endDateStr || schedule.length === 0) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const scheduledDays = schedule.map(s => s.dayOfWeek);
  
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    if (scheduledDays.includes(current.getDay() as DayOfWeek)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

export const calculateEndDateFromSessions = (
  startDateStr: string,
  totalSessions: number,
  schedule: ClassSession[]
): string => {
  if (!startDateStr || totalSessions <= 0 || schedule.length === 0) return startDateStr;
  
  const current = new Date(startDateStr);
  const scheduledDays = schedule.map(s => s.dayOfWeek);
  let count = 0;
  
  while (count < totalSessions) {
    if (scheduledDays.includes(current.getDay() as DayOfWeek)) {
      count++;
      if (count === totalSessions) break;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return current.toISOString().split('T')[0];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const numberToVietnameseWords = (amount: number): string => {
  if (amount === 0) return "Không đồng";

  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const numbers = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  function readThreeDigits(n: number, showZero: boolean): string {
    let res = "";
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;

    if (hundred > 0 || showZero) {
      res += numbers[hundred] + " trăm ";
      if (ten === 0 && unit !== 0) res += "lẻ ";
    }

    if (ten > 0) {
      if (ten === 1) res += "mười ";
      else res += numbers[ten] + " mươi ";
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) res += "mốt ";
      else if (unit === 5 && ten > 0) res += "lăm ";
      else res += numbers[unit] + " ";
    }

    return res;
  }

  let result = "";
  let strAmount = Math.floor(amount).toString();
  let groups: string[] = [];

  while (strAmount.length > 0) {
    groups.push(strAmount.slice(-3));
    strAmount = strAmount.slice(0, -3);
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    let n = parseInt(groups[i]);
    if (n > 0) {
      result += readThreeDigits(n, i < groups.length - 1) + units[i] + " ";
    }
  }

  const finalResult = result.trim();
  return finalResult.charAt(0).toUpperCase() + finalResult.slice(1) + " đồng";
};
