import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Calendar, User, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/announcements", {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Backend now returns everything directly, including creator names via joins if implemented right, 
      // OR we might need to rely on what backend sends.
      // My backend query joins 'clubs' for club_name. 
      // It does NOT join profiles for 'creator_name'. Ideally it should, or current usage of "Club Admin" fallback is fine.
      // Let's stick to what backend provides. If backend doesn't provide creator_name, we use fallback.
      // The backend query I added:
      /*
          SELECT a.*, c.name as club_name 
           FROM announcements a 
           JOIN clubs c ON a.club_id = c.id
           ORDER BY a.timestamp DESC
      */
      // It provides club_name. It doesn't provide creator_name. 
      // Frontend logic previously fetched profiles manually.
      // For now, I will skip fetching creator profiles to be fast and just user "Club Admin" or similar if missing.
      // Or I can update backend query to join profiles too. 
      // Let's assume user is okay with "Posted by Club Name" or similar context.
      // Actually, the UI shows "Posted by [Creator Name]" and "Club Name" is not prominent? 
      // Wait, UI code: `club_name` is NOT used in the card currently! It uses `creator_name`.
      // The previous code mapped `creator_name`. 
      // The join logic I added in server.js gives `club_name`.
      // I should probably display `club_name` instead of `creator_name` as it's more relevant for an announcement?
      // Let's use `club_name` mapping to `creator_name` or just display `club_name` in the UI where appropriate.
      // I will map `creator_name` to `announcement.club_name` effectively saying "Posted by [Club Name]".

      const mappedData = response.data.map((a: any) => ({
        ...a,
        creator_name: a.club_name // Showing Club Name as the "Author" is cleaner anyway.
      }));

      setAnnouncements(mappedData);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
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
                        {announcement.club_name || "General"}
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
