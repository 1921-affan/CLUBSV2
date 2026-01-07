import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Users, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Clubs() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [myPendingClubs, setMyPendingClubs] = useState<any[]>([]);
  const [clubForm, setClubForm] = useState({
    name: "",
    category: "",
    description: "",
    faculty_advisor: "",
    whatsapp_link: "",
  });
  const [recommendedClubs, setRecommendedClubs] = useState<any[]>([]);

  useEffect(() => {
    fetchClubs();
    if (user) {
      fetchMyPendingClubs();
      fetchRecommendedClubs();
    }
  }, [user]);

  const fetchClubs = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/clubs");
      setClubs(response.data);
      const uniqueCategories = [...new Set(response.data.map((club: any) => club.category))];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  const fetchMyPendingClubs = async () => {
    if (!user) return;
    try {
      const response = await axios.get("http://localhost:5000/api/clubs/my-requests", { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMyPendingClubs(response.data);
    } catch (error) {
      console.error("Error fetching pending clubs:", error);
    }
  };

  const handleSubmitClubRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a club");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/clubs/request", clubForm, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success("Club request submitted! An admin will review it soon.");
      setClubForm({
        name: "",
        category: "",
        description: "",
        faculty_advisor: "",
        whatsapp_link: "",
      });
      setDialogOpen(false);
      fetchMyPendingClubs();
    } catch (error) {
      toast.error("Failed to submit club request");
      console.error(error);
    }
  };

  // AI Recommendations removed in favor of dedicated Matchmaker page
  const fetchRecommendedClubs = async () => {
    // No-op
  };

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || club.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50/50">


      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Discover <span className="text-blue-400">Clubs</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
              Find the perfect community to match your interests, develop new skills, and make lifelong friends.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* AI Recommendations Section Removed (Moved to /matchmaker) */}
        {/* My Pending/Rejected Clubs Section */}
        {user && myPendingClubs.length > 0 && (
          <Card className="mb-12 border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-slate-900">My Club Requests</CardTitle>
              <CardDescription>Track the status of your club creation requests</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {myPendingClubs.map((club) => (
                  <div
                    key={club.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${club.status === "rejected"
                      ? "border-red-100 bg-red-50/50"
                      : "border-amber-100 bg-amber-50/50"
                      }`}
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900">{club.name}</h3>
                      <p className="text-sm text-slate-500">
                        Submitted: {new Date(club.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={club.status === "rejected" ? "destructive" : "secondary"}
                      className={club.status === "rejected" ? "" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}
                    >
                      {club.status === "rejected" ? "Rejected" : "Pending Review"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start mb-12">
          {/* Search and Filter */}
          <div className="flex-1 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search clubs by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus-visible:ring-slate-900"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[240px] border-slate-200 focus:ring-slate-900">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full lg:w-auto h-14 px-8 gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 text-base">
                  <Plus className="w-5 h-5" />
                  Request New Club
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Request to Create a New Club</DialogTitle>
                  <DialogDescription>
                    Submit your club proposal. An admin will review and approve it.
                    Upon approval, you'll become the club head.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitClubRequest} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="club-name">Club Name *</Label>
                    <Input
                      id="club-name"
                      value={clubForm.name}
                      onChange={(e) =>
                        setClubForm({ ...clubForm, name: e.target.value })
                      }
                      required
                      placeholder="e.g., Photography Club"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-category">Category *</Label>
                    <Input
                      id="club-category"
                      value={clubForm.category}
                      onChange={(e) =>
                        setClubForm({ ...clubForm, category: e.target.value })
                      }
                      required
                      placeholder="e.g., Cultural, Technical, Sports"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-description">Description *</Label>
                    <Textarea
                      id="club-description"
                      value={clubForm.description}
                      onChange={(e) =>
                        setClubForm({ ...clubForm, description: e.target.value })
                      }
                      rows={4}
                      required
                      placeholder="Describe your club's purpose, activities, and goals..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-faculty">Faculty Advisor (Optional)</Label>
                    <Input
                      id="club-faculty"
                      value={clubForm.faculty_advisor}
                      onChange={(e) =>
                        setClubForm({ ...clubForm, faculty_advisor: e.target.value })
                      }
                      placeholder="Faculty member supervising the club"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-whatsapp">WhatsApp Group Link (Optional)</Label>
                    <Input
                      id="club-whatsapp"
                      type="url"
                      value={clubForm.whatsapp_link}
                      onChange={(e) =>
                        setClubForm({ ...clubForm, whatsapp_link: e.target.value })
                      }
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
                      Submit Request
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-500 font-medium">
            Showing {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Clubs Grid */}
        {filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredClubs.map((club) => (
              <Link key={club.id} to={`/clubs/${club.id}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-slate-200/60 bg-white flex flex-col">
                  <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <Users className="w-12 h-12 text-white/30 group-hover:scale-110 transition-transform duration-500" />
                    <Badge className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm text-xs">
                      {club.category}
                    </Badge>
                  </div>
                  <CardHeader className="pt-4 pb-3 px-5">
                    <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">
                      {club.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-slate-500 leading-relaxed text-xs">
                      {club.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0 px-5 pb-5">
                    {(club.faculty_advisor || club.club_head) && (
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
                        {club.faculty_advisor && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                              Faculty Advisor
                            </p>
                            <p className="text-xs text-slate-600 truncate">
                              {club.faculty_advisor}
                            </p>
                          </div>
                        )}
                        {club.club_head && (
                          <div className={club.faculty_advisor ? "text-right" : ""}>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                              Club Head
                            </p>
                            <p className="text-xs text-slate-600 truncate">
                              {club.club_head}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center text-xs text-slate-400 group-hover:text-blue-500 transition-colors font-medium">
                      View Details <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="p-4 rounded-full bg-slate-50 mb-4">
              <Search className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No clubs found</h3>
            <p className="text-slate-500 max-w-sm">
              We couldn't find any clubs matching your criteria. Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
