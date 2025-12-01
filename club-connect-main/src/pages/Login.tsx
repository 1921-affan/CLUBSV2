import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || "Failed to sign in");
    } else {
      toast.success("Welcome back!");
      // Navigation is handled in signIn function based on role
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      toast.error(error.message || "Failed to sign up");
    } else {
      toast.success("Account created successfully!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">C</span>
            </div>
            ClubConnect
          </div>
          <p className="text-slate-400">Your Campus Community Hub</p>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Discover, Join, and Lead Student Clubs
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Connect with peers who share your passions. From tech to arts, find your tribe and make your mark on campus.
          </p>
        </div>
        <div className="relative z-10 text-sm text-slate-500">
          © 2024 ClubConnect. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 mt-2">
              Sign in to your account to continue
            </p>
          </div>

          <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
            <CardContent className="pt-6 pb-8 px-8">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">College Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <a href="#" className="text-xs text-blue-600 hover:text-blue-500 font-medium">Forgot password?</a>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">College Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
