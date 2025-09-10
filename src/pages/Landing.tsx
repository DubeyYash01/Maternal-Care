import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scene3D } from "@/components/3d/Scene3D";
import { Baby3D } from "@/components/3d/Baby3D";
import { Heart3D } from "@/components/3d/Heart3D";
import { Navigation } from "@/components/Navigation";
import { 
  Heart, 
  Shield, 
  Monitor, 
  Bell, 
  Smartphone, 
  Users,
  Award,
  Star 
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Monitor,
      title: "Continuous Monitoring",
      description: "24/7 tracking of vital signs including fetal heart rate, blood pressure, and oxygen levels",
      color: "text-primary"
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Instant notifications for healthcare providers when readings indicate potential concerns",
      color: "text-warning"
    },
    {
      icon: Smartphone,
      title: "Remote Access",
      description: "Doctors can monitor patients remotely, enabling better care coordination and response",
      color: "text-secondary"
    }
  ];

  const quotes = [
    "Your strength is your baby's heartbeat",
    "Every moment matters in maternal care",
    "Nurturing health, one heartbeat at a time"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Project Info */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Smart Wearable for{" "}
                  <span className="text-gradient">Continuous Maternal</span>{" "}
                  Health Monitoring
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Revolutionary technology that provides real-time monitoring of maternal and fetal health, 
                  ensuring safer pregnancies and better outcomes for mothers and babies.
                </p>
                
                <blockquote className="quote-maternal border-l-4 border-primary pl-4 my-6">
                  "Nurturing health, one heartbeat at a time."
                </blockquote>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="btn-hero">
                  <Link to="/login">Start Monitoring</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">Learn More</Link>
                </Button>
              </div>

              {/* Project Purpose */}
              <Card className="card-maternal bg-gradient-card">
                <h3 className="font-semibold text-lg mb-3 text-primary">Why This Matters</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Maternal and infant mortality rates remain a critical global health challenge. 
                  Our smart wearable technology enables continuous monitoring, early detection of complications, 
                  and immediate alerts to healthcare providers, potentially saving lives through timely interventions.
                </p>
              </Card>
            </div>

            {/* Right: 3D Baby Model */}
            <div className="flex justify-center">
              <div className="w-96 h-96 hover-scale">
                <Scene3D className="w-full h-full" enableControls={true} autoRotate={true}>
                  <Baby3D position={[0, 0, 0]} scale={1} />
                </Scene3D>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Advanced monitoring capabilities designed specifically for maternal and fetal health care
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="card-maternal text-center hover-scale animate-fade-in" style={{animationDelay: `${index * 0.2}s`}}>
                  <div className="w-16 h-16 mx-auto mb-4">
                    <Scene3D className="w-full h-full">
                      <Heart3D scale={0.4} />
                    </Scene3D>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Our Team & Acknowledgments</h2>
            
            <Card className="card-maternal animate-scale-in">
              <div className="w-32 h-32 mx-auto mb-6">
                <Scene3D className="w-full h-full" autoRotate={true}>
                  <Heart3D scale={0.8} />
                </Scene3D>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Development Team
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    A dedicated team of engineers, healthcare professionals, and researchers 
                    working to revolutionize maternal health monitoring.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-warning" />
                    <span>Committed to saving lives through technology</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Medical Advisory
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Guided by leading obstetricians and maternal-fetal medicine specialists 
                    to ensure clinical accuracy and safety.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-success" />
                    <span>Clinically validated approach</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Monitoring?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join the future of maternal healthcare. Start your journey with our smart monitoring system today.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-warm">
            <Link to="/login">Get Started Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;