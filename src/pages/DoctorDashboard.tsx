import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { 
  Search, 
  User, 
  AlertCircle, 
  CheckCircle2,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Download,
  Clock,
  Phone,
  FileText
} from "lucide-react";

const DoctorDashboard = () => {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");

  const [patients] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      age: 28,
      weeks: 32,
      riskLevel: "normal",
      lastUpdate: "2 hours ago",
      vitals: {
        fetalHeartRate: 140,
        bloodPressure: "120/80",
        temperature: 98.6,
        oxygenSaturation: 98
      },
      alerts: []
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      age: 34,
      weeks: 36,
      riskLevel: "high",
      lastUpdate: "15 minutes ago",
      vitals: {
        fetalHeartRate: 165,
        bloodPressure: "145/95",
        temperature: 99.2,
        oxygenSaturation: 96
      },
      alerts: [
        { type: "critical", message: "Blood pressure elevated", time: "15 min ago" },
        { type: "warning", message: "Fetal heart rate high", time: "30 min ago" }
      ]
    },
    {
      id: 3,
      name: "Jennifer Chen",
      age: 31,
      weeks: 28,
      riskLevel: "normal",
      lastUpdate: "1 hour ago",
      vitals: {
        fetalHeartRate: 145,
        bloodPressure: "118/75",
        temperature: 98.4,
        oxygenSaturation: 99
      },
      alerts: []
    },
    {
      id: 4,
      name: "Ashley Thompson",
      age: 26,
      weeks: 38,
      riskLevel: "moderate",
      lastUpdate: "45 minutes ago",
      vitals: {
        fetalHeartRate: 155,
        bloodPressure: "135/88",
        temperature: 98.8,
        oxygenSaturation: 97
      },
      alerts: [
        { type: "warning", message: "Blood pressure trending up", time: "45 min ago" }
      ]
    }
  ]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "normal": return "bg-success/10 text-success border-success/20";
      case "moderate": return "bg-warning/10 text-warning border-warning/20";
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getVitalStatus = (vital: string, value: any) => {
    // Simplified vital assessment
    switch (vital) {
      case "fetalHeartRate":
        if (value < 110 || value > 160) return "warning";
        return "normal";
      case "bloodPressure":
        const [systolic] = value.split("/").map(Number);
        if (systolic > 140) return "critical";
        if (systolic > 130) return "warning";
        return "normal";
      case "temperature":
        if (value > 100.4) return "critical";
        if (value > 99.5) return "warning";
        return "normal";
      case "oxygenSaturation":
        if (value < 95) return "critical";
        if (value < 98) return "warning";
        return "normal";
      default:
        return "normal";
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    // High-risk patients first
    const riskOrder = { high: 3, moderate: 2, normal: 1 };
    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-gradient-hero py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
              <p className="text-muted-foreground">Monitor your patients' maternal health</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {patients.length} Patients
              </Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {patients.filter(p => p.riskLevel === "high").length} High Risk
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="space-y-4">
            <Card className="card-maternal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient List
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {sortedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-soft ${
                      selectedPatient?.id === patient.id 
                        ? "border-primary bg-primary/5" 
                        : patient.riskLevel === "high" 
                        ? "border-destructive/30 bg-destructive/5" 
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{patient.name}</h3>
                      <Badge className={getRiskColor(patient.riskLevel)}>
                        {patient.riskLevel}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Age: {patient.age}</span>
                        <span>Week: {patient.weeks}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {patient.lastUpdate}
                      </div>
                      {patient.alerts.length > 0 && (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {patient.alerts.length} alerts
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Header */}
                <Card className="card-maternal">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedPatient.name}</CardTitle>
                        <p className="text-muted-foreground">
                          Age {selectedPatient.age} • Week {selectedPatient.weeks} • 
                          Last updated: {selectedPatient.lastUpdate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="mr-2 h-4 w-4" />
                          Call Patient
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download Report
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Alerts */}
                {selectedPatient.alerts.length > 0 && (
                  <Card className="card-maternal border-destructive/20 bg-destructive/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Active Alerts ({selectedPatient.alerts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedPatient.alerts.map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-medium text-destructive">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.time}</p>
                          </div>
                          <Badge variant="destructive">{alert.type}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Current Vitals */}
                <Card className="card-maternal">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Current Vital Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          getVitalStatus("fetalHeartRate", selectedPatient.vitals.fetalHeartRate) === "normal" 
                            ? "bg-success/20" 
                            : "bg-warning/20"
                        }`}>
                          <Heart className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fetal Heart Rate</p>
                          <p className="font-semibold">{selectedPatient.vitals.fetalHeartRate} BPM</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          getVitalStatus("bloodPressure", selectedPatient.vitals.bloodPressure) === "normal" 
                            ? "bg-success/20" 
                            : getVitalStatus("bloodPressure", selectedPatient.vitals.bloodPressure) === "warning"
                            ? "bg-warning/20"
                            : "bg-destructive/20"
                        }`}>
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Blood Pressure</p>
                          <p className="font-semibold">{selectedPatient.vitals.bloodPressure} mmHg</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                          <Droplets className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Oxygen Saturation</p>
                          <p className="font-semibold">{selectedPatient.vitals.oxygenSaturation}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                          <Thermometer className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="font-semibold">{selectedPatient.vitals.temperature}°F</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Doctor Notes */}
                <Card className="card-maternal">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Doctor Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Add notes about this patient's condition, recommendations, or observations..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button className="btn-hero">
                      Save Notes
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-maternal">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Patient</h3>
                  <p className="text-muted-foreground">
                    Choose a patient from the list to view their details and vital signs
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;