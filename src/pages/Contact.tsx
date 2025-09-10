import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navigation } from "@/components/Navigation";
import { Scene3D } from "@/components/3d/Scene3D";
import { Family3D } from "@/components/3d/Family3D";
import { 
  Heart, 
  Mail, 
  Phone, 
  MessageSquare, 
  Send,
  HelpCircle,
  Shield,
  Users,
  Award
} from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for your message! We'll get back to you soon. 💙");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const faqs = [
    {
      question: "How does the wearable monitoring device work?",
      answer: "Our smart wearable continuously monitors vital signs including fetal heart rate, maternal blood pressure, oxygen saturation, and body temperature. The device uses advanced sensors to collect real-time data and wirelessly transmit it to our secure platform for analysis by healthcare providers."
    },
    {
      question: "Is the monitoring device safe for both mother and baby?",
      answer: "Absolutely. Our device is FDA-approved and uses completely safe, non-invasive monitoring technology. The sensors are designed specifically for pregnant women and use no harmful radiation. All materials are hypoallergenic and comfortable for extended wear."
    },
    {
      question: "How quickly will my doctor be notified of any concerns?",
      answer: "Our system provides real-time alerts. Critical readings trigger immediate notifications to your healthcare provider within seconds, while warning-level readings generate alerts within 2-5 minutes. Your care team can then contact you directly or recommend immediate medical attention if needed."
    },
    {
      question: "Can I access my health data anytime?",
      answer: "Yes! Through our secure patient portal and mobile app, you have 24/7 access to your health data, trends, and reports. You can view your vital signs history, download reports for appointments, and track your pregnancy progress at any time."
    },
    {
      question: "What if I experience technical issues with the device?",
      answer: "We provide 24/7 technical support through multiple channels including live chat, phone, and email. Our support team can troubleshoot remotely, provide replacement devices if needed, and ensure your monitoring continues uninterrupted."
    },
    {
      question: "How much does the monitoring service cost?",
      answer: "Costs vary based on your insurance coverage and chosen monitoring package. We work with most major insurance providers and offer flexible payment plans. Contact us for a personalized quote and to verify your insurance benefits."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Contact & Help</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're here to support you on your maternal health journey. Get answers to your questions or reach out for personalized assistance.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* FAQ Section */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="card-maternal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left hover:text-primary">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="card-maternal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Send us a Message
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="border-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="border-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="What can we help you with?"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        className="border-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your question or concern..."
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        className="min-h-[120px] border-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="btn-hero w-full">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="card-maternal">
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">24/7 Support Hotline</p>
                      <p className="text-sm text-muted-foreground">1-800-MATERNAL</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">support@maternalcare.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p className="text-sm text-muted-foreground">Available 24/7</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="card-maternal bg-destructive/5 border-destructive/20">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <Shield className="h-8 w-8 text-destructive mx-auto" />
                    <h3 className="font-semibold text-destructive">Emergency Support</h3>
                    <p className="text-sm text-muted-foreground">
                      For medical emergencies, call 911 immediately or go to your nearest emergency room.
                    </p>
                    <Button variant="destructive" className="w-full">
                      <Phone className="mr-2 h-4 w-4" />
                      Emergency: 911
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Happy Family 3D */}
              <Card className="card-maternal">
                <CardContent className="p-4">
                  <div className="text-center space-y-4">
                    <div className="h-48 w-full">
                      <Scene3D className="w-full h-full" autoRotate={true}>
                        <Family3D scale={0.6} />
                      </Scene3D>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">We're Here for You</h3>
                      <p className="text-sm text-muted-foreground">
                        Supporting families every step of the way
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Team & Acknowledgments */}
          <section className="mt-16">
            <Card className="card-maternal">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Our Team & Acknowledgments</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    MaternalCare is brought to you by a dedicated team of healthcare professionals, 
                    engineers, and researchers committed to improving maternal and fetal outcomes.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mx-auto shadow-soft">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Development Team</h3>
                      <p className="text-muted-foreground text-sm">
                        Engineers and researchers working tirelessly to create life-saving technology for maternal health monitoring.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mx-auto shadow-soft">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Medical Advisory</h3>
                      <p className="text-muted-foreground text-sm">
                        Leading obstetricians and maternal-fetal medicine specialists ensuring clinical accuracy and safety.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mx-auto shadow-soft">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Special Thanks</h3>
                      <p className="text-muted-foreground text-sm">
                        Grateful acknowledgment to our mentors, advisors, and the healthcare institutions supporting our mission.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Contact;