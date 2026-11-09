import { Metadata } from "next";
import { EarlyAccessLaunchPage } from "@/components/launch/EarlyAccessLaunchPage";

export const metadata: Metadata = {
  title: "Early Access VIP Launch | Devangi Resin Studio",
  description:
    "Join our WhatsApp Community to get early access to our website launch, along with the latest product updates, exclusive offers, discount coupon codes, festive deals, and much more!",
};

export default function EarlyAccessPage() {
  return <EarlyAccessLaunchPage />;
}

