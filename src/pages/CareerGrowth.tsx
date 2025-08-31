import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { 
  Sparkles, 
  Target, 
  Clock, 
  User, 
  BookOpen, 
  Award, 
  Calendar,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Building2,
  Briefcase
} from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import AnalysisLoading from "@/components/AnalysisLoading";

type Plan = {
  topics: string[];
  courses: Array<{ title: string; provider: string; url: string }>;
  certifications: string[];
  timeline: Array<{ week: number; focus: string }>;
  summary: string;
};

// Comprehensive career data structure
const CAREER_DATA = {
  "Technology": {
    "Software Engineering": [
      "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile Developer (iOS)",
      "Mobile Developer (Android)", "DevOps Engineer", "Site Reliability Engineer", "Software Architect",
      "Technical Lead", "Engineering Manager", "QA Engineer", "Test Automation Engineer",
      "Embedded Software Engineer", "GraphQL Engineer", "Platform Engineer", "Staff Software Engineer",
      "Principal Engineer"
    ],
    "Data & Analytics": [
      "Data Scientist", "Data Analyst", "Data Engineer", "Machine Learning Engineer",
      "AI Research Scientist", "Business Intelligence Analyst", "Analytics Manager", "Chief Data Officer",
      "MLOps Engineer", "Computer Vision Engineer", "NLP Engineer", "Applied Scientist"
    ],
    "Product & Design": [
      "Product Manager", "Senior Product Manager", "Product Owner", "UX Designer",
      "UI Designer", "UX Researcher", "Product Designer", "Design Systems Lead",
      "Head of Product", "Director of Product", "Product Operations Manager"
    ],
    "Cybersecurity": [
      "Security Analyst", "Penetration Tester", "Security Engineer", "CISO",
      "Incident Response Specialist", "Security Architect", "Compliance Manager", "Ethical Hacker",
      "GRC Analyst", "Application Security Engineer", "Cloud Security Engineer", "Threat Intelligence Analyst"
    ],
    "Cloud & Infrastructure": [
      "Cloud Architect", "AWS Solutions Architect", "Azure Engineer", "GCP Engineer",
      "Kubernetes Engineer", "Infrastructure Engineer", "Platform Engineer", "Cloud Security Engineer",
      "Site Reliability Engineer", "Linux Systems Engineer", "Network Engineer (Cloud)"
    ]
  },
  "Information Technology (IT)": {
    "IT Support & Service Desk": [
      "IT Support Specialist", "Help Desk Technician", "Desktop Support Technician",
      "IT Service Desk Analyst", "Field Service Technician", "End-User Support Engineer",
      "IT Support Manager"
    ],
    "Systems & Networks": [
      "Systems Administrator", "Senior Systems Administrator", "Windows Server Administrator",
      "Linux Systems Administrator", "Network Administrator", "Network Engineer",
      "Network Operations Center (NOC) Engineer", "VoIP Engineer"
    ],
    "Cloud & Virtualization": [
      "Cloud Administrator", "Cloud Engineer (AWS)", "Cloud Engineer (Azure)", "Cloud Engineer (GCP)",
      "Virtualization Engineer (VMware)", "Citrix Engineer", "Cloud Solutions Architect"
    ],
    "IT Security & Governance": [
      "Information Security Analyst", "SOC Analyst", "IT Auditor", "IT Compliance Analyst",
      "GRC (Governance, Risk, Compliance) Specialist", "Identity & Access Management (IAM) Engineer",
      "Security Operations Engineer"
    ],
    "Databases & Storage": [
      "Database Administrator (DBA)", "SQL Server DBA", "Oracle DBA", "MySQL/MariaDB DBA",
      "NoSQL Administrator (MongoDB/Cassandra)", "Storage Engineer (SAN/NAS)"
    ],
    "Enterprise Applications": [
      "ERP Consultant (SAP/Oracle)", "Salesforce Administrator", "Salesforce Developer",
      "Dynamics 365 Consultant", "Workday Analyst", "NetSuite Administrator", "ServiceNow Developer"
    ],
    "IT Service Management (ITSM)": [
      "ITSM Process Owner", "Change Manager", "Incident Manager", "Problem Manager",
      "Configuration Manager (CMDB)", "Service Catalog Manager"
    ],
    "Collaboration & Productivity": [
      "M365 Administrator", "Google Workspace Administrator", "SharePoint Administrator",
      "Messaging Engineer (Exchange/Email)", "Unified Communications Engineer"
    ],
    "IT Architecture": [
      "Solutions Architect", "Enterprise Architect", "Infrastructure Architect",
      "Security Architect (IT)", "Integration Architect"
    ]
  },
  "Business & Management (MBA)": {
    "Strategy & Corporate Development": [
      "Strategy Analyst", "Strategy Manager", "Corporate Development Associate",
      "Corporate Development Manager", "M&A Analyst", "M&A Manager", "Chief Strategy Officer"
    ],
    "Operations & Program Management": [
      "Operations Analyst", "Operations Manager", "Director of Operations",
      "Program Manager", "Project Manager (PMP)", "PMO Lead", "Business Operations Manager"
    ],
    "Product Management": [
      "Associate Product Manager", "Product Manager", "Senior Product Manager",
      "Group Product Manager", "Director of Product", "Head of Product", "Chief Product Officer"
    ],
    "Marketing & Growth": [
      "Product Marketing Manager", "Growth Marketing Manager", "Brand Manager",
      "Head of Marketing", "CMO", "Performance Marketing Manager", "Lifecycle Marketing Manager"
    ],
    "Finance & FP&A": [
      "FP&A Analyst", "FP&A Manager", "Corporate Finance Manager",
      "Controller", "Finance Director", "CFO", "Revenue Operations (RevOps) Manager"
    ],
    "Business Analytics & Insights": [
      "Business Analyst", "Senior Business Analyst", "Insights Manager",
      "BI Product Owner", "Analytics Translator", "Pricing Strategy Manager"
    ],
    "Entrepreneurship & Venture": [
      "Founder", "Startup Operator", "Venture Associate", "Venture Partner",
      "Accelerator Program Manager", "Entrepreneur in Residence (EIR)"
    ],
    "General Management & Leadership": [
      "General Manager", "Business Unit Manager", "P&L Owner",
      "Country Manager", "Regional Director", "Chief of Staff"
    ],
    "Supply Chain & Procurement": [
      "Supply Chain Analyst", "Supply Chain Manager", "Demand Planning Manager",
      "S&OP Manager", "Procurement Manager", "Category Manager", "Logistics Manager"
    ],
    "Customer & Commercial": [
      "Business Development Manager", "Partnerships Manager", "Account Manager",
      "Key Account Director", "Customer Success Manager", "Head of Customer Success"
    ]
  },
  "People & HR": {
    "Talent Acquisition": [
      "Recruiter", "Senior Recruiter", "Technical Recruiter",
      "Talent Acquisition Partner", "TA Manager", "Head of Talent Acquisition", "Campus Recruiter"
    ],
    "HR Operations": [
      "HR Coordinator", "HR Generalist", "HR Operations Manager",
      "HRIS Analyst", "People Operations Manager", "HR Administrator"
    ],
    "Total Rewards": [
      "Compensation Analyst", "Benefits Analyst", "Comp & Ben Manager",
      "Global Mobility Specialist", "Payroll Manager"
    ],
    "Learning & Development": [
      "L&D Specialist", "Instructional Designer", "Training Manager",
      "Leadership Development Manager", "Organizational Development (OD) Consultant"
    ],
    "HR Business Partner": [
      "Associate HRBP", "HR Business Partner", "Senior HRBP",
      "Director, HRBP", "People Partner Lead"
    ],
    "Employee Relations": [
      "Employee Relations Specialist", "ER Manager", "HR Compliance Manager",
      "Labor Relations Specialist"
    ],
    "People Analytics": [
      "People Data Analyst", "Workforce Planning Analyst", "People Analytics Manager",
      "HR Metrics & Insights Lead"
    ],
    "Employer Brand & DEI": [
      "Employer Branding Specialist", "Diversity & Inclusion Specialist",
      "DEI Program Manager", "Head of DEI"
    ],
    "People Systems": [
      "Workday HRIS Analyst", "SAP SuccessFactors Analyst", "BambooHR Administrator",
      "Greenhouse Admin", "Lever Admin"
    ]
  },
  "Healthcare": {
    "Clinical Care": [
      "Registered Nurse", "ICU Nurse", "Emergency Room Nurse", "Pediatric Nurse",
      "Physician Assistant", "Nurse Practitioner", "Clinical Specialist", "Charge Nurse"
    ],
    "Medical Practice": [
      "Family Medicine Physician", "Cardiologist", "Pediatrician", "Surgeon",
      "Radiologist", "Anesthesiologist", "Emergency Medicine Physician", "Psychiatrist"
    ],
    "Healthcare Administration": [
      "Healthcare Administrator", "Medical Office Manager", "Health Information Manager",
      "Healthcare Quality Manager", "Patient Care Coordinator", "Healthcare Consultant"
    ],
    "Allied Health": [
      "Physical Therapist", "Occupational Therapist", "Respiratory Therapist",
      "Medical Technologist", "Pharmacy Technician", "Radiology Technician"
    ]
  },
  "Finance": {
    "Investment & Banking": [
      "Investment Banker", "Financial Analyst", "Portfolio Manager", "Wealth Manager",
      "Investment Advisor", "Risk Analyst", "Equity Research Analyst", "Trader"
    ],
    "Corporate Finance": [
      "Financial Planning & Analysis Manager", "Corporate Development Manager", "Treasury Analyst",
      "Controller", "CFO", "Financial Reporting Manager", "Budget Analyst"
    ],
    "Insurance": [
      "Actuary", "Underwriter", "Claims Adjuster", "Insurance Agent",
      "Risk Manager", "Insurance Broker", "Product Manager (Insurance)"
    ],
    "Fintech": [
      "Fintech Product Manager", "Blockchain Developer", "Quantitative Analyst",
      "Compliance Officer", "Fintech Sales Manager", "Payment Systems Engineer"
    ]
  },
  "Marketing & Sales": {
    "Digital Marketing": [
      "Digital Marketing Manager", "SEO Specialist", "PPC Manager", "Social Media Manager",
      "Content Marketing Manager", "Email Marketing Specialist", "Growth Hacker", "Marketing Analyst"
    ],
    "Sales": [
      "Sales Representative", "Account Executive", "Sales Manager", "Business Development Manager",
      "Inside Sales Representative", "Sales Engineer", "Customer Success Manager", "VP of Sales"
    ],
    "Brand & Creative": [
      "Brand Manager", "Creative Director", "Graphic Designer", "Copywriter",
      "Art Director", "Marketing Creative Manager", "Brand Strategist"
    ],
    "Marketing Operations": [
      "Marketing Operations Manager", "CRM Manager", "Marketing Automation Specialist",
      "Marketing Data Analyst", "Campaign Manager", "Marketing Technology Manager"
    ]
  },
  "Education": {
    "K-12 Teaching": [
      "Elementary School Teacher", "Middle School Teacher", "High School Teacher",
      "Special Education Teacher", "ESL Teacher", "Math Teacher", "Science Teacher", "English Teacher"
    ],
    "Higher Education": [
      "Professor", "Associate Professor", "Adjunct Professor", "Research Scientist",
      "Academic Advisor", "Dean", "University Administrator", "Librarian"
    ],
    "Educational Leadership": [
      "Principal", "Assistant Principal", "Superintendent", "Curriculum Director",
      "Instructional Coordinator", "Education Consultant", "School Counselor"
    ],
    "Educational Technology": [
      "Instructional Designer", "Educational Technology Specialist", "E-Learning Developer",
      "Learning Management System Administrator", "Educational Software Developer"
    ]
  },
  "Culinary & Hospitality": {
    "Kitchen Operations": [
      "Line Cook", "Sous Chef", "Head Chef", "Executive Chef", "Pastry Chef",
      "Prep Cook", "Kitchen Manager", "Culinary Director", "Private Chef"
    ],
    "Restaurant Management": [
      "Restaurant Manager", "General Manager", "Assistant Manager", "Floor Manager",
      "Food & Beverage Director", "Restaurant Owner", "Franchise Manager"
    ],
    "Hotel & Resort": [
      "Hotel Manager", "Front Desk Manager", "Concierge", "Event Coordinator",
      "Housekeeping Manager", "Resort Manager", "Guest Services Manager"
    ],
    "Food Service": [
      "Catering Manager", "Banquet Manager", "Food Service Director",
      "Cafeteria Manager", "Food Safety Inspector", "Menu Developer"
    ]
  },
  "Manufacturing & Engineering": {
    "Mechanical Engineering": [
      "Mechanical Engineer", "Design Engineer", "Manufacturing Engineer", "Quality Engineer",
      "Project Engineer", "R&D Engineer", "Process Engineer", "Plant Manager",
      "HVAC Engineer", "Automotive Engineer", "Robotics Engineer"
    ],
    "Electrical Engineering": [
      "Electrical Engineer", "Electronics Engineer", "Power Systems Engineer",
      "Control Systems Engineer", "Instrumentation Engineer", "Automation Engineer",
      "Embedded Systems Engineer", "Analog Design Engineer", "FPGA Engineer"
    ],
    "Civil Engineering": [
      "Civil Engineer", "Structural Engineer", "Transportation Engineer", "Environmental Engineer",
      "Construction Manager", "Project Manager", "Site Engineer", "Geotechnical Engineer",
      "Water Resources Engineer", "Urban Planner"
    ],
    "Chemical Engineering": [
      "Chemical Engineer", "Process Engineer (Chemical)", "Materials Engineer (Polymer/Chemical)",
      "Production Engineer (Chemicals)", "Environmental Process Engineer"
    ],
    "Industrial & Systems Engineering": [
      "Industrial Engineer", "Operations Engineer", "Lean Six Sigma Engineer",
      "Quality Systems Engineer", "Supply Chain Engineer", "Reliability Engineer"
    ],
    "Aerospace Engineering": [
      "Aerospace Engineer", "Avionics Engineer", "Flight Test Engineer", "Propulsion Engineer",
      "Airworthiness Engineer", "Space Systems Engineer"
    ],
    "Materials & Biomedical": [
      "Materials Scientist", "Metallurgical Engineer", "Biomedical Engineer",
      "Medical Device Engineer", "Biomechanics Engineer"
    ],
    "Nuclear & Energy": [
      "Nuclear Engineer", "Reactor Operator", "Safety Engineer (Nuclear)",
      "Renewable Energy Engineer", "Energy Systems Engineer"
    ],
    "Robotics & Mechatronics": [
      "Mechatronics Engineer", "Robotics Engineer", "Automation Controls Engineer",
      "Motion Control Engineer", "Autonomous Systems Engineer"
    ]
  },
  "Operations & Supply Chain": {
    "Operations": [
      "Operations Coordinator", "Operations Analyst", "Operations Manager",
      "Senior Operations Manager", "Director of Operations", "COO"
    ],
    "Supply Chain": [
      "Supply Chain Analyst", "Demand Planner", "Supply Planner", "S&OP Planner",
      "Logistics Coordinator", "Logistics Manager", "Warehouse Operations Manager"
    ],
    "Procurement": [
      "Procurement Specialist", "Sourcing Specialist", "Category Manager",
      "Procurement Manager", "Vendor Manager", "Supplier Quality Manager"
    ]
  },
  "Consulting": {
    "Management Consulting": [
      "Associate Consultant", "Consultant", "Senior Consultant",
      "Engagement Manager", "Principal", "Partner"
    ],
    "Technology Consulting": [
      "Technology Consultant", "Digital Transformation Consultant", "Cloud Consultant",
      "Data & Analytics Consultant", "CRM Consultant", "ERP Consultant"
    ],
    "Operations Consulting": [
      "Operations Consultant", "Lean Consultant", "Supply Chain Consultant",
      "Process Improvement Consultant"
    ],
    "Human Capital Consulting": [
      "HR Transformation Consultant", "Org Design Consultant", "Change Management Consultant",
      "People Analytics Consultant"
    ]
  },
  "Legal": {
    "Corporate Law": [
      "Corporate Lawyer", "Contract Attorney", "Compliance Officer", "Legal Counsel",
      "Mergers & Acquisitions Attorney", "Securities Lawyer", "In-House Counsel"
    ],
    "Litigation": [
      "Litigation Attorney", "Trial Lawyer", "Personal Injury Lawyer", "Criminal Defense Attorney",
      "Civil Rights Attorney", "Employment Lawyer", "Family Law Attorney"
    ],
    "Specialized Practice": [
      "Intellectual Property Attorney", "Tax Attorney", "Real Estate Attorney",
      "Immigration Lawyer", "Environmental Lawyer", "Healthcare Attorney"
    ],
    "Legal Support": [
      "Paralegal", "Legal Assistant", "Court Reporter", "Legal Secretary",
      "Law Clerk", "Legal Research Assistant", "Compliance Specialist"
    ]
  }
};

