import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Users, Calendar, TrendingUp, ArrowRight, MapPin } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [featuredClubs, setFeaturedClubs] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    clubs: 0,
    events: 0,
    members: 0,
  });

  useEffect(() => {
    fetchFeaturedClubs();
    fetchUpcomingEvents();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: clubsCount } = await supabase.from("clubs").select("*", { count: "exact", head: true });
    const { count: eventsCount } = await supabase.from("events").select("*", { count: "exact", head: true });
    const { count: membersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

    setStats({
      clubs: clubsCount || 0,
      events: eventsCount || 0,
      members: membersCount || 0,
    });
  };

  const fetchFeaturedClubs = async () => {
    const { data } = await supabase
      .from("clubs")
      .select("*")
      .limit(3);
    setFeaturedClubs(data || []);
  };

  const fetchUpcomingEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, organizer_club:clubs(name)")
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(3);
    setUpcomingEvents(data || []);
  };

  return (
    <div className="min-h-screen bg-gray-50">


      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white hover:bg-white/20 border-white/20 px-4 py-1.5 text-sm backdrop-blur-sm">
              Welcome to TheClubs
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
              Connect. Collaborate. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Create Impact.
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl">
              Discover vibrant student communities, join exciting events, and shape your university experience. Your journey starts here.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/clubs")}
                className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14"
              >
                Explore Clubs
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/events")}
                className="bg-transparent border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14"
              >
                Find Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.clubs}+</h3>
                <p className="text-slate-500">Active Clubs</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.events}+</h3>
                <p className="text-slate-500">Upcoming Events</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.members}+</h3>
                <p className="text-slate-500">Student Members</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clubs */}
      <section className="py-20 bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Clubs</h2>
              <p className="text-slate-500">Discover some of our most active communities</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/clubs")} className="gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredClubs.map((club) => (
              <Card key={club.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-white overflow-hidden cursor-pointer shadow-md" onClick={() => navigate(`/clubs/${club.id}`)}>
                <div className="h-40 bg-slate-800 relative overflow-hidden">
                  {club.banner_url ? (
                    <img src={club.banner_url} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600">
                      <Users className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm shadow-sm text-xs">
                      {club.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{club.name}</h3>
                  <p className="text-slate-500 line-clamp-2 leading-relaxed mb-4 text-sm">{club.description}</p>
                  <div className="flex items-center text-xs text-slate-400 font-medium">
                    <Users className="w-3 h-3 mr-2" />
                    <span>Join the community</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Upcoming Events</h2>
              <p className="text-slate-500">Don't miss out on what's happening</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/events")} className="gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-white overflow-hidden cursor-pointer shadow-md" onClick={() => navigate("/events")}>
                <div className="relative">
                  <div className="h-40 bg-slate-800 overflow-hidden">
                    {event.banner_url ? (
                      <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600">
                        <Calendar className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm shadow-sm text-xs">
                      {event.organizer_club?.name}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="bg-slate-100 rounded-lg p-2 text-center min-w-[50px]">
                      <span className="block text-xs font-bold text-blue-600 uppercase">
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                      <span className="block text-xl font-bold text-slate-900">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-purple-600 transition-colors">{event.title}</h3>
                      <div className="flex items-center text-slate-500 text-xs mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 line-clamp-2 leading-relaxed mb-4 text-sm">{event.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-100 pt-3">
                    <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                      Register Now <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to get involved?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join a club, attend an event, or start your own community today.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/clubs")}
            className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14"
          >
            Join Now
          </Button>
        </div>
      </section>

      {/* Footer */}

    </div>
  );
}
