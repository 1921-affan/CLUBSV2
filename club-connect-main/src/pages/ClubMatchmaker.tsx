import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';

interface MatchedClub {
    id: string;
    name: string;
    description: string;
    category: string;
    match_reason: string;
}

export default function ClubMatchmaker() {
    const [interest, setInterest] = useState("");
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<MatchedClub[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleMatch = async () => {
        if (!interest.trim()) return;

        setLoading(true);
        setMatches([]);
        setHasSearched(false);

        try {
            // Use local storage token
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/ai/match',
                { interest },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMatches(response.data.matches);
            setHasSearched(true);

            if (response.data.ai_powered) {
                toast.success("AI Analysis Complete!", { description: "Here are your best matches." });
            } else {
                toast.info("AI Unavailable - Using Keyword Match", { description: "Add GEMINI_API_KEY to server for smarter results." });
            }

        } catch (error: any) {
            console.error("Match error:", error);
            toast.error("AI Error: " + (error.response?.data?.error || error.message || "Failed to find matches."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* Header Section */}
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>AI-Powered Recommendations</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                        Find Your Perfect Club Match
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Tell us about your hobbies, academic interests, or what you're looking to learn.
                        Our AI will analyze all available clubs to find where you belong.
                    </p>
                </div>

                {/* Input Section */}
                <Card className="border-slate-200 shadow-lg mb-12">
                    <CardContent className="p-8">
                        <div className="flex flex-col gap-4">
                            <label className="text-sm font-medium text-slate-700">Your Interests (e.g., "I love coding and robotics" or "I want to learn public speaking")</label>
                            <Textarea
                                placeholder="I am interested in..."
                                className="min-h-[120px] text-lg p-4 resize-none focus-visible:ring-indigo-500"
                                value={interest}
                                onChange={(e) => setInterest(e.target.value)}
                            />
                            <Button
                                size="lg"
                                className="w-full sm:w-auto self-end bg-indigo-600 hover:bg-indigo-700 text-white gap-2 mt-2"
                                onClick={handleMatch}
                                disabled={loading || !interest.trim()}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing Interests...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Find My Match
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Section */}
                {hasSearched && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-900 font-semibold text-xl mb-6">
                            <Target className="w-6 h-6 text-indigo-600" />
                            <h3>Recommended Clubs</h3>
                        </div>

                        {matches.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {matches.map((club) => (
                                    <Card key={club.id} className="flex flex-col border-slate-200 hover:shadow-md transition-all h-full">
                                        <CardHeader>
                                            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">{club.category}</div>
                                            <CardTitle className="text-lg text-slate-900">{club.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col gap-4">
                                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                                "{club.match_reason}"
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-3">
                                                {club.description}
                                            </p>
                                            <div className="mt-auto pt-2">
                                                <Button asChild variant="outline" className="w-full gap-2 border-slate-200 hover:bg-slate-50">
                                                    <Link to={`/clubs/${club.id}`}>
                                                        View Club Details
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                                <p>No strong matches found. Try describing your interests differently!</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
