import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Scene3D } from "@/components/3d/Scene3D";
import { Baby3D } from "@/components/3d/Baby3D";
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets,
  User,
  FileText,
  Bell,
  Settings,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from "lucide-react";

const MotherDashboard = () => {
  const [vitals] = useState({
    fetalHeartRate: { value: 140, status: "normal", unit: "BPM" },
    bloodPressure: { value: "120/80", status: "normal", unit: "mmHg" },
    oxygenSaturation: { value: 98, status: "normal", unit: "%" },
    temperature: { value: 98.6, status: "normal", unit: "°F" }
  });

  const [profile] = useState({
    name: "Sarah Johnson",
    age: 28,
    height: "5'6\"",
    weight: 145,
    bmi: 23.4,
    dueDate: "March 15, 2024",
    weeksPregnant: 32
  });

  const [alerts] = useState([
    { 
      id: 1, 
      type: "info", 
      message: "Daily questionnaire available", 
      time: "2 hours ago" 
    },
    { 
      id: 2, 
      type: "success", 
      message: "All vitals within normal range", 
      time: "4 hours ago" 
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "vital-normal";
      case "warning": return "vital-warning"; 
      case "critical": return "vital-critical";
      default: return "vital-normal";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal": return <CheckCircle2 className="h-4 w-4" />;
      case "warning": return <AlertCircle className="h-4 w-4" />;
      case "critical": return <AlertCircle className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const quotes = [
    "Your strength is your baby's heartbeat",
    "Every moment of care matters",
    "You're growing a miracle",
    "Trust your body, trust the process"
  ];

  const [currentQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Welcome Banner */}
      <div className="bg-gradient-hero py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {profile.name} ❤️</h1>
              <p className="text-muted-foreground">Your health matters most - {profile.weeksPregnant} weeks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="card-maternal">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/mother-dashboard" className="bg-primary/10 text-primary">
                      <Activity className="mr-2 h-4 w-4" />
                      Vitals
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/reports">
                      <FileText className="mr-2 h-4 w-4" />
                      Reports
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/questionnaire">
                      <Calendar className="mr-2 h-4 w-4" />
                      Questionnaire
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/alerts">
                      <Bell className="mr-2 h-4 w-4" />
                      Alerts
                    </Link>
                  </Button>
                </nav>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card className="card-maternal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium">{profile.age}</span>
                  
                  <span className="text-muted-foreground">Height:</span>
                  <span className="font-medium">{profile.height}</span>
                  
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{profile.weight} lbs</span>
                  
                  <span className="text-muted-foreground">BMI:</span>
                  <span className="font-medium">{profile.bmi}</span>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">Due Date</div>
                  <div className="font-medium text-primary">{profile.dueDate}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vital Signs */}
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Current Vital Signs</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="card-maternal hover-scale animate-fade-in" style={{animationDelay: '0.1s'}}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Fetal Heart Rate
                  </CardTitle>
                  {getStatusIcon(vitals.fetalHeartRate.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold animate-pulse">{vitals.fetalHeartRate.value}</div>
                  <p className="text-xs text-muted-foreground">{vitals.fetalHeartRate.unit}</p>
                  <Badge className={`mt-2 ${getStatusColor(vitals.fetalHeartRate.status)}`}>
                    Normal Range
                  </Badge>
                </CardContent>
              </Card>

              <Card className="card-maternal hover-scale animate-fade-in" style={{animationDelay: '0.2s'}}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Blood Pressure
                  </CardTitle>
                  {getStatusIcon(vitals.bloodPressure.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vitals.bloodPressure.value}</div>
                  <p className="text-xs text-muted-foreground">{vitals.bloodPressure.unit}</p>
                  <Badge className={`mt-2 ${getStatusColor(vitals.bloodPressure.status)}`}>
                    Optimal
                  </Badge>
                </CardContent>
              </Card>

              <Card className="card-maternal hover-scale animate-fade-in" style={{animationDelay: '0.3s'}}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-primary" />
                    Oxygen Saturation
                  </CardTitle>
                  {getStatusIcon(vitals.oxygenSaturation.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vitals.oxygenSaturation.value}</div>
                  <p className="text-xs text-muted-foreground">{vitals.oxygenSaturation.unit}</p>
                  <Badge className={`mt-2 ${getStatusColor(vitals.oxygenSaturation.status)}`}>
                    Excellent
                  </Badge>
                </CardContent>
              </Card>

              <Card className="card-maternal hover-scale animate-fade-in" style={{animationDelay: '0.4s'}}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    Temperature
                  </CardTitle>
                  {getStatusIcon(vitals.temperature.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vitals.temperature.value}</div>
                  <p className="text-xs text-muted-foreground">{vitals.temperature.unit}</p>
                  <Badge className={`mt-2 ${getStatusColor(vitals.temperature.status)}`}>
                    Normal
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alerts */}
          <Card className="card-maternal animate-fade-in" style={{animationDelay: '0.5s'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover-scale animate-fade-in`} style={{animationDelay: `${0.6 + index * 0.1}s`}}>
                  <div className={`w-2 h-2 rounded-full mt-2 animate-pulse ${
                    alert.type === "success" ? "bg-success" :
                    alert.type === "warning" ? "bg-warning" : "bg-primary"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full hover-scale" asChild>
                <Link to="/questionnaire">
                  <Calendar className="mr-2 h-4 w-4" />
                  Complete Today's Questionnaire
                </Link>
              </Button>
            </CardContent>
          </Card>

            {/* Progress */}
            <Card className="card-maternal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pregnancy Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Week {profile.weeksPregnant} of 40</span>
                    <span>{Math.round((profile.weeksPregnant / 40) * 100)}%</span>
                  </div>
                  <Progress value={(profile.weeksPregnant / 40) * 100} className="h-2" />
                </div>
                
                <div className="text-center p-4 bg-gradient-hero rounded-lg">
                  <p className="quote-maternal text-primary">"{currentQuote}"</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* 3D Baby */}
            <Card className="card-maternal animate-scale-in">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg mb-2 animate-fade-in">Your Baby</h3>
                  <p className="text-sm text-muted-foreground animate-fade-in" style={{animationDelay: '0.2s'}}>Week {profile.weeksPregnant}</p>
                </div>
                <div className="flex justify-center">
                  <div className="w-72 h-72">
                    <Scene3D className="w-full h-full" enableControls={false} autoRotate={true}>
                      <Baby3D position={[0, 0, 0]} scale={0.8} />
                    </Scene3D>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-maternal animate-fade-in" style={{animationDelay: '1s'}}>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start hover-scale" asChild>
                  <Link to="/questionnaire">
                    <Calendar className="mr-2 h-4 w-4" />
                    Daily Check-in
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start hover-scale" asChild>
                  <Link to="/contact">
                    <Bell className="mr-2 h-4 w-4" />
                    Contact Doctor
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start hover-scale" asChild>
                  <Link to="/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    View Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotherDashboard;