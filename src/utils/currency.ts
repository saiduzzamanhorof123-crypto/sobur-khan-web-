import { ModelingCourse, StudentRegistration, CollaborationInquiry } from '../types';

export const CURRENCY_CONFIG = {
  name: 'Bangladeshi Taka',
  code: 'BDT' as const,
  symbol: '৳' as const,
  locale: 'en-BD' as const,
};

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

/**
 * Formats a numeric BDT amount in the canonical `৳ 1,500` format (en-BD / South Asian grouping).
 * Returns `unconfirmedLabel` when amount is null/undefined/NaN so no USD amounts or invented FX values appear.
 */
export function formatBDT(
  amount: number | null | undefined,
  digitStyle: 'en' | 'bn' = 'en',
  unconfirmedLabel = 'Fee Pending Confirmation (৳ BDT)'
): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return unconfirmedLabel;
  }

  const numericValue = Math.round(Number(amount));
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(numericValue);

  const finalDigits = digitStyle === 'bn' ? toBengaliDigits(formattedNumber) : formattedNumber;
  return `${CURRENCY_CONFIG.symbol} ${finalDigits}`;
}

export function formatBDTRange(
  min: number | null | undefined,
  max: number | null | undefined,
  digitStyle: 'en' | 'bn' = 'en',
  unconfirmedLabel = 'Budget Pending BDT Confirmation'
): string {
  if ((min === null || min === undefined) && (max === null || max === undefined)) {
    return unconfirmedLabel;
  }
  if (min !== null && min !== undefined && (max === null || max === undefined)) {
    return `${formatBDT(min, digitStyle)}+`;
  }
  if ((min === null || min === undefined) && max !== null && max !== undefined) {
    return `Up to ${formatBDT(max, digitStyle)}`;
  }
  return `${formatBDT(min, digitStyle)} – ${formatBDT(max, digitStyle)}`;
}

/**
 * Formats a raw BDT budget string (such as `৳ 50,000 - ৳ 1,50,000`) into the chosen digit style.
 */
export function localizeBDTString(text: string, digitStyle: 'en' | 'bn' = 'en'): string {
  if (!text) return '';
  return digitStyle === 'bn' ? toBengaliDigits(text) : text;
}

export interface BdtFinancialTotals {
  confirmedRevenueBdt: number;
  pendingRevenueBdt: number;
  paidCount: number;
  pendingCount: number;
  unconfirmedCourseFeeCount: number;
}

export function calculateRegistrationTotals(
  registrations: StudentRegistration[],
  courses: ModelingCourse[]
): BdtFinancialTotals {
  let confirmedRevenueBdt = 0;
  let pendingRevenueBdt = 0;
  let paidCount = 0;
  let pendingCount = 0;

  for (const reg of registrations) {
    const linkedCourse = courses.find((c) => c.id === reg.courseId);
    const fee =
      typeof reg.feeAmountBdt === 'number'
        ? reg.feeAmountBdt
        : linkedCourse?.bdtConfirmed && typeof linkedCourse.feeAmount === 'number'
        ? linkedCourse.feeAmount
        : null;

    if (reg.paymentStatus === 'paid' || reg.status === 'approved') {
      paidCount += 1;
      if (fee !== null) confirmedRevenueBdt += fee;
    } else if (reg.status === 'pending' || reg.status === 'contacted') {
      pendingCount += 1;
      if (fee !== null) pendingRevenueBdt += fee;
    }
  }

  const unconfirmedCourseFeeCount = courses.filter(
    (c) => !c.bdtConfirmed || c.feeAmount === null || c.feeAmount === undefined
  ).length;

  return {
    confirmedRevenueBdt,
    pendingRevenueBdt,
    paidCount,
    pendingCount,
    unconfirmedCourseFeeCount,
  };
}

export function calculateCollaborationTotals(collaborations: CollaborationInquiry[]): {
  totalQuotedBdt: number;
  quotedCount: number;
} {
  let totalQuotedBdt = 0;
  let quotedCount = 0;
  for (const c of collaborations) {
    if (typeof c.quotedAmountBdt === 'number' && !Number.isNaN(c.quotedAmountBdt) && c.quotedAmountBdt > 0) {
      totalQuotedBdt += c.quotedAmountBdt;
      quotedCount += 1;
    }
  }
  return { totalQuotedBdt, quotedCount };
}
