import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { Scene3D } from "@/components/3d/Scene3D";
import { Heart3D } from "@/components/3d/Heart3D";
import { Heart, User, Stethoscope, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<"mother" | "doctor">("mother");
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    // Simulate authentication
    toast.success(`Welcome ${userRole === "mother" ? "Mom" : "Doctor"}! 👋`);
    
    // Navigate to appropriate dashboard
    if (userRole === "mother") {
      navigate("/mother-dashboard");
    } else {
      navigate("/doctor-dashboard");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          {/* Left: 3D Heart Illustration */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-80 h-96">
              <Scene3D className="w-full h-full" enableControls={false} autoRotate={true}>
                <Heart3D position={[0, 0, 0]} scale={1.5} />
              </Scene3D>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow float-gentle animate-fade-in">
                <Heart className="h-8 w-8 text-white" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-accent/80 flex items-center justify-center shadow-soft float-gentle animate-fade-in" style={{animationDelay: '1.5s'}}>
                <Stethoscope className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
            
            <div className="text-center space-y-4 animate-fade-in" style={{animationDelay: '1s'}}>
              <h2 className="text-2xl font-bold text-gradient">Join MaternalCare</h2>
              <p className="quote-maternal">
                "Every heartbeat matters. Every mother deserves the best care."
              </p>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="card-maternal animate-scale-in">
              <CardHeader>
                <CardTitle className="text-2xl text-center animate-fade-in">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </CardTitle>
                <p className="text-center text-muted-foreground animate-fade-in" style={{animationDelay: '0.2s'}}>
                  {isLogin ? "Sign in to continue your care journey" : "Start your maternal health journey"}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">I am a:</Label>
                  <Tabs value={userRole} onValueChange={(value) => setUserRole(value as "mother" | "doctor")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="mother" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Mother
                      </TabsTrigger>
                      <TabsTrigger value="doctor" className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Doctor
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="pl-10 border-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="pl-10 border-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="pl-10 border-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className="pl-10 border-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full btn-hero">
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <Button 
                      variant="link" 
                      className="p-0 ml-2 text-primary" 
                      onClick={() => setIsLogin(!isLogin)}
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </Button>
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-center text-muted-foreground">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;