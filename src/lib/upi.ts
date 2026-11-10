import QRCode from "qrcode";

export interface BuildUpiUriParams {
  upiId: string;
  accountHolderName: string;
  amount: number;
  orderReference?: string;
  transactionId?: string;
}

/**
 * Builds the standard UPI payment URI with pre-filled amount:
 * upi://pay?pa=OWNER_UPI_ID&pn=ACCOUNT_HOLDER_NAME&am=230.00&cu=INR&tn=ORDER_REFERENCE&tr=UNIQUE_TRANSACTION_ID
 */
export function buildUpiPaymentUri(params: BuildUpiUriParams): string {
  const { upiId, accountHolderName, amount, orderReference, transactionId } = params;
  const cleanUpiId = (upiId || "").trim();
  const cleanName = (accountHolderName || "").trim();
  const formattedAmount = Number(amount || 0).toFixed(2);
  const ref = orderReference || transactionId || `DRS${Date.now()}`;
  const tr = transactionId || ref;
  const tn = encodeURIComponent(`Order ${ref}`);

  return `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(
    cleanName
  )}&am=${formattedAmount}&cu=INR&tn=${tn}&tr=${encodeURIComponent(tr)}`;
}

/**
 * Programmatically converts a UPI payment URI into a clean Base64 PNG QR code data URL.
 */
export async function generateUpiQrCodeDataUrl(upiUri: string): Promise<string> {
  return await QRCode.toDataURL(upiUri, {
    margin: 1,
    width: 280,
    errorCorrectionLevel: "M",
    color: {
      dark: "#2C332D",
      light: "#FFFFFF",
    },
  });
}

/**
 * Generates a unique payment transaction reference (e.g. DRS591024AK8L).
 */
export function generatePaymentReference(): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DRS${ts}${rand}`;
}

