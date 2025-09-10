import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Hero3D } from "@/components/Hero3D";
import { 
  Heart, 
  Brain, 
  Moon, 
  Utensils, 
  Baby,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowLeft,
  Send
} from "lucide-react";
import { toast } from "sonner";

const Questionnaire = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mentalHealthResults, setMentalHealthResults] = useState<Record<string, any>>({});

  const questions = [
    {
      id: "mood",
      title: "How would you describe your mood today?",
      icon: Brain,
      type: "radio",
      options: [
        { value: "excellent", label: "Excellent - I feel great!" },
        { value: "good", label: "Good - Generally positive" },
        { value: "okay", label: "Okay - Neutral feelings" },
        { value: "low", label: "Low - Feeling down" },
        { value: "anxious", label: "Anxious - Worried or stressed" }
      ]
    },
    {
      id: "stress",
      title: "What is your stress level today?",
      icon: Brain,
      type: "radio",
      options: [
        { value: "low", label: "Low - Very relaxed" },
        { value: "mild", label: "Mild - Manageable stress" },
        { value: "moderate", label: "Moderate - Noticeable stress" },
        { value: "high", label: "High - Feeling overwhelmed" },
        { value: "severe", label: "Severe - Extremely stressed" }
      ]
    },
    {
      id: "sleep",
      title: "How was your sleep last night?",
      icon: Moon,
      type: "radio",
      options: [
        { value: "excellent", label: "Excellent - 7-9 hours, restful" },
        { value: "good", label: "Good - Mostly restful" },
        { value: "fair", label: "Fair - Some interruptions" },
        { value: "poor", label: "Poor - Frequent wake-ups" },
        { value: "terrible", label: "Terrible - Very little sleep" }
      ]
    },
    {
      id: "nutrition",
      title: "How would you rate your nutrition today?",
      icon: Utensils,
      type: "radio",
      options: [
        { value: "excellent", label: "Excellent - Balanced meals" },
        { value: "good", label: "Good - Mostly healthy choices" },
        { value: "fair", label: "Fair - Mixed healthy/unhealthy" },
        { value: "poor", label: "Poor - Mostly unhealthy" },
        { value: "skipped", label: "Skipped meals" }
      ]
    },
    {
      id: "postpartum",
      title: "Any postpartum concerns or symptoms?",
      icon: Baby,
      type: "textarea",
      placeholder: "Describe any physical or emotional concerns, changes, or symptoms you've noticed..."
    }
  ];

  const evaluateResponse = (questionId: string, response: string) => {
    const evaluations = {
      mood: {
        excellent: { status: "good", message: "Great emotional wellbeing!" },
        good: { status: "good", message: "Positive mood maintained" },
        okay: { status: "fair", message: "Stable but could improve" },
        low: { status: "warning", message: "Consider emotional support" },
        anxious: { status: "warning", message: "Anxiety detected - reach out for help" }
      },
      stress: {
        low: { status: "good", message: "Excellent stress management" },
        mild: { status: "good", message: "Normal stress levels" },
        moderate: { status: "fair", message: "Monitor stress levels" },
        high: { status: "warning", message: "High stress - consider relaxation techniques" },
        severe: { status: "critical", message: "Seek immediate support for stress" }
      },
      sleep: {
        excellent: { status: "good", message: "Optimal sleep quality" },
        good: { status: "good", message: "Good sleep pattern" },
        fair: { status: "fair", message: "Sleep could be improved" },
        poor: { status: "warning", message: "Sleep disruption noted" },
        terrible: { status: "critical", message: "Serious sleep concerns" }
      },
      nutrition: {
        excellent: { status: "good", message: "Excellent nutritional choices" },
        good: { status: "good", message: "Good dietary habits" },
        fair: { status: "fair", message: "Nutrition needs attention" },
        poor: { status: "warning", message: "Poor nutrition - consult nutritionist" },
        skipped: { status: "critical", message: "Missing meals is concerning" }
      }
    };

    return evaluations[questionId]?.[response] || { 
      status: "fair", 
      message: "Response noted for review" 
    };
  };

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    if (!responses[currentQuestion.id]) {
      toast.error("Please answer the current question before proceeding");
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = () => {
    // Evaluate all responses
    const evaluations = {};
    questions.forEach(question => {
      if (question.type === "radio" && responses[question.id]) {
        evaluations[question.id] = evaluateResponse(question.id, responses[question.id]);
      } else if (question.type === "textarea" && responses[question.id]) {
        evaluations[question.id] = { 
          status: "noted", 
          message: "Response recorded for clinical review" 
        };
      }
    });

    setMentalHealthResults(evaluations);
    setIsSubmitted(true);
    toast.success("Questionnaire submitted! Your responses have been evaluated.");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "bg-success/10 text-success border-success/20";
      case "fair": return "bg-warning/10 text-warning border-warning/20";
      case "warning": return "bg-warning/10 text-warning border-warning/20";
      case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good": return <CheckCircle2 className="h-4 w-4" />;
      case "warning": case "critical": return <AlertCircle className="h-4 w-4" />;
      case "fair": return <TrendingDown className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Questionnaire Complete</h1>
              <p className="text-muted-foreground">Your mental health status has been evaluated</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="card-maternal">
                  <CardHeader>
                    <CardTitle>Your Responses & Evaluation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {questions.map((question) => {
                      const Icon = question.icon;
                      const response = responses[question.id];
                      const evaluation = mentalHealthResults[question.id];
                      
                      if (!response) return null;
                      
                      return (
                        <div key={question.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">{question.title}</h3>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-2">Your Response:</p>
                            {question.type === "radio" ? (
                              <p className="font-medium">{question.options?.find(opt => opt.value === response)?.label}</p>
                            ) : (
                              <p className="font-medium bg-muted/30 p-2 rounded">{response}</p>
                            )}
                          </div>

                          {evaluation && (
                            <div className="flex items-center gap-2">
                              <Badge className={`flex items-center gap-1 ${getStatusColor(evaluation.status)}`}>
                                {getStatusIcon(evaluation.status)}
                                {evaluation.status === "good" ? "Good" : 
                                 evaluation.status === "fair" ? "Fair" :
                                 evaluation.status === "warning" ? "Attention Needed" :
                                 evaluation.status === "critical" ? "Urgent" : "Noted"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{evaluation.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate("/mother-dashboard")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => {
                    setIsSubmitted(false);
                    setCurrentStep(0);
                    setResponses({});
                    setMentalHealthResults({});
                  }}>
                    Take Again Tomorrow
                  </Button>
                </div>
              </div>

              <div>
                <Card className="card-maternal">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="font-semibold text-lg mb-2">Stay Strong</h3>
                      <p className="text-sm text-muted-foreground">You're doing great</p>
                    </div>
                    <div className="flex justify-center">
                      <div className="scale-75 origin-center">
                        <Hero3D />
                      </div>
                    </div>
                    <div className="text-center mt-4 p-4 bg-gradient-hero rounded-lg">
                      <p className="quote-maternal text-primary">
                        "Your wellbeing matters for both you and your baby"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const Icon = currentQuestion.icon;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="card-maternal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {currentQuestion.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {currentQuestion.type === "radio" ? (
                    <RadioGroup 
                      value={responses[currentQuestion.id] || ""} 
                      onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                    >
                      {currentQuestion.options?.map((option) => (
                        <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label 
                            htmlFor={option.value} 
                            className="flex-1 cursor-pointer font-medium"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="response">Your thoughts:</Label>
                      <Textarea
                        id="response"
                        placeholder={currentQuestion.placeholder}
                        value={responses[currentQuestion.id] || ""}
                        onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                        className="min-h-[120px] border-primary/20 focus:border-primary"
                      />
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    
                    {currentStep === questions.length - 1 ? (
                      <Button 
                        onClick={handleSubmit}
                        className="btn-hero"
                        disabled={!responses[currentQuestion.id]}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Questionnaire
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext}
                        className="btn-hero"
                        disabled={!responses[currentQuestion.id]}
                      >
                        Next Question
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="card-maternal">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg mb-2">Daily Check-in</h3>
                    <p className="text-sm text-muted-foreground">Your mental health matters</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="scale-75 origin-center">
                      <Hero3D />
                    </div>
                  </div>
                  <div className="text-center mt-4 p-4 bg-gradient-hero rounded-lg">
                    <p className="quote-maternal text-primary">
                      "Taking time to check in with yourself is an act of self-care"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;