import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // For detail view

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserRegistrations();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    }
  };

  const fetchUserRegistrations = async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://localhost:5000/api/users/me/registrations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Backend returns array of { event_id: ... } objects
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
      fetchEvents();
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
      fetchEvents();
      fetchUserRegistrations();
    } catch (error: any) {
      console.error("Error unregistering:", error);
      toast.error(error.response?.data?.message || "Failed to unregister");
    }
  };

  const isRegistered = (eventId: string) => registrations.has(eventId);

  return (
    <div className="min-h-screen bg-gray-50/50">


      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Discover & <span className="text-primary-light">Participate</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
              Join upcoming events, workshops, and activities organized by your campus clubs.
              Never miss an opportunity to learn and connect.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200/60 overflow-hidden flex flex-col h-full bg-white">
                {/* Card Image/Gradient Placeholder */}
                <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-white/20" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border-none font-medium text-xs">
                      {event.organizer_club?.name}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">
                      {event.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-3 px-5 pb-5">
                  {event.description && (
                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-auto space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="p-1.5 rounded-full bg-slate-50 text-slate-500">
                        <Calendar className="w-3 h-3" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {new Date(event.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="p-1.5 rounded-full bg-slate-50 text-slate-500">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <span className="truncate">{event.venue}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="p-1.5 rounded-full bg-slate-50 text-slate-500">
                        <Users className="w-3 h-3" />
                      </div>
                      <span>{event.event_participants?.[0]?.count || 0} registered</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-1">
                    <Button
                      onClick={() => setSelectedEvent(event)}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 h-9 text-xs"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="p-4 rounded-full bg-slate-50 mb-4">
              <Calendar className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Upcoming Events</h3>
            <p className="text-slate-500 max-w-sm">
              There are no events scheduled at the moment. Check back later or contact your club heads.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Organized by {selectedEvent?.organizer_club?.name || "Club"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {selectedEvent && new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedEvent && new Date(selectedEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedEvent?.venue}</span>
              </div>
            </div>

            <div className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-[300px] overflow-y-auto">
              {selectedEvent?.description || "No description provided."}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
            {selectedEvent && (
              isRegistered(selectedEvent.id) ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleUnregister(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                >
                  Unregister
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    handleRegister(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Register Now
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
