import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { toPng } from 'html-to-image';
import { ArrowLeft, Download, Loader2, Sparkles, MessageCircle } from "lucide-react";

export default function CreateEvent() {
    const { clubId } = useParams();
    const navigate = useNavigate();
    const posterRef = useRef<HTMLDivElement>(null);

    // Form State
    const [eventForm, setEventForm] = useState({
        title: "",
        description: "",
        date: "",
        venue: "",
        whatsapp_link: "",
        banner_url: ""
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI Content State
    const [aiContent, setAiContent] = useState<any>(null);
    const [aiStyle, setAiStyle] = useState<any>(null);

    // AI POSTER GENERATION (Creative Director Mode)
    const generatePoster = async () => {
        if (!eventForm.title) {
            toast.error("Please enter an Event Title first!");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("AI Creative Director is working...");

        try {
            const res = await axios.post('http://localhost:5000/api/ai/poster', {
                eventDetails: eventForm // Send full details for analysis
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.data.success) {
                setEventForm(prev => ({ ...prev, banner_url: res.data.image }));
                setAiContent(res.data.content); // Store catchy text
                setAiStyle(res.data.style);     // Store style config
                toast.success("Poster Designed!", { id: toastId });
            } else {
                throw new Error("Failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Generation failed. Please try again.", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to get display values (AI or User Input)
    const displayTitle = aiContent?.headline || eventForm.title || "EVENT TITLE";
    const displayDesc = aiContent?.description || eventForm.description || "Join us for an incredible event.";
    const displayDate = aiContent?.date_display || (eventForm.date ? new Date(eventForm.date).toLocaleDateString() : "DATE");
    const displayVenue = aiContent?.venue_display || eventForm.venue || "VENUE";
    const accentColor = aiStyle?.accent_color_hex || "#a855f7"; // Default purple

    // DOWNLOAD POSTER LOGIC
    const downloadPoster = async () => {
        if (!posterRef.current || !eventForm.banner_url) {
            toast.error("Please generate a poster first!");
            return;
        }

        const toastId = toast.loading("Exporting High-Res Poster...");

        try {
            // Wait for images to fully load (crucial for external AI images)
            await new Promise((resolve) => setTimeout(resolve, 500));

            const dataUrl = await toPng(posterRef.current, {
                cacheBust: true,
                pixelRatio: 4, // 4x Resolution
                backgroundColor: null, // Keep transparency if any
                style: {
                    transform: 'scale(1)', // Avoid scaling glitches
                }
            });

            const link = document.createElement('a');
            link.download = `${eventForm.title.replace(/\s+/g, '-').toLowerCase() || 'event'}-poster-a3.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Poster Exported Successfully!", { id: toastId });
        } catch (err) {
            console.error("Download Error:", err);
            toast.error("Export failed. Try again.", { id: toastId });
        }
    };

    // SUBMIT EVENT LOGIC
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventForm.title || !eventForm.date || !eventForm.venue) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post('http://localhost:5000/api/events', {
                ...eventForm,
                organizer_club: clubId
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            toast.success("Event Created Successfully! (Pending Approval)");
            navigate("/dashboard"); // Go back to dashboard
        } catch (err) {
            console.error(err);
            toast.error("Failed to create event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

            {/* LEFT SIDE: FORM INPUTS */}
            <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto bg-white border-r border-slate-200">
                <div className="max-w-lg mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Create New Event</h1>
                            <p className="text-slate-500 text-sm">Fill in the details to launch your event.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base">Event Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                placeholder="e.g. Tech Innovators Hackathon 2026"
                                value={eventForm.title}
                                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                className="h-12 text-lg"
                            />
                        </div>

                        {/* Date & Venue Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date & Time <span className="text-red-500">*</span></Label>
                                <Input
                                    id="date"
                                    type="datetime-local"
                                    value={eventForm.date}
                                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="venue">Venue <span className="text-red-500">*</span></Label>
                                <Input
                                    id="venue"
                                    placeholder="e.g. Auditorium A"
                                    value={eventForm.venue}
                                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description <span className="text-slate-400 font-normal">(Optional but helps AI)</span></Label>
                            <Textarea
                                id="desc"
                                placeholder="Describe your event..."
                                rows={4}
                                value={eventForm.description}
                                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                            />
                        </div>

                        {/* WhatsApp Link */}
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-green-600" />
                                WhatsApp Group Link
                            </Label>
                            <Input
                                id="whatsapp"
                                placeholder="https://chat.whatsapp.com/..."
                                value={eventForm.whatsapp_link}
                                onChange={(e) => setEventForm({ ...eventForm, whatsapp_link: e.target.value })}
                                className="border-green-200 focus:ring-green-500"
                            />
                            <p className="text-xs text-slate-400">Attendees can join your group directly from the event page.</p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 font-medium">Club Status:</span>
                                <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
                                    Approved
                                </Badge>
                            </div>
                            <Button type="submit" size="lg" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 px-8">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Event"}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>

            {/* RIGHT SIDE: LIVE POSTER PREVIEW */}
            <div className="w-full md:w-1/2 bg-slate-100 flex flex-col items-center justify-center p-6 md:p-12 relative">

                <div className="max-w-md w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-700">Live Poster Preview</h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generatePoster}
                                disabled={isGenerating}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                {eventForm.banner_url ? "Regenerate" : "Generate AI Poster"}
                            </Button>

                            {eventForm.banner_url && (
                                <Button size="sm" variant="secondary" onClick={downloadPoster}>
                                    <Download className="h-4 w-4 mr-2" /> Download
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* POSTER CANVAS (A3 Ratio) */}
                    <div
                        ref={posterRef}
                        className="relative w-full aspect-[1/1.414] bg-white rounded-sm shadow-2xl overflow-hidden border border-slate-200 group ring-1 ring-slate-900/5 select-none"
                    >
                        {eventForm.banner_url ? (
                            <>
                                {/* 1. AI Generated Background - Portrait */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${eventForm.banner_url})` }}
                                />

                                {/* 2. Gradient Overlay for Readability */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

                                {/* 3. HTML/CSS Typography Overlay - Template Style Alignment */}
                                <div className="absolute inset-0 flex flex-col justify-between p-8 text-white z-10">

                                    {/* HEADER: Title & Date Badge */}
                                    <div className="text-center space-y-4 pt-4">
                                        <div className="inline-block px-3 py-1 rounded backdrop-blur-sm text-[12px] font-bold tracking-widest uppercase mb-2 shadow-lg text-white"
                                            style={{ backgroundColor: `${accentColor}dd` }}>
                                            {aiContent?.tagline || (eventForm.date ? new Date(eventForm.date).getFullYear() + " EVENT" : "COMING SOON")}
                                        </div>
                                        <h2 className="text-5xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-xl"
                                            style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                            {displayTitle.toUpperCase()}
                                        </h2>
                                        <div className="w-20 h-1.5 mx-auto rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: accentColor }}></div>
                                    </div>

                                    {/* MIDDLE: Clear Area for AI Art */}
                                    <div className="flex-1"></div>

                                    {/* FOOTER: Details & Description */}
                                    <div className="space-y-3 bg-black/40 backdrop-blur-md p-5 pb-7 rounded-xl border border-white/10 mb-2">
                                        <p className="text-sm text-center font-medium opacity-90 line-clamp-3 leading-relaxed text-slate-100">
                                            {displayDesc}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold tracking-wide border-t border-white/10 pt-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg" style={{ color: accentColor }}>📅</span>
                                                <span className="text-base">{displayDate}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-right justify-end">
                                                <span className="text-base">{eventForm.date ? new Date(eventForm.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : "TIME"}</span>
                                                <span className="text-lg" style={{ color: accentColor }}>🕒</span>
                                            </div>
                                            <div className="flex items-start gap-2 col-span-2 justify-center mt-2 text-slate-200">
                                                <span className="text-lg mt-0.5">📍</span>
                                                <span className="text-[10px] leading-snug break-words text-center">{displayVenue}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-slate-50 relative text-slate-400">
                                <Sparkles className="h-12 w-12 mb-4 text-purple-200" />
                                <p className="font-medium text-slate-900">Poster Canvas</p>
                                <p className="text-xs text-center px-10 mt-2">Fill the form and click 'Generate' to see your AI-designed poster here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