export default function CareerGrowth() {
  const [about, setAbout] = useState("");
  const [dreamRole, setDreamRole] = useState("");
  const [weeks, setWeeks] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string>("mid");
  const [yearsExperience, setYearsExperience] = useState<number>(2);
  const [hoursPerWeek, setHoursPerWeek] = useState<number[]>([8]);

  // New structured input states
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [targetCompany, setTargetCompany] = useState<string>("");
  const [inputMode, setInputMode] = useState<"structured" | "freeform">("structured");

  const generateCareerPlan = useAction(api.aiCareerGrowth.generateCareerPlan);

  // Get available subcategories based on selected field
  const availableSubcategories = useMemo(() => {
    if (!selectedField || !CAREER_DATA[selectedField as keyof typeof CAREER_DATA]) return [];
    return Object.keys(CAREER_DATA[selectedField as keyof typeof CAREER_DATA]);
  }, [selectedField]);

  // Get available roles based on selected subcategory
  const availableRoles = useMemo(() => {
    if (!selectedField || !selectedSubcategory) return [];
    const fieldData = CAREER_DATA[selectedField as keyof typeof CAREER_DATA];
    if (!fieldData || !fieldData[selectedSubcategory as keyof typeof fieldData]) return [];
    return fieldData[selectedSubcategory as keyof typeof fieldData];
  }, [selectedField, selectedSubcategory]);

  // Construct final dream role string
  const finalDreamRole = useMemo(() => {
    if (inputMode === "freeform") return dreamRole;
    
    let role = selectedRole;
    if (targetCompany.trim()) {
      role += ` at ${targetCompany.trim()}`;
    }
    return role;
  }, [inputMode, dreamRole, selectedRole, targetCompany]);

  const disabled = useMemo(() => {
    if (inputMode === "structured") {
      return !selectedRole.trim() && !about.trim();
    }
    return !dreamRole.trim() && !about.trim();
  }, [inputMode, selectedRole, dreamRole, about]);

  // Reset subcategory and role when field changes
  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    setSelectedSubcategory("");
    setSelectedRole("");
  };

  // Reset role when subcategory changes
  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    setSelectedRole("");
  };

  async function generatePlan() {
    const roleToUse = finalDreamRole;
    
    if (!roleToUse.trim() && !about.trim()) {
      toast.error("Please provide either your dream role or background information");
      return;
    }

    setLoading(true);
    try {
      const result = await generateCareerPlan({
        about: about.trim(),
        dreamRole: roleToUse,
        weeks,
        currentLevel,
        yearsExperience,
        hoursPerWeek: hoursPerWeek[0],
      });
      
      setPlan(result);
      toast.success("Your personalized career roadmap is ready!");
    } catch (error) {
      console.error("Error generating career plan:", error);
      toast.error("Failed to generate career plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <AnalysisLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Craft Your Career Roadmap
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get an AI-powered, personalized learning path tailored to your dream role, 
            complete with courses, certifications, and a week-by-week timeline.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl">Tell Us About Your Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Input Mode Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Target className="w-4 h-4" />
                      Choose Your Input Method
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={inputMode === "structured" ? "default" : "outline"}
                        onClick={() => setInputMode("structured")}
                        className="flex-1"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Guided Selection
                      </Button>
                      <Button
                        variant={inputMode === "freeform" ? "default" : "outline"}
                        onClick={() => setInputMode("freeform")}
                        className="flex-1"
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Free Form
                      </Button>
                    </div>
                  </div>

                  {/* Dream Role & Background */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Target className="w-4 h-4" />
                      Your Aspirations
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {inputMode === "structured" ? (
                        <motion.div
                          key="structured"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="field">Field</Label>
                              <Select value={selectedField} onValueChange={handleFieldChange}>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select a field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.keys(CAREER_DATA).map((field) => (
                                    <SelectItem key={field} value={field}>
                                      {field}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="subcategory">Subcategory</Label>
                              <Select 
                                value={selectedSubcategory} 
                                onValueChange={handleSubcategoryChange}
                                disabled={!selectedField}
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSubcategories.map((subcategory) => (
                                    <SelectItem key={subcategory} value={subcategory}>
                                      {subcategory}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="role">Specific Role</Label>
                            <Select 
                              value={selectedRole} 
                              onValueChange={setSelectedRole}
                              disabled={!selectedSubcategory}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select your target role" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="target-company">Target Company (Optional)</Label>
                            <Input
                              id="target-company"
                              placeholder="e.g., Google, Microsoft, Local Hospital..."
                              value={targetCompany}
                              onChange={(e) => setTargetCompany(e.target.value)}
                              className="h-12"
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="freeform"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="dream-role">Dream Role</Label>
                            <Input
                              id="dream-role"
                              placeholder="e.g., Senior Data Scientist at Google, Head Chef, UX Designer"
                              value={dreamRole}
                              onChange={(e) => setDreamRole(e.target.value)}
                              className="h-12"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="space-y-2">
                      <Label htmlFor="about">Your Background</Label>
                      <Textarea
                        id="about"
                        placeholder="Tell us about your current skills, experience, and what excites you about this career path..."
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Experience & Commitment */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="w-4 h-4" />
                      Your Current Level
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Experience Level</Label>
                        <Select value={currentLevel} onValueChange={setCurrentLevel}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student / Bootcamp</SelectItem>
                            <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                            <SelectItem value="mid">Mid-level (2-5 years)</SelectItem>
                            <SelectItem value="senior">Senior (5+ years)</SelectItem>
                            <SelectItem value="lead">Lead / Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <Input
                          type="number"
                          min={0}
                          max={50}
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timeline & Commitment */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Time Commitment
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Learning Timeline</Label>
                        <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 weeks (Intensive)</SelectItem>
                            <SelectItem value="8">8 weeks (Focused)</SelectItem>
                            <SelectItem value="12">12 weeks (Balanced)</SelectItem>
                            <SelectItem value="16">16 weeks (Comprehensive)</SelectItem>
                            <SelectItem value="24">24 weeks (Deep Dive)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Hours per week: {hoursPerWeek[0]}h</Label>
                        <div className="px-3">
                          <Slider
                            value={hoursPerWeek}
                            onValueChange={setHoursPerWeek}
                            max={40}
                            min={2}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>2h</span>
                            <span>40h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={generatePlan} 
                    disabled={disabled || loading}
                    className="w-full h-14 text-lg font-semibold"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate My Career Roadmap
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="career-plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Plan Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Your Personalized Career Roadmap</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">{plan.summary}</p>
                <Button 
                  variant="outline" 
                  onClick={() => setPlan(null)}
                  className="mt-4"
                >
                  Create New Plan
                </Button>
              </div>

              {/* Plan Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Topics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Key Learning Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {plan.topics.map((topic, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-primary">{i + 1}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{topic}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Courses */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Recommended Courses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {plan.courses.map((course, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-4 rounded-lg border hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-medium group-hover:text-primary transition-colors">
                                  {course.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">{course.provider}</p>
                              </div>
                              <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                              >
                                View Course
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Certifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Target Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {plan.certifications.map((cert, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="px-3 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                          >
                            {cert}
                          </motion.span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Weekly Timeline ({weeks} weeks)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {plan.timeline.map((week, i) => {
                          const lines = week.focus.split('\n').filter(Boolean);
                          return (
                            <AccordionItem key={week.week} value={`week-${week.week}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">{week.week}</span>
                                  </div>
                                  <span>Week {week.week}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-11 space-y-2">
                                  {lines.map((line, lineIndex) => (
                                    <div key={lineIndex} className="flex items-start gap-2 text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                                      <span className="leading-relaxed">{line.replace(/^[-•]\s*/, '')}</span>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}