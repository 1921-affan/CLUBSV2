import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  to: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", to);

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1; margin-bottom: 10px;">Welcome to TheClubs!</h1>
          <p style="color: #64748b; font-size: 16px;">Your College Clubs & Events Hub</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 15px;">Hi ${name},</p>
          <p style="color: #64748b; line-height: 1.6;">
            Thank you for joining TheClubs! You now have access to all the clubs, events, and announcements on our platform.
          </p>
        </div>
        <div style="margin: 30px 0;">
          <h2 style="color: #334155; font-size: 18px; margin-bottom: 15px;">What you can do:</h2>
          <ul style="color: #64748b; line-height: 1.8;">
            <li>📚 Browse and join college clubs</li>
            <li>📅 Discover and register for upcoming events</li>
            <li>📢 Stay updated with club announcements</li>
            <li>🎯 Manage your club memberships</li>
          </ul>
        </div>
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="color: white; margin: 0; font-size: 16px;">
            Ready to explore? Start discovering clubs and events now!
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 14px;">
            If you have any questions, feel free to reach out to your college admin.
          </p>
          <p style="color: #64748b; margin-top: 15px;">
            Best regards,<br />
            <strong>TheClubs Team</strong>
          </p>
        </div>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TheClubs <onboarding@resend.dev>",
        to: [to],
        subject: "🎓 Welcome to TheClubs!",
        html: htmlContent,
      }),
    });

    const emailResponse = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error in send-welcome-email:", emailResponse);
      return new Response(JSON.stringify({ error: emailResponse }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
