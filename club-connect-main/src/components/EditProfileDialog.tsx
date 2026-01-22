import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

interface EditProfileDialogProps {
    profile: any;
    onProfileUpdate: () => void;
}

export function EditProfileDialog({ profile, onProfileUpdate }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: profile?.name || "",
        bio: profile?.bio || "",
        avatar_url: profile?.avatar_url || "",
        branch: profile?.branch || "",
        year_of_study: profile?.year_of_study || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.put("http://localhost:5000/api/users/me", formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            toast.success("Profile updated successfully");
            onProfileUpdate();
            setOpen(false);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(`Failed to update profile: ${error.message || "Server Error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us a little about yourself"
                                className="resize-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="avatar_url">Avatar URL</Label>
                            <Input
                                id="avatar_url"
                                name="avatar_url"
                                value={formData.avatar_url}
                                onChange={handleChange}
                                placeholder="https://example.com/avatar.jpg"
                            />
                            <p className="text-xs text-muted-foreground">
                                Provide a direct link to an image for your avatar.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="branch">Branch</Label>
                            <Input
                                id="branch"
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                placeholder="Branch"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="year_of_study">Year</Label>
                            <Input
                                id="year_of_study"
                                name="year_of_study"
                                value={formData.year_of_study}
                                onChange={handleChange}
                                placeholder="Year"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
