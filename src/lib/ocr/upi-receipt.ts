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
  // Common patterns:
  // "UPI Ref No: 428901234567"
  // "UPI transaction ID: 428901234567"
  // "UTR: 428901234567"
  // "Ref No. 428901234567"
  let detectedUtr: string | null = null;

  // Specific contextual patterns first
  const utrContextPatterns = [
    /(?:upi\s*ref(?:erence)?\s*(?:no|num|id)?|utr|txn\s*id|transaction\s*id|reference\s*id)[:\s#]*([A-Za-z0-9]{12,24})/i,
    /(?:upi\s*ref(?:\s*no)?)[:\s]*(\d{12})/i,
    /(?:upi\s*transaction\s*id)[:\s]*(\d{12})/i,
    /(?:google\s*transaction\s*id)[:\s]*([A-Za-z0-9_-]{10,30})/i,
    /(?:utr)[:\s]*(\d{12})/i,
  ];

  for (const regex of utrContextPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // If candidate contains a 12 digit sequence, prefer that
      const twelveDigit = candidate.match(/\d{12}/);
      detectedUtr = twelveDigit ? twelveDigit[0] : candidate;
      break;
    }
  }

  // Fallback: any standalone 12-digit number (standard RBI/NPCI UPI UTR length)
  if (!detectedUtr) {
    const twelveDigits = clean.match(/\b\d{12}\b/g);
    if (twelveDigits && twelveDigits.length > 0) {
      // Pick the first 12-digit number (or one not resembling 9967313355 phone)
      detectedUtr = twelveDigits[0];
    }
  }

  // 3. Detect Amount
  // Patterns like ₹1,200.00, ₹ 1200, Rs. 1200, 1200.00
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
    rawText: rawText.trim().slice(0, 800), // snippet for auditing
  };
}

/**
 * Perform OCR on image buffer using Tesseract.js
 */
export async function extractReceiptDetails(imageBuffer: Buffer): Promise<ParsedUpiDetails> {
  try {
    const worker = await createWorker("eng");
    const ret = await worker.recognize(imageBuffer);
    await worker.terminate();

    return parseUpiReceiptText(ret.data.text || "");
  } catch (err) {
    console.error("[OCR Extraction Error]", err);
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
