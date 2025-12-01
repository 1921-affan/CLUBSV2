import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="text-xl font-bold text-white">
                                TheClubs
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-400">
                            Empowering student communities to connect, collaborate, and grow together. Join the movement today.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link to="/clubs" className="hover:text-white transition-colors">Browse Clubs</Link></li>
                            <li><Link to="/events" className="hover:text-white transition-colors">Upcoming Events</Link></li>
                            <li><Link to="/announcements" className="hover:text-white transition-colors">Announcements</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-bold text-white mb-4">Resources</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
                            <li><Link to="/dashboard" className="hover:text-white transition-colors">Club Dashboard</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-bold text-white mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <span>RV UNIVERSITY ,RV Vidyanikethan Post, 8th Mile, Mysore Rd, Mailasandra, Bengaluru, Karnataka 560059</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary shrink-0" />
                                <span>089511 79896</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary shrink-0" />
                                <span>support@theclubs.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} TheClubs. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
