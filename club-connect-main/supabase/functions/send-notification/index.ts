import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  recipientName: string;
  type: "event_approved" | "event_rejected" | "announcement_approved" | "announcement_rejected";
  itemTitle: string;
  clubName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, recipientName, type, itemTitle, clubName }: NotificationRequest = await req.json();

    console.log("Sending notification:", { to, type, itemTitle });

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "event_approved":
        subject = "🎉 Your Event Has Been Approved!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Event Approved!</h1>
            <p>Hi ${recipientName},</p>
            <p>Great news! Your event <strong>"${itemTitle}"</strong> for <strong>${clubName}</strong> has been approved by the admin.</p>
            <p>Students can now view and register for this event on the platform.</p>
            <p>Best regards,<br>TheClubs Team</p>
          </div>
        `;
        break;

      case "event_rejected":
        subject = "Event Submission Update";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Event Not Approved</h1>
            <p>Hi ${recipientName},</p>
            <p>We regret to inform you that your event <strong>"${itemTitle}"</strong> for <strong>${clubName}</strong> was not approved.</p>
            <p>Please review the event details and feel free to submit a revised version or contact the admin for more information.</p>
            <p>Best regards,<br>TheClubs Team</p>
          </div>
        `;
        break;

      case "announcement_approved":
        subject = "📢 Your Announcement Has Been Approved!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Announcement Approved!</h1>
            <p>Hi ${recipientName},</p>
            <p>Your announcement for <strong>${clubName}</strong> has been approved and is now visible to all club members.</p>
            <p><em>Message: "${itemTitle}"</em></p>
            <p>Best regards,<br>TheClubs Team</p>
          </div>
        `;
        break;

      case "announcement_rejected":
        subject = "Announcement Submission Update";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Announcement Not Approved</h1>
            <p>Hi ${recipientName},</p>
            <p>Your announcement for <strong>${clubName}</strong> was not approved.</p>
            <p>Please review the content and feel free to submit a revised version or contact the admin for more information.</p>
            <p>Best regards,<br>TheClubs Team</p>
          </div>
        `;
        break;
    }

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TheClubs <onboarding@resend.dev>",
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    const emailResponse = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error in send-notification:", emailResponse);
      return new Response(JSON.stringify({ error: emailResponse }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
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
