import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validations";
import { addBrevoNewsletterSubscriber } from "@/lib/email/brevo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = newsletterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { email } = result.data;
    await addBrevoNewsletterSubscriber(email);

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing! Use coupon WELCOME10 for 10% off your first order.",
      couponCode: "WELCOME10",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
