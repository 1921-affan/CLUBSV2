import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Users, MessageSquare, Edit, Trash2, Plus, CheckSquare, Settings, Bell, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export default function ClubDashboard() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [clubForm, setClubForm] = useState({
    name: "",
    category: "",
    description: "",
    faculty_advisor: "",
    whatsapp_link: "",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
  });

  const [announcementText, setAnnouncementText] = useState("");
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Attendance states
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<any>(null);
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchClubsWhereHead();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClub) {
      fetchClubData();
    }
  }, [selectedClub]);

  const fetchClubsWhereHead = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("club_members")
      .select("club_id, clubs(*)")
      .eq("user_id", user.id)
      .eq("role_in_club", "head");

    if (data && data.length > 0) {
      const clubsList = data.map((item) => item.clubs).filter(Boolean);
      setClubs(clubsList);
      if (clubsList.length > 0) {
        setSelectedClub(clubsList[0]);
        setClubForm({
          name: clubsList[0].name || "",
          category: clubsList[0].category || "",
          description: clubsList[0].description || "",
          faculty_advisor: clubsList[0].faculty_advisor || "",
          whatsapp_link: clubsList[0].whatsapp_link || "",
        });
      }
    }
    setLoading(false);
  };

  const fetchClubData = async () => {
    if (!selectedClub) return;

    // Fetch events
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("organizer_club", selectedClub.id)
      .order("date", { ascending: true });
    setEvents(eventsData || []);

    // Fetch approved announcements
    const { data: approvedAnnouncements, error: approvedError } = await supabase
      .from("announcements")
      .select("*")
      .eq("club_id", selectedClub.id)
      .order("timestamp", { ascending: false });

    if (approvedError) {
      console.error("Error fetching approved announcements:", approvedError);
      toast.error(`Error fetching announcements: ${approvedError.message}`);
    }

    // Fetch pending announcements
    const { data: pendingAnnouncements, error: pendingError } = await supabase
      .from("announcements_pending")
      .select("*")
      .eq("club_id", selectedClub.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingError) {
      console.error("Error fetching pending announcements:", pendingError);
      toast.error(`Error fetching pending announcements: ${pendingError.message}`);
    }

    const allAnnouncements = [
      ...(pendingAnnouncements || []).map(a => ({ ...a, status: 'pending', timestamp: a.created_at })),
      ...(approvedAnnouncements || []).map(a => ({ ...a, status: 'approved' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setAnnouncements(allAnnouncements);

    // Fetch members manually to ensure data availability
    const { data: membersData } = await supabase
      .from("club_members")
      .select("*")
      .eq("club_id", selectedClub.id)
      .order("joined_at", { ascending: false });

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      if (profilesData) {
        // Map profiles back to members
        const membersWithProfiles = membersData.map((member) => {
          const profile = profilesData.find((p) => p.id === member.user_id);
          return {
            ...member,
            user: profile || { name: "Unknown", email: "No email" }
          };
        });
        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } else {
      setMembers([]);
    }
  };

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;

    const { error } = await supabase
      .from("clubs")
      .update(clubForm)
      .eq("id", selectedClub.id);

    if (error) {
      toast.error("Failed to update club");
    } else {
      toast.success("Club updated successfully!");
      fetchClubsWhereHead();
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub || !user) return;

    const { error } = await supabase.from("events_pending").insert({
      ...eventForm,
      organizer_club: selectedClub.id,
      created_by: user.id,
    });

    if (error) {
      console.error("Error creating event:", error);
      toast.error(`Failed to submit event: ${error.message}`);
    } else {
      toast.success("Event submitted for admin approval!");
      setEventForm({ title: "", description: "", date: "", venue: "" });
      setEventDialogOpen(false);
      fetchClubData();
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const { error } = await supabase
      .from("events")
      .update(eventForm)
      .eq("id", editingEvent.id);

    if (error) {
      toast.error("Failed to update event");
    } else {
      toast.success("Event updated successfully!");
      setEditingEvent(null);
      setEventForm({ title: "", description: "", date: "", venue: "" });
      setEventDialogOpen(false);
      fetchClubData();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      toast.error("Failed to delete event");
    } else {
      toast.success("Event deleted successfully!");
      fetchClubData();
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub || !user || !announcementText.trim()) return;

    const { error } = await supabase.from("announcements_pending").insert({
      club_id: selectedClub.id,
      message: announcementText,
      created_by: user.id,
    });

    if (error) {
      console.error("Error creating announcement:", error);
      toast.error(`Failed to submit announcement: ${error.message}`);
    } else {
      toast.success("Announcement submitted for admin approval!");
      setAnnouncementText("");
      fetchClubData();
    }
  };

  const fetchEventParticipants = async (eventId: string) => {
    const { data: participantsData, error } = await supabase
      .from("event_participants")
      .select("*")
      .eq("event_id", eventId)
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to fetch participants");
      return;
    }

    if (participantsData && participantsData.length > 0) {
      const userIds = participantsData.map((p) => p.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      if (profilesData) {
        const participantsWithProfiles = participantsData.map((participant) => {
          const profile = profilesData.find((p) => p.id === participant.user_id);
          return {
            ...participant,
            user: profile || { name: "Unknown", email: "No email" }
          };
        });
        setEventParticipants(participantsWithProfiles);
      } else {
        setEventParticipants([]);
      }
    } else {
      setEventParticipants([]);
    }
  };

  const openAttendanceDialog = (event: any) => {
    setSelectedEventForAttendance(event);
    fetchEventParticipants(event.id);
    setAttendanceDialogOpen(true);
  };

  const handleToggleAttendance = async (participantId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("event_participants")
      .update({ attended: !currentStatus })
      .eq("id", participantId);

    if (error) {
      toast.error("Failed to update attendance");
    } else {
      // Update local state
      setEventParticipants(prev =>
        prev.map(p => p.id === participantId ? { ...p, attended: !currentStatus } : p)
      );
    }
  };

  const openEditEventDialog = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toISOString().slice(0, 16),
      venue: event.venue,
    });
    setEventDialogOpen(true);
  };

  const openNewEventDialog = () => {
    setEditingEvent(null);
    setEventForm({ title: "", description: "", date: "", venue: "" });
    setEventDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">

        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50">

        <div className="container mx-auto px-4 py-20">
          <Card className="p-12 text-center max-w-2xl mx-auto border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">No Clubs Found</h2>
            <p className="text-slate-500 mb-8">
              You are not a head of any clubs yet. Request to create a club to get started.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">


      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Club Dashboard</h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Manage your club, create events, and engage with your community.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Club Selector */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Select Club</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {clubs.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => {
                        setSelectedClub(club);
                        setClubForm({
                          name: club.name || "",
                          category: club.category || "",
                          description: club.description || "",
                          faculty_advisor: club.faculty_advisor || "",
                          whatsapp_link: club.whatsapp_link || "",
                        });
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all ${selectedClub?.id === club.id
                        ? "bg-slate-900 text-white shadow-md"
                        : "hover:bg-slate-100 text-slate-600"
                        }`}
                    >
                      <span className="font-medium truncate">{club.name}</span>
                      {selectedClub?.id === club.id && <ChevronRight className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="info" className="space-y-6">
              <TabsList className="w-full justify-start bg-white p-1.5 h-auto shadow-sm rounded-xl border border-slate-200/60 overflow-x-auto flex-nowrap">
                <TabsTrigger value="info" className="flex-1 min-w-[100px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <Settings className="w-4 h-4" />
                  Club Info
                </TabsTrigger>
                <TabsTrigger value="events" className="flex-1 min-w-[100px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <Calendar className="w-4 h-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="announcements" className="flex-1 min-w-[100px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <Bell className="w-4 h-4" />
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="members" className="flex-1 min-w-[100px] gap-2 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <Users className="w-4 h-4" />
                  Members
                </TabsTrigger>
              </TabsList>

              {/* Club Info Tab */}
              <TabsContent value="info" className="mt-0">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900">Club Information</CardTitle>
                    <CardDescription>Update your club's details and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateClub} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name">Club Name</Label>
                          <Input
                            id="name"
                            value={clubForm.name}
                            onChange={(e) =>
                              setClubForm({ ...clubForm, name: e.target.value })
                            }
                            required
                            className="bg-slate-50 border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={clubForm.category}
                            onChange={(e) =>
                              setClubForm({ ...clubForm, category: e.target.value })
                            }
                            required
                            className="bg-slate-50 border-slate-200"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={clubForm.description}
                          onChange={(e) =>
                            setClubForm({ ...clubForm, description: e.target.value })
                          }
                          rows={4}
                          required
                          className="bg-slate-50 border-slate-200 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="faculty_advisor">Faculty Advisor</Label>
                          <Input
                            id="faculty_advisor"
                            value={clubForm.faculty_advisor}
                            onChange={(e) =>
                              setClubForm({ ...clubForm, faculty_advisor: e.target.value })
                            }
                            className="bg-slate-50 border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp_link">WhatsApp Group Link</Label>
                          <Input
                            id="whatsapp_link"
                            type="url"
                            value={clubForm.whatsapp_link}
                            onChange={(e) =>
                              setClubForm({ ...clubForm, whatsapp_link: e.target.value })
                            }
                            placeholder="https://chat.whatsapp.com/..."
                            className="bg-slate-50 border-slate-200"
                          />
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white min-w-[150px]">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="mt-0">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">Events Management</CardTitle>
                      <CardDescription>Create and manage your club events</CardDescription>
                    </div>
                    <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={openNewEventDialog} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10">
                          <Plus className="w-4 h-4" />
                          New Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingEvent ? "Edit Event" : "Create New Event"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingEvent
                              ? "Update your event details"
                              : "Add a new event for your club"}
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
                          className="space-y-4 mt-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="event-title">Title</Label>
                            <Input
                              id="event-title"
                              value={eventForm.title}
                              onChange={(e) =>
                                setEventForm({ ...eventForm, title: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="event-description">Description</Label>
                            <Textarea
                              id="event-description"
                              value={eventForm.description}
                              onChange={(e) =>
                                setEventForm({ ...eventForm, description: e.target.value })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="event-date">Date & Time</Label>
                              <Input
                                id="event-date"
                                type="datetime-local"
                                value={eventForm.date}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, date: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="event-venue">Venue</Label>
                              <Input
                                id="event-venue"
                                value={eventForm.venue}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, venue: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
                              {editingEvent ? "Update Event" : "Create Event"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEventDialogOpen(false);
                                setEditingEvent(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {events.length > 0 ? (
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div key={event.id} className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-200 group">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{event.title}</h3>
                                <p className="text-slate-500 text-sm mb-3 line-clamp-2">
                                  {event.description}
                                </p>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-100">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                    {new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-100">
                                    <div className="w-3.5 h-3.5 flex items-center justify-center text-red-500">📍</div>
                                    {event.venue}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openAttendanceDialog(event)}
                                  title="Attendance"
                                  className="h-9 w-9 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openEditEventDialog(event)}
                                  className="h-9 w-9 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this event? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                        <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No events yet</p>
                        <p className="text-sm text-slate-400 mb-4">Create your first event to get started</p>
                        <Button onClick={openNewEventDialog} variant="outline" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Create Event
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Announcements Tab */}
              <TabsContent value="announcements" className="mt-0">
                <Card className="border-slate-200 shadow-sm bg-white mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900">Post Announcement</CardTitle>
                    <CardDescription>
                      Share updates with all club members (requires admin approval)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                      <Textarea
                        placeholder="Type your announcement here..."
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        rows={3}
                        required
                        className="resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      />
                      <div className="flex justify-end">
                        <Button type="submit" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                          <MessageSquare className="w-4 h-4" />
                          Submit for Approval
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900">Recent Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {announcements.length > 0 ? (
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <p className="mb-3 text-slate-800 leading-relaxed">{announcement.message}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="font-medium text-slate-600">{announcement.created_by?.name}</span>
                              <span>•</span>
                              <span>{new Date(announcement.timestamp).toLocaleString()}</span>
                              {announcement.status === 'pending' && (
                                <Badge variant="outline" className="ml-auto border-yellow-200 text-yellow-700 bg-yellow-50">
                                  Pending Approval
                                </Badge>
                              )}
                              {announcement.status === 'approved' && (
                                <Badge variant="outline" className="ml-auto border-emerald-200 text-emerald-700 bg-emerald-50">
                                  Published
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No announcements yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="mt-0">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900">Club Members</CardTitle>
                    <CardDescription>View and manage your club members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {members.length > 0 ? (
                      <div className="space-y-1">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                {member.user?.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-slate-900">{member.user?.name}</p>
                                <p className="text-xs text-slate-500">
                                  {member.user?.email}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={member.role_in_club === "head" ? "default" : "secondary"}
                              className={member.role_in_club === "head" ? "bg-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}
                            >
                              {member.role_in_club}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No members yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Tracking</DialogTitle>
            <DialogDescription>
              Mark attendance for {selectedEventForAttendance?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {eventParticipants.length > 0 ? (
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Registered At</th>
                      <th className="px-6 py-4 font-medium text-center">Attended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventParticipants.map((participant) => (
                      <tr key={participant.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{participant.user?.name || "Unknown"}</td>
                        <td className="px-6 py-4 text-slate-500">{participant.user?.email}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(participant.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                            checked={participant.attended || false}
                            onChange={() => handleToggleAttendance(participant.id, participant.attended)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No participants registered for this event yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
