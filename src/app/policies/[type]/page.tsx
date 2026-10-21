import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbStore } from "@/lib/db";
import {
  Truck,
  RotateCcw,
  Sparkles,
  Lock,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Package,
  HeartHandshake,
  AlertTriangle,
  Droplets,
  Sun,
  ShieldAlert,
  HelpCircle,
  MessageCircle,
  Mail,
  ChevronRight,
  ArrowRight,
  Calendar,
} from "lucide-react";

interface PolicyPageProps {
  params: Promise<{ type: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: PolicyPageProps) {
  const { type } = await params;
  const titles: Record<string, string> = {
    shipping: "Shipping & Dispatch Policy | Devangi Resin Studio",
    returns: "Returns & Exchange Policy | Devangi Resin Studio",
    care: "Resin Care Guide & Longevity Tips | Devangi Resin Studio",
    privacy: "Privacy & Data Protection Policy | Devangi Resin Studio",
    terms: "Terms & Conditions of Sale | Devangi Resin Studio",
  };
  return {
    title: titles[type] || "Policies | Devangi Resin Studio",
    description: "Read the official customer policies, shipping timelines, resin care guide, and guarantee of Devangi Resin Studio.",
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { type } = await params;
  const settings = await dbStore.getSiteSettings();

  const validTypes = ["shipping", "returns", "care", "privacy", "terms"];
  if (!validTypes.includes(type)) {
    notFound();
  }

  const freeThreshold = Number(settings.freeShippingThreshold || 999);
  const defaultShipping = Number(settings.defaultShippingCharge || 79);

  // Policy configurations with dynamic content and rich structured data
  const policyConfigs: Record<
    string,
    {
      title: string;
      badge: string;
      subtitle: string;
      icon: any;
      dynamicContent: string;
      highlights: Array<{ icon: any; title: string; desc: string }>;
      detailedSections: Array<{ title: string; desc: string; tips?: string[] }>;
      alertBox?: { title: string; message: string; type: "note" | "warning" };
    }
  > = {
    shipping: {
      title: "Shipping & Dispatch Policy",
      badge: "PAN-INDIA INSURED DELIVERY",
      subtitle:
        "Every keepsake is handcrafted and safely dispatched from our studio with multi-layered protective packaging across India.",
      icon: Truck,
      dynamicContent:
        settings.shippingPolicy ||
        "All ready-made resin pieces are dispatched within 2 business days. Made-to-order and custom pieces require 3 to 5 business days for precision curing before secure dispatch.",
      highlights: [
        {
          icon: Clock,
          title: "3-5 Days Curing Time",
          desc: "Archival epoxy resin requires thorough multi-stage curing for crystal clarity before packaging.",
        },
        {
          icon: Package,
          title: "Multi-Layer Protective Wrap",
          desc: "Individually wrapped with bubble cushioning, honeycomb padding, and reinforced boxes.",
        },
        {
          icon: Truck,
          title: `Free Delivery over ₹${freeThreshold}`,
          desc: `Orders over ₹${freeThreshold} ship free across India. Standard insured delivery is ₹${defaultShipping}.`,
        },
        {
          icon: MessageCircle,
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
        },
      ],
      alertBox: {
        title: "Artisan Note on Festive Delays",
        message:
          "During major festive seasons (Diwali, Rakhi, New Year, Valentine's), high courier volumes across national transit hubs may cause an extra 24-48 hour delay. We advise ordering early for milestone events.",
        type: "note",
      },
    },

    returns: {
      title: "Returns & Exchange Policy",
      badge: "100% ARTISAN HAPPINESS GUARANTEE",
      subtitle:
        "We take immense pride in our craftsmanship. Learn how our damage replacement guarantee and return protocols safeguard your purchase.",
      icon: RotateCcw,
      dynamicContent:
        settings.returnPolicy ||
        "Because each resin art creation is custom handcrafted, returns are accepted within 7 days exclusively for items that arrive damaged or defective in transit.",
      highlights: [
        {
          icon: ShieldCheck,
          title: "Transit Damage Guarantee",
          desc: "100% free immediate replacement or refund if your order arrives broken or defective.",
        },
        {
          icon: Calendar,
          title: "7-Day Reporting Window",
          desc: "Notify our concierge within 7 calendar days of delivery with your unboxing clip.",
        },
        {
          icon: Sparkles,
          title: "Handmade Integrity",
          desc: "Organic petal swirls and gold flake distributions are celebrated hallmarks of hand-poured art.",
        },
        {
          icon: HeartHandshake,
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
        title: "How to File a Quick Claim",
        message:
          `Simply WhatsApp our studio at ${settings.whatsappNumber || "+919876543210"} with your Order Number and 30-second unboxing video. We resolve 95% of claims within 4 business hours.`,
        type: "warning",
      },
    },

    care: {
      title: "Resin Art Care Guide",
      badge: "LIFELONG KEEPSAKE PRESERVATION",
      subtitle:
        "Master the simple techniques to maintain the optical glass clarity, shimmering mica depths, and vivid botanical colors of your resin pieces.",
      icon: Sparkles,
      dynamicContent:
        settings.careInstructionsDefault ||
        "Keep away from prolonged direct high heat or sunlight. Clean gently with a soft microfiber cloth and mild soap. Avoid harsh chemical cleaners or abrasive scouring pads.",
      highlights: [
        {
          icon: Sun,
          title: "Avoid Direct Extreme Heat",
          desc: "Resin maintains structural perfection up to 50°C (122°F). Do not place boiling cookware directly.",
        },
        {
          icon: Droplets,
          title: "Gentle Microfiber Cleaning",
          desc: "Wipe with a soft lint-free microfiber cloth and lukewarm water with mild soap.",
        },
        {
          icon: ShieldAlert,
          title: "Zero Harsh Chemicals",
          desc: "Never use acetone, alcohol rubs, nail polish removers, or ammonia-based cleaners.",
        },
        {
          icon: Sparkles,
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
        title: "Important Safety Advisory",
        message:
          "Devangi Resin Studio items are decorative art pieces. While cured resin is non-toxic and inert, it is not certified as a cutting board or microwave-safe container.",
        type: "note",
      },
    },

    privacy: {
      title: "Privacy & Data Protection Policy",
      badge: "YOUR TRUST IS OUR PROMISE",
      subtitle:
        "We respect your personal privacy. Discover how we protect your contact details, shipping addresses, and transaction security.",
      icon: Lock,
      dynamicContent:
        settings.privacyPolicy ||
        "We respect your privacy and never share your email, phone, or shipping address with third parties except for order fulfillment and payment processing.",
      highlights: [
        {
          icon: Lock,
          title: "Zero Third-Party Data Sales",
          desc: "We will never sell, rent, or trade your contact or order information to advertising networks.",
        },
        {
          icon: ShieldCheck,
          title: "Direct UPI & Banking Security",
          desc: "Payments are processed securely via verified UPI apps (GPay, PhonePe, Paytm) — we never see your banking PIN.",
        },
        {
          icon: Package,
          title: "Courier-Only Delivery Sharing",
          desc: "Your phone number and postal address are shared strictly with our insured logistics partner for delivery.",
        },
        {
          icon: FileText,
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
          desc: "You have the right to request a summary of the personal information stored in our database, or ask for immediate data removal by emailing hello@devangiresinstudio.com.",
        },
      ],
    },

    terms: {
      title: "Terms & Conditions of Sale",
      badge: "STUDIO ARTISAN AGREEMENT",
      subtitle:
        "Clear, transparent guidelines governing our artisan studio offerings, custom commissions, and customer orders.",
      icon: FileText,
      dynamicContent:
        settings.termsPolicy ||
        "By placing an order on Devangi Resin Studio, you acknowledge that handmade art may exhibit slight organic variations in petal placement, pigment swirling, and foil flakes, which is the hallmark of genuine artisan craftsmanship.",
      highlights: [
        {
          icon: Sparkles,
          title: "Bespoke Artisan Character",
          desc: "Each item is crafted by hand; minor bubble placement or petal nuance is evidence of authentic artistry.",
        },
        {
          icon: Clock,
          title: "1-Hour Cancellation Grace Period",
          desc: "Orders may be cancelled within 60 minutes before curing molds and resins are prepped.",
        },
        {
          icon: ShieldCheck,
          title: "Accurate Dimensions & Weights",
          desc: "Product specs represent exact studio standards, within natural handcraft tolerances.",
        },
        {
          icon: HeartHandshake,
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
    },
  };

  const currentPolicy = policyConfigs[type] || policyConfigs.shipping;
  const Icon = currentPolicy.icon;

  const policyTabs = [
    { key: "shipping", label: "Shipping & Dispatch", icon: Truck },
    { key: "returns", label: "Returns & Exchange", icon: RotateCcw },
    { key: "care", label: "Resin Care Guide", icon: Sparkles },
    { key: "privacy", label: "Privacy Policy", icon: Lock },
    { key: "terms", label: "Terms of Sale", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF8] pb-24">
      
      {/* ---------------- 1. LUXURY HERO BANNER ---------------- */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#FDF2F4] via-[#FFF9F6] to-[#FCFAF8] pt-12 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#EFE3E7]">
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#FDE8EC]/70 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute -bottom-10 left-10 w-[350px] h-[350px] bg-[#FAF0F3]/80 rounded-full blur-2xl pointer-events-none -z-0" />

        <div className="max-w-5xl mx-auto relative z-10 space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs text-[#8C6E79]">
            <Link href="/" className="hover:text-[#3A1823] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-[#C04E6C]" />
            <span>Studio Policies</span>
            <ChevronRight className="w-3 h-3 text-[#C04E6C]" />
            <span className="font-semibold text-[#3A1823]">{currentPolicy.title}</span>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/95 border border-[#E8C568]/60 px-3.5 py-1 rounded-full text-[11px] font-bold text-[#800020] uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>{currentPolicy.badge}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3A1823] leading-tight flex items-center gap-3.5">
              <span className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#3A1823] text-[#FFDF78] flex items-center justify-center flex-shrink-0 shadow-md">
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </span>
              <span>{currentPolicy.title}</span>
            </h1>

            <p className="text-sm sm:text-base text-[#7A5E68] max-w-3xl leading-relaxed font-light">
              {currentPolicy.subtitle}
            </p>
          </div>

          {/* Quick Policy Switcher Tabs */}
          <div className="pt-4 flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {policyTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = type === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={`/policies/${tab.key}`}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#3A1823] text-[#FFDF78] shadow-md ring-2 ring-[#D4AF37]/50"
                      : "bg-white text-[#7A5E68] hover:text-[#3A1823] hover:bg-white/90 border border-[#EFE3E7]"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-[#FFDF78]" : "text-[#B84A67]"}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        
        {/* ---------------- 2. DYNAMIC ADMIN-POWERED POLICY STATEMENT ---------------- */}
        <div className="bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF9F6] p-6 sm:p-10 rounded-3xl border-2 border-[#D4AF37]/40 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D4AF37]/15 to-transparent pointer-events-none rounded-bl-full" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between border-b border-[#F4DEC6] pb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#800020] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Official Studio Policy Statement</span>
              </span>
              <span className="text-[11px] text-[#8C6E79] flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Verified by Devangi Resin Studio</span>
              </span>
            </div>

            <div className="text-base sm:text-lg text-[#2C332D] leading-relaxed whitespace-pre-line font-medium font-serif italic pl-2 sm:pl-4 border-l-4 border-[#C04E6C]">
              "{currentPolicy.dynamicContent}"
            </div>

            <p className="text-xs text-[#8C6E79] pt-2">
              Note: This policy is dynamically maintained by the Devangi Resin Studio artisan team and applies directly to all purchases placed on this platform.
            </p>
          </div>
        </div>

        {/* ---------------- 3. KEY HIGHLIGHTS CARDS ---------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentPolicy.highlights.map((h, idx) => {
            const CardIcon = h.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 space-y-2.5 flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF0F3] text-[#B84A67] flex items-center justify-center">
                  <CardIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#3A1823]">
                    {h.title}
                  </h3>
                  <p className="text-xs text-[#7A5E68] leading-relaxed mt-1">
                    {h.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------------- 4. DETAILED IN-DEPTH CLAUSES ---------------- */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#EFE3E7] shadow-sm space-y-8">
          <div className="border-b border-[#F4EBE6] pb-4">
            <h2 className="font-serif text-2xl font-bold text-[#3A1823]">
              Comprehensive Policy Guidelines & Procedures
            </h2>
            <p className="text-xs text-[#7A5E68] mt-1">
              Please review these clear operational principles established for your confidence and handcrafted satisfaction.
            </p>
          </div>

          <div className="space-y-6">
            {currentPolicy.detailedSections.map((sec, i) => (
              <div key={i} className="space-y-2.5 pb-5 border-b border-[#FAF0F3] last:border-b-0 last:pb-0">
                <h3 className="font-serif text-base font-bold text-[#3A1823] flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                  <span>{sec.title}</span>
                </h3>
                <p className="text-sm text-[#7A5E68] leading-relaxed pl-6">
                  {sec.desc}
                </p>

                {sec.tips && sec.tips.length > 0 && (
                  <div className="pl-6 pt-2">
                    <ul className="space-y-1.5">
                      {sec.tips.map((tip, tIdx) => (
                        <li key={tIdx} className="text-xs text-[#3A1823] flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B84A67]" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Optional Alert Box */}
          {currentPolicy.alertBox && (
            <div
              className={`p-4 sm:p-5 rounded-2xl flex items-start space-x-3 border ${
                currentPolicy.alertBox.type === "warning"
                  ? "bg-[#FFF9F5] border-[#F4D3BA] text-[#800020]"
                  : "bg-[#FDF2F4] border-[#E8C568]/50 text-[#3A1823]"
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-[#C04E6C] flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold uppercase tracking-wider">
                  {currentPolicy.alertBox.title}
                </h4>
                <p className="text-[#7A5E68] leading-relaxed">
                  {currentPolicy.alertBox.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- 5. ARTISAN HELP & CONCIERGE CARD ---------------- */}
        <div className="bg-gradient-to-r from-[#3A1823] via-[#4A1826] to-[#3A1823] text-white p-6 sm:p-10 rounded-3xl shadow-xl border border-[#D4AF37]/40 relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFDF78] px-3 py-1 rounded-full bg-white/10 border border-white/20 inline-block">
              Direct Studio Support
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFF6E5]">
              Have a Specific Question Regarding Your Order?
            </h2>

            <p className="text-xs sm:text-sm text-[#D1BFC6] leading-relaxed">
              Every creation is poured with care by Devangi. If you need bespoke dispatch arrangements, have a wedding deadline, or have questions regarding resin care, message our studio directly.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${(settings.whatsappNumber || "+919876543210").replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#25D366] text-white hover:bg-[#20ba59] shadow-md transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Devangi on WhatsApp</span>
              </a>

              <a
                href={`mailto:${settings.contactEmail || "hello@devangiresinstudio.com"}`}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-[#3A1823] hover:bg-[#FFDF78] shadow-md transition-all active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Email Studio Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
