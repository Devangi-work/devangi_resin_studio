export interface PolicyHighlightItem {
  id?: string;
  title: string;
  desc: string;
}

export interface PolicyDetailedSectionItem {
  id?: string;
  title: string;
  desc: string;
  tips?: string[];
}

export interface PolicyAlertBoxItem {
  enabled?: boolean;
  title: string;
  message: string;
  type?: "note" | "warning";
}

export interface PolicyPageTemplate {
  key: "shipping" | "returns" | "care" | "privacy" | "terms";
  name: string;
  badge: string;
  subtitle: string;
  statement: string;
  highlights: PolicyHighlightItem[];
  detailedSections: PolicyDetailedSectionItem[];
  alertBox: PolicyAlertBoxItem;
}

export const defaultPolicyTemplates: Record<string, PolicyPageTemplate> = {
  shipping: {
    key: "shipping",
    name: "Shipping & Dispatch Policy",
    badge: "PAN-INDIA INSURED DELIVERY",
    subtitle:
      "Every keepsake is handcrafted and safely dispatched from our studio with multi-layered protective packaging across India.",
    statement:
      "All ready-made resin pieces are dispatched within 2 business days. Made-to-order and custom pieces require 3 to 5 business days for precision curing before secure dispatch.",
    highlights: [
      {
        title: "3-5 Days Curing Time",
        desc: "Archival epoxy resin requires thorough multi-stage curing for crystal clarity before packaging.",
      },
      {
        title: "Multi-Layer Protective Wrap",
        desc: "Individually wrapped with bubble cushioning, honeycomb padding, and reinforced boxes.",
      },
      {
        title: "Free Delivery over Threshold",
        desc: "Orders over studio threshold ship free across India with insured doorstep tracking.",
      },
      {
        title: "Real-time Tracking Updates",
        desc: "Instant live courier tracking links shared directly to your WhatsApp and Email on dispatch.",
      },
    ],
    detailedSections: [
      {
        title: "1. Order Processing & Artisan Crafting Schedule",
        desc: "Unlike mass-produced goods, each Devangi Resin piece is individually hand-poured, cured, and hand-polished. Ready-to-ship pieces dispatch within 24-48 hours. Custom wedding keepsakes, nameplates, and flower preservation items require 3 to 7 business days to ensure complete polymer crystallization and crystal glass finish.",
        tips: [
          "Ready-to-Ship items: Dispatch in 1 to 2 business days",
          "Personalized Keepsakes & Clocks: 3 to 5 business days",
          "Complex Wedding Flower Preservation: 5 to 7 business days",
        ],
      },
      {
        title: "2. Domestic Courier Partners & Transit Timelines",
        desc: "We partner exclusively with tier-1 express courier services including BlueDart, Delhivery, and DTDC. Delivery to metro cities (Mumbai, Delhi NCR, Bengaluru, Chennai, Hyderabad, Pune, Ahmedabad) typically takes 2 to 4 business days post-dispatch. Rest of India takes 4 to 6 business days.",
        tips: [
          "Metro Cities: 2 - 4 business days post-dispatch",
          "Tier-2 & Tier-3 Cities: 4 - 6 business days post-dispatch",
          "Remote & North-Eastern regions: 5 - 8 business days post-dispatch",
        ],
      },
      {
        title: "3. Damaged Parcel or Delivery Exceptions",
        desc: "All packages are insured against in-transit loss or damage. In the rare event of a crushed outer carton upon delivery, please document the package with an unboxing video and notify our studio immediately via WhatsApp.",
        tips: [
          "Always inspect outer parcel seal prior to signing courier delivery receipt",
          "Record a continuous 30-second unboxing video showing sealed packaging being opened",
        ],
      },
    ],
    alertBox: {
      enabled: true,
      title: "Artisan Note on Festive Delays",
      message:
        "During major festive seasons (Diwali, Rakhi, New Year, Valentine's), high courier volumes across national transit hubs may cause an extra 24-48 hour delay. We advise ordering early for milestone events.",
      type: "note",
    },
  },

  returns: {
    key: "returns",
    name: "Returns & Exchange Policy",
    badge: "100% ARTISAN HAPPINESS GUARANTEE",
    subtitle:
      "We take immense pride in our craftsmanship. Learn how our damage replacement guarantee and return protocols safeguard your purchase.",
    statement:
      "Because each resin art creation is custom handcrafted, returns are accepted within 7 days exclusively for items that arrive damaged or defective in transit.",
    highlights: [
      {
        title: "Transit Damage Guarantee",
        desc: "100% free immediate replacement or refund if your order arrives broken or defective.",
      },
      {
        title: "7-Day Reporting Window",
        desc: "Notify our concierge within 7 calendar days of delivery with your unboxing clip.",
      },
      {
        title: "Handmade Integrity",
        desc: "Organic petal swirls and gold flake distributions are celebrated hallmarks of hand-poured art.",
      },
      {
        title: "Direct Artisan Resolution",
        desc: "No automated bots — chat directly with Devangi on WhatsApp for quick, fair resolutions.",
      },
    ],
    detailedSections: [
      {
        title: "1. Eligible Reasons for Replacement or Refund",
        desc: "We gladly issue an immediate remake or full refund in any of the following verified instances:",
        tips: [
          "Item arrived cracked, broken, or shattered during courier transit",
          "Wrong item or incorrect personalization spelling from the details you submitted",
          "Significant structural defect or uncured tacky resin surface upon delivery",
        ],
      },
      {
        title: "2. The 30-Second Unboxing Video Requirement",
        desc: "Because resin items are fragile decorative works, an uncut unboxing video showing the sealed courier package being opened is required to file an insurance claim with our courier partners. This ensures prompt replacement approval without protracted delays.",
      },
      {
        title: "3. Non-Returnable Custom Creations",
        desc: "Custom made-to-order pieces created with bespoke customer names, personalized photos, or unique flower inclusions cannot be returned for change-of-mind once production has commenced. However, if any custom piece arrives damaged, our 100% free remake guarantee fully applies.",
      },
      {
        title: "4. Refund Timeline & Processing",
        desc: "Approved refunds are credited directly back to the original UPI / Google Pay account or bank account within 24 to 48 business hours of claim verification.",
      },
    ],
    alertBox: {
      enabled: true,
      title: "How to File a Quick Claim",
      message:
        "Simply message our studio on WhatsApp with your Order Number and continuous unboxing video. We resolve 95% of claims within 4 business hours.",
      type: "warning",
    },
  },

  care: {
    key: "care",
    name: "Resin Art Care Guide & Maintenance",
    badge: "LIFELONG KEEPSAKE PRESERVATION",
    subtitle:
      "Master the simple techniques to maintain the optical glass clarity, shimmering mica depths, and vivid botanical colors of your resin pieces.",
    statement:
      "Keep away from prolonged direct high heat or sunlight. Clean gently with a soft microfiber cloth and mild soap. Avoid harsh chemical cleaners or abrasive scouring pads.",
    highlights: [
      {
        title: "Avoid Direct Extreme Heat",
        desc: "Resin maintains structural perfection up to 50°C (122°F). Do not place boiling cookware directly.",
      },
      {
        title: "Gentle Microfiber Cleaning",
        desc: "Wipe with a soft lint-free microfiber cloth and lukewarm water with mild soap.",
      },
      {
        title: "Zero Harsh Chemicals",
        desc: "Never use acetone, alcohol rubs, nail polish removers, or ammonia-based cleaners.",
      },
      {
        title: "Archival UV Non-Yellowing",
        desc: "Crafted with highest-grade optical UV inhibitors for decades of vibrant clarity.",
      },
    ],
    detailedSections: [
      {
        title: "1. Everyday Cleaning Routine",
        desc: "To remove light dust or finger smudges, gently wipe the surface with the soft microfiber cloth provided with your order. For deeper cleaning, moisten the cloth with lukewarm water and a drop of mild dishwashing liquid. Gently wipe clean, then buff dry with a dry cloth.",
        tips: [
          "Use only ultra-soft microfiber cloths (never paper towels or rough sponges)",
          "Do NOT submerge electrified resin clocks or photo frames in water",
          "Resin coasters are hand-wash only — never place in a mechanical dishwasher",
        ],
      },
      {
        title: "2. Temperature & Sunlight Guidelines",
        desc: "Our pieces are poured with state-of-the-art optical UV-stabilized resin that resists photo-aging. However, like fine museum art, prolonged exposure to intense scorching sunlight or high-heat appliances (radiators, car dashboards in peak summer) should be avoided to prevent softening.",
      },
      {
        title: "3. Handling Coasters, Geode Trays & Clocks",
        desc: "Resin coasters are suitable for warm coffee mugs and cold drinks. For piping-hot cookware directly off a gas stove, use a silicone trivet. When handling metallic leaf edges (gold/silver leaf trims), avoid aggressive scraping with metal utensils.",
      },
      {
        title: "4. Restoring High-Gloss Shine",
        desc: "Over years of love and use, minor hairline micro-scratches can easily be buffed out using a tiny dab of high-grade plastic polish or automobile carnauba wax with a circular microfiber rub.",
      },
    ],
    alertBox: {
      enabled: true,
      title: "Important Safety Advisory",
      message:
        "Devangi Resin Studio items are decorative art pieces. While cured resin is non-toxic and inert, it is not certified as a cutting board or microwave-safe container.",
      type: "note",
    },
  },

  privacy: {
    key: "privacy",
    name: "Privacy & Data Protection Policy",
    badge: "YOUR TRUST IS OUR PROMISE",
    subtitle:
      "We respect your personal privacy. Discover how we protect your contact details, shipping addresses, and transaction security.",
    statement:
      "We respect your privacy and never share your email, phone, or shipping address with third parties except for order fulfillment and payment processing.",
    highlights: [
      {
        title: "Zero Third-Party Data Sales",
        desc: "We will never sell, rent, or trade your contact or order information to advertising networks.",
      },
      {
        title: "Direct UPI & Banking Security",
        desc: "Payments are processed securely via verified UPI apps (GPay, PhonePe, Paytm) — we never see your banking PIN.",
      },
      {
        title: "Courier-Only Delivery Sharing",
        desc: "Your phone number and postal address are shared strictly with our insured logistics partner for delivery.",
      },
      {
        title: "Complete Data Erasure Rights",
        desc: "You can request complete deletion of your account and order history at any time.",
      },
    ],
    detailedSections: [
      {
        title: "1. Information We Collect to Fulfill Your Order",
        desc: "When you place a handmade order on Devangi Resin Studio, we collect necessary fulfillment data: your full name, mobile number, delivery address with pincode, and optional email address for order notifications. For custom photo keepsakes, uploaded photographs are stored in private, encrypted cloud storage and deleted once production completes.",
      },
      {
        title: "2. How Your Information is Used",
        desc: "Your personal details are used solely to handcraft your items, generate your invoice, send WhatsApp & SMS shipping alerts, and coordinate doorstep delivery. We do not spam you with unsolicited promotional calls.",
      },
      {
        title: "3. Payment Integrity & UPI Privacy",
        desc: "Our storefront integrates direct UPI QR payment verification. Because UPI transactions occur inside your authorized banking application (such as Google Pay, PhonePe, or Axis Bank), Devangi Resin Studio never accesses, collects, or stores your debit card numbers, CVVs, or UPI PINs.",
      },
      {
        title: "4. Right to Access & Account Deletion",
        desc: "You have the right to request a summary of the personal information stored in our database, or ask for immediate data removal by emailing our studio team.",
      },
    ],
    alertBox: {
      enabled: true,
      title: "Data Security Guarantee",
      message:
        "All customer account records and order archives are protected using encrypted cloud databases and SSL 256-bit secure sockets.",
      type: "note",
    },
  },

  terms: {
    key: "terms",
    name: "Terms & Conditions of Artisan Keepsakes",
    badge: "STUDIO ARTISAN AGREEMENT",
    subtitle:
      "Clear, transparent guidelines governing our artisan studio offerings, custom commissions, and customer orders.",
    statement:
      "By placing an order on Devangi Resin Studio, you acknowledge that handmade art may exhibit slight organic variations in petal placement, pigment swirling, and foil flakes, which is the hallmark of genuine artisan craftsmanship.",
    highlights: [
      {
        title: "Bespoke Artisan Character",
        desc: "Each item is crafted by hand; minor bubble placement or petal nuance is evidence of authentic artistry.",
      },
      {
        title: "1-Hour Cancellation Grace Period",
        desc: "Orders may be cancelled within 60 minutes before curing molds and resins are prepped.",
      },
      {
        title: "Accurate Dimensions & Weights",
        desc: "Product specs represent exact studio standards, within natural handcraft tolerances.",
      },
      {
        title: "Fair Resolution Guarantee",
        desc: "We stand behind every resin pour with personal care and prompt artisan support.",
      },
    ],
    detailedSections: [
      {
        title: "1. Acceptance of Artisan Variations",
        desc: "Resin is a fluid medium. While we reproduce catalog designs faithfully, subtle variations in floral petal pigmentation, leaf size, metallic gold swirling, and micro air bubbles are natural characteristics of hand-poured epoxy art that make each creation truly unique.",
      },
      {
        title: "2. Payment & Order Confirmation",
        desc: "Custom personalized pieces enter production strictly upon receipt of verified UPI or digital payment. Unpaid orders are held for 30 minutes before release back to inventory.",
      },
      {
        title: "3. Intellectual Property Rights",
        desc: "All product photography, logo branding, and original artisan designs showcased on this domain are the exclusive copyright of Devangi Resin Studio.",
      },
    ],
    alertBox: {
      enabled: true,
      title: "Artisan Agreement Notice",
      message:
        "By completing checkout, you confirm acceptance of our handmade production standards and operational guidelines.",
      type: "note",
    },
  },
};

