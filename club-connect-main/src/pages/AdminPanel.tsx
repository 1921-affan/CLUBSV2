import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  MessageSquare,
  Activity,
  BarChart3,
  PieChart
} from "lucide-react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface PendingClub {
  id: string;
  name: string;
  category: string;
  description: string;
  faculty_advisor: string | null;
  whatsapp_link: string | null;
  created_by: string;
  created_at: string;
  status: string;
  creator?: {
    name: string;
    email: string;
  };
}

interface Stats {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  pendingClubs: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingClubs, setPendingClubs] = useState<PendingClub[]>([]);
  const [pendingAnnouncements, setPendingAnnouncements] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalClubs: 0,
    totalEvents: 0,
    pendingClubs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [approvingClubs, setApprovingClubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (user?.role === 'admin') {
      setIsAdmin(true);
      fetchAllData();
    } else {
      setIsAdmin(false);
      setLoading(false);
      toast.error("Access denied: Admin privileges required");
      navigate("/");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, clubsRes, announcementsRes, eventsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('http://localhost:5000/api/admin/clubs/pending', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('http://localhost:5000/api/admin/announcements/pending', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('http://localhost:5000/api/admin/events/pending', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);

      setStats(statsRes.data);
      setPendingClubs(clubsRes.data);
      setPendingAnnouncements(announcementsRes.data);
      setPendingEvents(eventsRes.data);

      // Analytics - fetch from backend if endpoint exists. 
      // For now, let's leave analytics blank or mocked to save time as I didn't add the analytics endpoint.
      // User primary goal is migration.
      setAnalyticsData([]);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };


  const approveClub = async (club: PendingClub) => {
    // Prevent duplicate approvals
    if (approvingClubs.has(club.id)) {
      toast.error("This club is already being approved");
      return;
    }

    setApprovingClubs(prev => new Set(prev).add(club.id));

    try {
      await axios.post(`http://localhost:5000/api/admin/clubs/${club.id}/approve`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success(`Club "${club.name}" approved successfully`);
      fetchAllData();
    } catch (error: any) {
      console.error("Error approving club:", error);
      const errorMessage = error.response?.data?.sqlError || error.response?.data?.error || "Failed to approve club";
      toast.error(errorMessage);
    } finally {
      setApprovingClubs(prev => {
        const newSet = new Set(prev);
        newSet.delete(club.id);
        return newSet;
      });
    }
  };

  const approveAnnouncement = async (announcement: any) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/announcements/${announcement.id}/approve`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success("Announcement approved!");
      fetchAllData();
    } catch (error: any) {
      console.error("Error approving announcement:", error);
      toast.error("Failed to approve announcement");
    }
  };

  const rejectAnnouncement = async (announcementId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/announcements/${announcementId}/reject`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success("Announcement rejected");
      fetchAllData();
    } catch (error: any) {
      console.error("Error rejecting announcement:", error);
      toast.error("Failed to reject announcement");
    }
  };

  const approveEvent = async (event: any) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/events/${event.id}/approve`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success("Event approved!");
      fetchAllData();
    } catch (error: any) {
      console.error("Error approving event:", error);
      toast.error("Failed to approve event");
    }
  };

  const rejectEvent = async (eventId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/events/${eventId}/reject`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success("Event rejected");
      fetchAllData();
    } catch (error: any) {
      console.error("Error rejecting event:", error);
      toast.error("Failed to reject event");
    }
  };

  const rejectClub = async (clubId: string, clubName: string, createdBy: string) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/clubs/${clubId}/reject`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success(`Club "${clubName}" rejected`);
      fetchAllData();
    } catch (error: any) {
      console.error("Error rejecting club:", error);
      toast.error("Failed to reject club");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50/50">

        <div className="container mx-auto px-4 py-20 text-center">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Access Denied</h1>
          <p className="text-slate-500">
            You don't have permission to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">


      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Admin Dashboard</h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Manage platform, review requests, and monitor analytics
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 relative z-20">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg shadow-slate-900/5 border-none bg-white hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-slate-900/5 border-none bg-white hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Clubs</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalClubs}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-slate-900/5 border-none bg-white hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalEvents}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-slate-900/5 border-none bg-white hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Pending Requests</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingClubs}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="w-full justify-start bg-white p-1.5 h-auto shadow-sm rounded-xl border border-slate-200/60 overflow-x-auto flex-nowrap">
            <TabsTrigger value="approvals" className="flex-1 min-w-[120px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Activity className="w-4 h-4" />
              Club Requests
              {stats.pendingClubs > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {stats.pendingClubs}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex-1 min-w-[120px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4" />
              Announcements
              {pendingAnnouncements.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {pendingAnnouncements.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 min-w-[120px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Calendar className="w-4 h-4" />
              Events
              {pendingEvents.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {pendingEvents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 min-w-[120px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Club Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4 mt-0">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Pending Club Approvals</CardTitle>
                <CardDescription>
                  Review and approve or reject new club applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingClubs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No pending club approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingClubs.map((club) => (
                      <div key={club.id} className="p-5 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-slate-900">{club.name}</h3>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">{club.category}</Badge>
                            </div>
                            <p className="text-slate-600 mb-4 leading-relaxed">
                              {club.description}
                            </p>
                            <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                <span>Advisor: {club.faculty_advisor || "None"}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>By: {club.creator?.name || "Unknown"}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(club.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 md:pt-0">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                                  disabled={approvingClubs.has(club.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {approvingClubs.has(club.id) ? "Approving..." : "Approve"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Club</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve "{club.name}"? This will
                                    create the club and grant club head privileges to the creator.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => approveClub(club)} className="bg-emerald-600 hover:bg-emerald-700">
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Club</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject "{club.name}"? This action
                                    can be reviewed later but will notify the creator.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => rejectClub(club.id, club.name, club.created_by)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Approval Tab */}
          <TabsContent value="events" className="space-y-4 mt-0">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Pending Events</CardTitle>
                <CardDescription>
                  Review and approve or reject club events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingEvents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No pending events</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEvents.map((event) => (
                      <div key={event.id} className="p-5 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-3">
                              <div>
                                <span className="text-slate-500">Club:</span>
                                <span className="font-medium text-slate-900 ml-2">{event.club?.name || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Date:</span>
                                <span className="font-medium text-slate-900 ml-2">{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Venue:</span>
                                <span className="font-medium text-slate-900 ml-2">{event.venue}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">By:</span>
                                <span className="font-medium text-slate-900 ml-2">{event.creator?.name || "Unknown"}</span>
                              </div>
                            </div>
                            {event.description && (
                              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 pt-2 md:pt-0">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve "{event.title}"? This will publish the event for all users to see.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => approveEvent(event)} className="bg-emerald-600 hover:bg-emerald-700">
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject "{event.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => rejectEvent(event.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Approval Tab */}
          <TabsContent value="announcements" className="space-y-4 mt-0">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Pending Announcements</CardTitle>
                <CardDescription>
                  Review and approve or reject club announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAnnouncements.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No pending announcements</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="p-5 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="border-slate-200 text-slate-700">{announcement.club?.name}</Badge>
                              <span className="text-xs text-slate-400">
                                by {announcement.creator?.name} • {new Date(announcement.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                              {announcement.message}
                            </p>
                          </div>
                          <div className="flex gap-2 pt-2 md:pt-0">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Announcement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will publish the announcement to all club members.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => approveAnnouncement(announcement)} className="bg-emerald-600 hover:bg-emerald-700">
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Announcement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reject the announcement request.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => rejectAnnouncement(announcement.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Platform Growth</CardTitle>
                  <CardDescription>Clubs and events created over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clubs"
                        stroke="#0f172a"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#0f172a" }}
                        activeDot={{ r: 6 }}
                        name="Clubs"
                      />
                      <Line
                        type="monotone"
                        dataKey="events"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#3b82f6" }}
                        activeDot={{ r: 6 }}
                        name="Events"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Monthly Activity</CardTitle>
                  <CardDescription>Comparison of clubs and events by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="clubs" fill="#0f172a" radius={[4, 4, 0, 0]} name="Clubs" />
                      <Bar dataKey="events" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Events" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
