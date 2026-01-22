import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Calendar, Users, LogOut, Award, MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileDialog } from "@/components/EditProfileDialog";

export default function Profile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [myClubs, setMyClubs] = useState<any[]>([]);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const [profileRes, clubsRes, eventsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/users/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), // Assuming token in local storage or handled by interceptor? 
                // Wait, useAuth might use an interceptor or I need to pass token manually. 
                // AuthContext usually sets default header? I need to check AuthContext. 
                // If not, I should manually pass it or use a configured axios instance.
                // Looking at previous edits, I haven't set up a global axios interceptor in AuthContext (I just saw it uses axios.post for login).
                // So I definitely need to send the token.
                // Let's assume `localStorage.getItem('token')` exists because AuthContext likely sets it.
                axios.get('http://localhost:5000/api/users/me/clubs', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                axios.get('http://localhost:5000/api/users/me/events', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
            ]);

            setProfile(profileRes.data);
            setMyClubs(clubsRes.data);
            setMyEvents(eventsRes.data);

        } catch (error) {
            console.error("Error fetching profile data:", error);
            // toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 pb-12">

                <div className="w-full bg-slate-900 py-20">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-8">
                            <Skeleton className="w-24 h-24 rounded-full bg-slate-800" />
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-64 bg-slate-800" />
                                <Skeleton className="h-6 w-48 bg-slate-800" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 -mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">


            {/* Hero / Header Section */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-white" />
                            )}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">{profile?.name || "Student"}</h1>
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="flex items-center justify-center md:justify-start gap-3 text-slate-300 bg-white/5 px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 border border-white/10">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm font-medium">{profile?.email}</span>
                                </div>
                                {profile?.branch && (
                                    <div className="flex items-center justify-center md:justify-start gap-3 text-slate-300 bg-white/5 px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 border border-white/10">
                                        <Award className="w-4 h-4" />
                                        <span className="text-sm font-medium">{profile.branch}</span>
                                    </div>
                                )}
                                {profile?.year_of_study && (
                                    <div className="flex items-center justify-center md:justify-start gap-3 text-slate-300 bg-white/5 px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 border border-white/10">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Year: {profile.year_of_study}</span>
                                    </div>
                                )}
                                {profile && (
                                    <EditProfileDialog profile={profile} onProfileUpdate={fetchProfileData} />
                                )}
                            </div>
                            {profile?.bio && (
                                <p className="mt-4 text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                                    {profile.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <Card className="shadow-lg shadow-slate-900/5 border-none bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <Award className="w-5 h-5 text-blue-600" />
                                    Your Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-100 rounded-lg text-blue-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-slate-700">Clubs Joined</span>
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900">{myClubs.length}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-100 rounded-lg text-purple-600">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-slate-700">Events Registered</span>
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900">{myEvents.length}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Tabs */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="clubs" className="w-full">
                            <TabsList className="w-full justify-start mb-6 bg-white p-1.5 h-auto shadow-sm rounded-xl border border-slate-200/60">
                                <TabsTrigger value="clubs" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex-1 md:flex-none">
                                    My Clubs
                                </TabsTrigger>
                                <TabsTrigger value="events" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex-1 md:flex-none">
                                    My Events
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="clubs" className="space-y-4 mt-0">
                                {myClubs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {myClubs.map((club) => (
                                            <Card key={club.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-slate-200/60 bg-white" onClick={() => navigate(`/clubs/${club.id}`)}>
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100">
                                                            {club.logo_url ? (
                                                                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-xl" />
                                                            ) : (
                                                                <Users className="w-7 h-7" />
                                                            )}
                                                        </div>
                                                        <Badge variant={club.role === 'head' ? 'default' : 'secondary'} className={club.role === 'head' ? 'bg-slate-900' : 'bg-slate-100 text-slate-600'}>
                                                            {club.role === 'head' ? 'Club Head' : 'Member'}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-blue-600 transition-colors">{club.name}</h3>
                                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{club.description}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="py-12 text-center border-dashed border-slate-200 bg-slate-50/50">
                                        <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                        <h3 className="font-bold text-lg text-slate-900 mb-2">No Clubs Joined</h3>
                                        <p className="text-slate-500 mb-6">You haven't joined any clubs yet.</p>
                                        <Button onClick={() => navigate("/clubs")} className="bg-slate-900 hover:bg-slate-800 text-white">Explore Clubs</Button>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="events" className="space-y-4 mt-0">
                                {myEvents.length > 0 ? (
                                    <div className="space-y-4">
                                        {myEvents.map((event) => (
                                            <Card key={event.id} className="hover:shadow-lg transition-all duration-300 border-slate-200/60 bg-white overflow-hidden group">
                                                <CardContent className="p-0 flex flex-col md:flex-row">
                                                    <div className="bg-slate-50 p-6 flex flex-col items-center justify-center min-w-[120px] text-slate-900 border-b md:border-b-0 md:border-r border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                        <span className="text-3xl font-bold">{new Date(event.date).getDate()}</span>
                                                        <span className="text-sm font-medium uppercase tracking-wider">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                                        <span className="text-xs opacity-60">{new Date(event.date).getFullYear()}</span>
                                                    </div>
                                                    <div className="p-6 flex-1">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <Badge variant="outline" className="mb-2 text-xs border-slate-200 text-slate-500">{event.organizer_club?.name}</Badge>
                                                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                                                            </div>
                                                            <Button size="icon" variant="ghost" onClick={() => navigate("/events")} className="text-slate-400 hover:text-slate-900">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4 text-red-500" />
                                                                {event.venue}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="py-12 text-center border-dashed border-slate-200 bg-slate-50/50">
                                        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                        <h3 className="font-bold text-lg text-slate-900 mb-2">No Upcoming Events</h3>
                                        <p className="text-slate-500 mb-6">You are not registered for any upcoming events.</p>
                                        <Button onClick={() => navigate("/events")} className="bg-slate-900 hover:bg-slate-800 text-white">Browse Events</Button>
                                    </Card>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

        </div >
    );
}
