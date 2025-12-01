import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Calendar, User, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data: announcementsData, error } = await supabase
      .from("announcements")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
      toast.error(`Error: ${error.message}`);
    } else if (announcementsData) {
      // Manually fetch creator profiles to avoid join issues
      const userIds = [...new Set(announcementsData.map(a => a.created_by).filter(id => id))];

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);

        const profileMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

        const enrichedAnnouncements = announcementsData.map(a => ({
          ...a,
          creator_name: profileMap.get(a.created_by) || "Unknown"
        }));
        setAnnouncements(enrichedAnnouncements);
      } else {
        setAnnouncements(announcementsData);
      }
    }
    setLoading(false);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">


      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
              Updates & News
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Announcements</h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Stay informed about the latest club activities, important updates, and campus news.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 max-w-6xl">
        {/* Search */}
        <Card className="mb-8 border-none shadow-lg shadow-slate-900/5">
          <CardContent className="p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search announcements..."
                className="pl-10 bg-slate-50 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full">
                <CardHeader>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="space-y-4 mb-12">
            {filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="group hover:shadow-md transition-all duration-300 border-slate-200/60 bg-white">
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                        General
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(announcement.timestamp).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {/* Use first few words of message as title since title column doesn't exist */}
                      {announcement.message.split(' ').slice(0, 10).join(' ')}...
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {announcement.message}
                    </p>
                  </div>
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 min-w-[120px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col md:items-end">
                        <span className="text-xs font-semibold text-slate-700">
                          {announcement.creator_name || "Club Admin"}
                        </span>
                        <span className="text-[10px] text-slate-400">Posted by</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Announcements Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              We couldn't find any announcements matching your criteria.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
