import { createWorker } from "tesseract.js";

export interface ParsedUpiDetails {
  detectedUtr: string | null;
  detectedAmount: string | null;
  detectedDate: string | null;
  detectedApp: string | null;
  payeeMatched: boolean;
  statusMatched: boolean;
  rawText: string;
}

/**
 * Intelligent parser for Indian UPI receipts (PhonePe, Google Pay, Paytm, BHIM, etc.)
 */
export function parseUpiReceiptText(rawText: string): ParsedUpiDetails {
  const clean = rawText.replace(/\r/g, " ");

  // 1. Detect App
  let detectedApp: string | null = null;
  if (/phonepe/i.test(clean)) detectedApp = "PhonePe";
  else if (/google\s*pay|gpay/i.test(clean)) detectedApp = "Google Pay";
  else if (/paytm/i.test(clean)) detectedApp = "Paytm";
  else if (/bhim/i.test(clean)) detectedApp = "BHIM";
  else if (/cred/i.test(clean)) detectedApp = "CRED";
  else if (/amazon\s*pay/i.test(clean)) detectedApp = "Amazon Pay";

  // 2. Detect 12-digit UPI UTR / Reference Number
  let detectedUtr: string | null = null;

  // Specific contextual patterns first
  const utrContextPatterns = [
    /(?:upi\s*transaction\s*id)[:\s#]*([0-9\s-]{12,20})/i,
    /(?:upi\s*ref(?:erence)?\s*(?:no|num|id)?|utr|rrn|ref\s*no)[:\s#]*([0-9\s-]{12,20})/i,
    /(?:bank\s*ref(?:erence)?\s*(?:no|num)?|rrn)[:\s#]*([0-9\s-]{12,20})/i,
    /(?:txn\s*id|transaction\s*id)[:\s#]*([0-9\s-]{12,20})/i,
  ];

  for (const regex of utrContextPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      const candidateDigits = match[1].replace(/[\s-]/g, "");
      const twelve = candidateDigits.match(/\d{12}/);
      if (twelve) {
        detectedUtr = twelve[0];
        break;
      }
    }
  }

  // Next: Check for any line or pattern containing 12 digits near UPI keywords
  if (!detectedUtr) {
    const lines = clean.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/upi|ref|utr|rrn|txn|transfer|id/i.test(line)) {
        // Check current line and next line
        const combined = `${line} ${lines[i + 1] || ""}`;
        const digits = combined.replace(/[^0-9]/g, "");
        const m = digits.match(/\d{12}/);
        if (m && !m[0].startsWith("9967313355") && !m[0].startsWith("9876543210")) {
          detectedUtr = m[0];
          break;
        }
      }
    }
  }

  // Fallback 1: Spaced 12 digits like "4289 0123 4567"
  if (!detectedUtr) {
    const spacedMatch = clean.match(/\b(\d{4}\s\d{4}\s\d{4})\b/);
    if (spacedMatch) {
      detectedUtr = spacedMatch[1].replace(/\s/g, "");
    }
  }

  // Fallback 2: Standalone 12-digit number (RBI standard UPI reference numbers)
  if (!detectedUtr) {
    const twelveDigits = clean.match(/\b\d{12}\b/g);
    if (twelveDigits && twelveDigits.length > 0) {
      // Pick the first 12-digit number not matching known phone numbers
      const valid = twelveDigits.find(num => !num.startsWith("9967313355") && !num.startsWith("9876543210"));
      detectedUtr = valid || twelveDigits[0];
    }
  }

  // 3. Detect Amount
  let detectedAmount: string | null = null;
  const amountPatterns = [
    /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:paid|amount|total)[:\s]*(?:₹|rs\.?)?\s*([\d,]+(?:\.\d{2})?)/i,
    /₹\s*([\d,]+)/i,
  ];

  for (const regex of amountPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      const parsedVal = match[1].replace(/,/g, "").trim();
      if (!isNaN(Number(parsedVal)) && Number(parsedVal) > 0) {
        detectedAmount = Number(parsedVal).toFixed(2);
        break;
      }
    }
  }

  // 4. Detect Date
  let detectedDate: string | null = null;
  const datePatterns = [
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}(?:,?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)?)/i,
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)?)/i,
  ];

  for (const regex of datePatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      detectedDate = match[1].trim();
      break;
    }
  }

  // 5. Match Devangi details
  const payeeMatched = /devangi|okhdfcbank|9967313355/i.test(clean);

  // 6. Match Successful payment status
  const statusMatched = /success|successful|paid|completed/i.test(clean);

  return {
    detectedUtr,
    detectedAmount,
    detectedDate,
    detectedApp,
    payeeMatched,
    statusMatched,
    rawText: rawText.trim().slice(0, 800),
  };
}

let cachedWorker: any = null;
let workerInitPromise: Promise<any> | null = null;

async function getWorker() {
  if (cachedWorker) return cachedWorker;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    try {
      const worker = await createWorker("eng");
      cachedWorker = worker;
      return worker;
    } catch (err) {
      workerInitPromise = null;
      throw err;
    }
  })();

  return workerInitPromise;
}

/**
 * Perform OCR on image buffer using high-speed singleton Tesseract.js worker
 */
export async function extractReceiptDetails(imageBuffer: Buffer): Promise<ParsedUpiDetails> {
  try {
    const worker = await getWorker();
    const ret = await worker.recognize(imageBuffer);
    return parseUpiReceiptText(ret.data.text || "");
  } catch (err) {
    console.error("[OCR Extraction Error]", err);
    cachedWorker = null;
    workerInitPromise = null;
    return {
      detectedUtr: null,
      detectedAmount: null,
      detectedDate: null,
      detectedApp: null,
      payeeMatched: false,
      statusMatched: false,
      rawText: "",
    };
  }
}
