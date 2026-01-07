import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MessageSquare, ArrowLeft, Bell, Trash2, Send, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState<any>(null);
  const [clubHead, setClubHead] = useState<string>("");
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [newDiscussion, setNewDiscussion] = useState("");
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClubData();
    }
    if (user) {
      fetchUserRegistrations();
    }
  }, [id, user]);

  const fetchClubData = async () => {
    setLoading(true);
    try {
      const [clubRes, membersRes, eventsRes, announcementsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/clubs/${id}`),
        axios.get(`http://localhost:5000/api/clubs/${id}/members`),
        axios.get(`http://localhost:5000/api/clubs/${id}/events`),
        axios.get(`http://localhost:5000/api/clubs/${id}/announcements`)
      ]);

      setClub(clubRes.data);
      setMembers(membersRes.data);
      setMemberCount(membersRes.data.length);
      setEvents(eventsRes.data);
      setAnnouncements(announcementsRes.data);

      // Derive club head from members list
      const head = membersRes.data.find((m: any) => m.role === 'head');
      setClubHead(head ? head.name : "Unknown");

      // Check if current user is member
      if (user) {
        const myMembership = membersRes.data.find((m: any) => m.id === user.id); // Note: user.id from context matches m.id (profile id)
        // Wait, m.id is profile id (user_id).
        setIsMember(!!myMembership);
        setCurrentUserRole(myMembership ? myMembership.role : "");
      }

      // Discussions still need Supabase or a new endpoint? 
      // For now, let's keep discussions on Supabase or add endpoint. 
      // User asked to remove Supabase "everywhere". I should add discussions endpoint too.
      // Assuming I haven't added discussions endpoint yet, I will use Supabase for discussions temporarily 
      // OR better: Add discussions endpoint to server.js in next step and use it here.
      // Actually, let's use the new endpoint structure for discussions too, I will add it to server.js in a moment.
      // For now I'll comment out discussions fetch or leave it as TODO if endpoint invalid.
      // Wait, I can't leave it broken. I'll stick to Supabase for discussions ONLY for this step 
      // to keep the diff clean, then fix discussions.


      // Fetch discussions via Axios
      // Note: Endpoint /api/clubs/:id/discussions needs to be implemented in backend if not already or I rely on what I added.
      // I added GET /api/clubs/:id/discussions in server.js.

      const discussionsRes = await axios.get(`http://localhost:5000/api/clubs/${id}/discussions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDiscussions(discussionsRes.data);

    } catch (error: any) {
      console.error("Error fetching club data:", error);
      console.error("Failed Request URL:", error.config?.url);
      toast.error(`Failed to load club details: ${error.response?.status} ${error.response?.statusText || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDiscussion.trim()) return;

    try {
      await axios.post(`http://localhost:5000/api/clubs/${id}/discussions`, {
        message: newDiscussion
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Message posted!");
      setNewDiscussion("");
      fetchClubData();
    } catch (error) {
      console.error("Error posting discussion:", error);
      toast.error("Failed to post message");
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/discussions/${discussionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Message deleted");
      fetchClubData();
    } catch (error) {
      console.error("Error deleting discussion:", error);
      toast.error("Failed to delete message");
    }
  };

  const fetchUserRegistrations = async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://localhost:5000/api/users/me/registrations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRegistrations(new Set(response.data.map((r: any) => r.event_id)));
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleRegister = async (eventId: string) => {
    if (!user) return;

    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Successfully registered!");
      fetchClubData();
      fetchUserRegistrations();
    } catch (error: any) {
      console.error("Error registering:", error);
      toast.error(error.response?.data?.message || "Failed to register for event");
    }
  };

  const handleUnregister = async (eventId: string) => {
    if (!user) return;

    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}/register`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Unregistered from event");
      fetchClubData();
      fetchUserRegistrations();
    } catch (error: any) {
      console.error("Error unregistering:", error);
      toast.error(error.response?.data?.message || "Failed to unregister");
    }
  };

  const handleJoinClub = async () => {
    if (!user || !club) return;

    try {
      await axios.post(`http://localhost:5000/api/clubs/${club.id}/join`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Successfully joined club!");
      fetchClubData();
    } catch (error: any) {
      console.error("Error joining club:", error);
      toast.error(error.response?.data?.message || "Failed to join club");
    }
  };

  const handleLeaveClub = async () => {
    if (!user || !club) return;

    try {
      await axios.post(`http://localhost:5000/api/clubs/${club.id}/leave`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Left the club");
      fetchClubData();
    } catch (error: any) {
      console.error("Error leaving club:", error);
      toast.error(error.response?.data?.message || "Failed to leave club");
    }
  };

  const handleRestoreHeadAccess = async () => {
    if (!user || !club) return;

    try {
      await axios.put(`http://localhost:5000/api/clubs/${club.id}/restore-head`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Head access restored! You can now manage this club.");
      fetchClubData();
    } catch (error: any) {
      console.error("Error restoring head access:", error);
      toast.error(error.response?.data?.message || "Failed to restore head access");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-12">

        {/* Skeleton Header */}
        <div className="w-full bg-slate-900 py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-8">
              <Skeleton className="w-32 h-32 rounded-2xl bg-slate-800" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-64 bg-slate-800" />
                <Skeleton className="h-8 w-32 bg-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 mt-8 lg:mt-0">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[100px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50/50">

        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Club not found</h2>
          <p className="text-slate-500">The club you are looking for does not exist or has been removed.</p>
          <Button className="mt-6" onClick={() => navigate("/clubs")}>Back to Clubs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">


      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 mb-8 pl-0 gap-2"
            onClick={() => navigate("/clubs")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clubs
          </Button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shrink-0 overflow-hidden">
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-16 h-16 text-slate-300" />
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{club.name}</h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1 text-sm font-medium">
                  {club.category}
                </Badge>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active Community
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start mb-6 bg-white p-1.5 h-auto shadow-sm rounded-xl border border-slate-200/60">
                <TabsTrigger value="overview" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Overview</TabsTrigger>
                <TabsTrigger value="events" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Events</TabsTrigger>
                <TabsTrigger value="announcements" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Announcements</TabsTrigger>
                <TabsTrigger value="discussions" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Discussions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-0">
                <Card className="border-slate-200/60 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900">About the Club</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">{club.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="mt-0">
                <Card className="border-slate-200/60 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {events.length > 0 ? (
                      events.map((event) => (
                        <div key={event.id} className="p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-200 transition-colors">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{event.title}</h3>
                            <div className="flex flex-col gap-1">
                              <p className="text-sm text-slate-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-sm text-slate-500 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {event.venue}
                              </p>
                            </div>
                          </div>
                          {registrations.has(event.id) ? (
                            <Button
                              variant="outline"
                              onClick={() => handleUnregister(event.id)}
                              className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              Cancel Registration
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleRegister(event.id)}
                              className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                            >
                              Register Now
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500">No upcoming events scheduled.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="announcements" className="mt-0">
                <Card className="border-slate-200/60 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <Bell className="w-5 h-5 text-orange-500" />
                      Announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {announcements.length > 0 ? (
                      announcements.map((announcement) => (
                        <div key={announcement.id} className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-slate-800 mb-3 leading-relaxed">{announcement.message}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <span className="px-2 py-1 rounded-md bg-white border border-slate-100">
                              {new Date(announcement.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500">No announcements yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="discussions" className="mt-0">
                <Card className="border-slate-200/60 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Discussion Board
                    </CardTitle>
                    <CardDescription>Connect and chat with other club members</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ScrollArea className="h-[300px] pr-4 -mr-4">
                      <div className="space-y-6 pr-4">
                        {discussions.length > 0 ? (
                          discussions.map((discussion) => (
                            <div key={discussion.id} className={`flex gap-4 ${discussion.user_id === user?.id ? "flex-row-reverse" : ""}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${discussion.user_id === user?.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                                {discussion.user?.name?.charAt(0) || "?"}
                              </div>
                              <div className={`flex flex-col max-w-[80%] ${discussion.user_id === user?.id ? "items-end" : "items-start"}`}>
                                <div className={`p-4 rounded-2xl shadow-sm ${discussion.user_id === user?.id ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"}`}>
                                  <p className="text-sm leading-relaxed">{discussion.message}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 px-1">
                                  <span className="text-xs text-slate-400 font-medium">
                                    {discussion.user?.name} • {new Date(discussion.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {(user?.id === discussion.user_id || clubHead === user?.name) && (
                                    <button
                                      onClick={() => handleDeleteDiscussion(discussion.id)}
                                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                      title="Delete message"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 text-slate-400">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No messages yet</p>
                            <p className="text-sm">Be the first to start the conversation!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {isMember ? (
                      <form onSubmit={handlePostDiscussion} className="flex gap-3 pt-4 border-t border-slate-100">
                        <Input
                          placeholder="Type your message..."
                          value={newDiscussion}
                          onChange={(e) => setNewDiscussion(e.target.value)}
                          className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
                        />
                        <Button type="submit" size="icon" disabled={!newDiscussion.trim()} className="bg-slate-900 hover:bg-slate-800 text-white shrink-0 w-10 h-10 rounded-lg">
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                        Join the club to participate in discussions.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join/Leave Action Card */}
            <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
              <CardContent className="pt-6 space-y-3">
                {isMember ? (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full h-12 text-base font-medium shadow-lg shadow-red-500/20">
                          Leave Club
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You are about to leave {club.name}. You will lose access to member-only events and announcements.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLeaveClub} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Leave Club
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {user && club.created_by === user.id && currentUserRole !== "head" && (
                      <Button
                        onClick={handleRestoreHeadAccess}
                        className="w-full h-12 text-base font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                      >
                        Restore Head Access
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    className="w-full h-12 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                    onClick={handleJoinClub}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Join Club
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Club Info Card */}
            <Card className="border-slate-200/60 shadow-sm bg-white">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-900">Club Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-3 -mx-3 rounded-xl transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Members</p>
                        <p className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{memberCount}</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Club Members</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4">
                        {members.length > 0 ? (
                          members.map((member, index) => (
                            <div key={index} className="flex items-center gap-3 pb-3 border-b last:border-0">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{member.name}</p>
                                <p className="text-xs text-slate-500">{member.email}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-slate-500 py-4">No members found.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <div className="flex items-center gap-4 p-3 -mx-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Faculty Advisor</p>
                    <p className="font-semibold text-slate-900">{club.faculty_advisor || "Not Assigned"}</p>
                  </div>
                </div>

                {clubHead && (
                  <div className="flex items-center gap-4 p-3 -mx-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Club Head</p>
                      <p className="font-semibold text-slate-900">{clubHead}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* WhatsApp Contact Card */}
            <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
              <CardContent className="pt-6">
                <Button
                  className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 font-medium shadow-lg shadow-[#25D366]/20"
                  onClick={() => {
                    if (club.whatsapp_link) {
                      window.open(club.whatsapp_link, "_blank");
                    } else {
                      toast.error("No WhatsApp link available for this club");
                    }
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                  Join WhatsApp Group
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
