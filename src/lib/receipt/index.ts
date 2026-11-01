/**
 * Sanitizes and generates a professional, clean filename for printable receipt PDFs.
 * Ensures customer name and order number are properly formatted and legal on all OS filesystems.
 */
export function formatReceiptFileName(
  customerName?: string | null,
  orderNumber?: string | null
): string {
  const cleanName = (customerName || "Customer")
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "") // strip illegal characters
    .replace(/\s+/g, " "); // collapse multiple spaces

  const cleanOrderNum = (orderNumber || "Order")
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "");

  return `Receipt - ${cleanName} - ${cleanOrderNum}`;
}

