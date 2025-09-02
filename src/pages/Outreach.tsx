import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Mail, MessageSquare, Rocket, Send, Calendar, Target, Users, Building2, Upload } from "lucide-react";

export default function OutreachPage() {
  const { isLoading, isAuthenticated } = useAuth();

  const contacts = useQuery(api.outreach.listContacts) ?? [];
  const targets = useQuery(api.outreach.listTargetCompanies) ?? [];
  const sequences = useQuery(api.outreach.listSequences) ?? [];

  const addContact = useMutation(api.outreach.addContact);
  const addTargetCompany = useMutation(api.outreach.addTargetCompany);
  const suggest = useQuery;
  const createSequence = useMutation(api.outreach.createOutreachSequence);
  const scheduleFollowUp = useMutation(api.outreach.scheduleFollowUp);
  const seed = useMutation(api.outreach.seedTestData);
  const sendEmail = useAction(api.outreachEmail.sendEmail); // add this line to get the action
  const generateContacts = useAction(api.outreach.generateContactsForCompany);
  const [finding, setFinding] = useState(false);

  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addTargetOpen, setAddTargetOpen] = useState(false);

  // ADD: CSV Importer state
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvDefaultCompany, setCsvDefaultCompany] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    company: "",
    title: "",
    connectionDegree: "2",
    relationshipStrength: "3",
  });

  const [newTarget, setNewTarget] = useState({
    companyName: "",
    targetRole: "",
    priority: "high",
  });

  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const suggestions = useQuery(api.outreach.suggestContactsForCompany, selectedCompany ? { companyName: selectedCompany } : "skip" as any) ?? [];

  const [composer, setComposer] = useState<{
    open: boolean;
    contact?: any;
    message?: { subject?: string; body: string; channel: "email" | "dm"; sequenceId?: string };
  }>({ open: false });

  const [sending, setSending] = useState(false);

  const selectedCompanyObj = useMemo(() => targets.find((t: any) => t.companyName === selectedCompany), [targets, selectedCompany]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container-responsive py-16">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Please sign in to use Outreach Engine.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-responsive py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Engine</h1>
          <p className="text-muted-foreground">Warm intros + reverse recruiting with referral likelihood scoring.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => {
            const res = await seed();
            toast(res === "already_seeded" ? "Sample data already present" : "Seeded sample contacts and a target company");
          }}>
            <Rocket className="h-4 w-4 mr-2" />
            Seed Sample Data
          </Button>
          <Button onClick={() => setAddContactOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
          <Button onClick={() => setAddTargetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Target Company
          </Button>
          {/* ADD: Import CSV button */}
          <Button variant="secondary" onClick={() => {
            setCsvDefaultCompany(selectedCompany || "");
            setImportOpen(true);
          }}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> Target Companies</CardTitle>
            <CardDescription>Pick a company to see your best warm intros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Select company..." />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t: any) => (
                  <SelectItem key={t._id} value={t.companyName}>{t.companyName} {t.targetRole ? `— ${t.targetRole}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Total targets: {targets.length}</div>
              {selectedCompany && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={finding}
                  onClick={async () => {
                    try {
                      setFinding(true);
                      const roleHint = selectedCompanyObj?.targetRole || undefined;
                      const res = await generateContacts({ companyName: selectedCompany, titleHint: roleHint, count: 5 } as any);
                      toast(`Added ${res?.inserted ?? 0} contacts for ${selectedCompany}`);
                    } catch (e: any) {
                      toast(e?.message || "Failed to find contacts. Check OpenRouter in Integrations.");
                    } finally {
                      setFinding(false);
                    }
                  }}
                >
                  {finding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                  Find Contacts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Suggested Warm Intros</CardTitle>
            <CardDescription>Ranked by referral likelihood for {selectedCompany || "..."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedCompany && <div className="text-sm text-muted-foreground">Choose a company to view suggestions.</div>}
            {selectedCompany && suggestions.length === 0 && (
              <div className="text-sm text-muted-foreground">No suggestions yet. Add contacts and try again.</div>
            )}
            <div className="space-y-3">
              {suggestions.map((s: any) => (
                <div key={s.contact._id} className="flex items-start justify-between border rounded-lg p-3 hover:bg-muted/40">
                  <div>
                    <div className="font-medium">{s.contact.name} <span className="text-xs text-muted-foreground">({s.contact.title || "—"})</span></div>
                    <div className="text-xs text-muted-foreground">
                      {s.contact.company || "Independent"} • {s.contact.email || "No email"} • {s.contact.connectionDegree}° • Strength {s.contact.relationshipStrength}/5
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      <Target className="inline h-4 w-4 mr-1 text-primary" />
                      {s.referralLikelihood}%
                    </span>
                    <Button
                      size="sm"
                      onClick={async () => {
                        const id = await createSequence({
                          contactId: s.contact._id,
                          companyName: selectedCompany,
                          targetRole: selectedCompanyObj?.targetRole,
                          channel: s.contact.email ? "email" : "dm",
                        });
                        toast("Outreach drafted");

                        // Build message content explicitly to avoid JSX parsing issues with long ternaries
                        const channel: "email" | "dm" = s.contact.email ? "email" : "dm";
                        const subject =
                          channel === "email"
                            ? `[Warm Intro] ${selectedCompanyObj?.targetRole || "a role"} @ ${selectedCompany}`
                            : undefined;

                        const firstName = s.contact.name?.split(" ")[0] || "there";
                        const messageBody =
                          channel === "email"
                            ? `Hi ${firstName},

Noticed you're at ${selectedCompany} — I'm exploring ${
                              selectedCompanyObj?.targetRole || "a role"
                            } opportunities there.
I've been working on outcomes like:
- [Add 1-2 quantified wins relevant to the team]
- [Add 1-2 relevant tools/stack highlights]

Would you be open to a quick 10-min chat or a referral if it feels like a fit?
Happy to share a concise resume and tailored summary. Appreciate it!

— you`
                            : `Hi ${firstName}, Noticed you're connected with folks at ${selectedCompany}. I'm exploring ${
                              selectedCompanyObj?.targetRole || "a role"
                            } there — could you point me to the right person for context or a quick intro? — you`;

                        setComposer({
                          open: true,
                          contact: s.contact,
                          message: {
                            subject,
                            body: messageBody,
                            channel,
                            sequenceId: id as any,
                          },
                        });
                      }}
                    >
                      Draft
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" /> Sequences & Follow-ups</CardTitle>
          <CardDescription>Track your outreach progress and next actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sequences.length === 0 && <div className="text-sm text-muted-foreground">No sequences yet. Draft one from suggestions.</div>}
          {sequences.map((seq: any) => (
            <div key={seq._id} className="border rounded-lg p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{seq.companyName} • {seq.targetRole || "Role"} — {seq.channel.toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">
                  Contact: {contacts.find((c: any) => c._id === seq.contactId)?.name || "Unknown"} • Likelihood {seq.referralLikelihood}% • Next follow-up: {seq.nextFollowUpAt ? new Date(seq.nextFollowUpAt).toLocaleDateString() : "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const in3days = Date.now() + 3 * 24 * 60 * 60 * 1000;
                    await scheduleFollowUp({ sequenceId: seq._id, nextFollowUpAt: in3days });
                    toast("Follow-up scheduled");
                  }}
                >
                  Schedule +3d
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Save someone who could help with intros or referrals.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="jane@company.com" type="email" />
            </div>
            <div>
              <Label>Company</Label>
              <Input value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={newContact.title} onChange={(e) => setNewContact({ ...newContact, title: e.target.value })} placeholder="Engineering Manager" />
            </div>
            <div>
              <Label>Connection Degree</Label>
              <Select value={newContact.connectionDegree} onValueChange={(v) => setNewContact({ ...newContact, connectionDegree: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st</SelectItem>
                  <SelectItem value="2">2nd</SelectItem>
                  <SelectItem value="3">3rd+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Relationship Strength</Label>
              <Select value={newContact.relationshipStrength} onValueChange={(v) => setNewContact({ ...newContact, relationshipStrength: v })}>
                <SelectTrigger><SelectValue placeholder="1-5" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContactOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!newContact.name) return toast("Name is required");
              await addContact({
                contact: {
                  name: newContact.name,
                  email: newContact.email || undefined,
                  company: newContact.company || undefined,
                  title: newContact.title || undefined,
                  connectionDegree: Number(newContact.connectionDegree) as 1 | 2 | 3,
                  relationshipStrength: Number(newContact.relationshipStrength),
                }
              });
              toast("Contact added");
              setAddContactOpen(false);
              setNewContact({ name: "", email: "", company: "", title: "", connectionDegree: "2", relationshipStrength: "3" });
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Target Dialog */}
      <Dialog open={addTargetOpen} onOpenChange={setAddTargetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Target Company</DialogTitle>
            <DialogDescription>Track a company and role you're aiming for.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label>Company Name</Label>
              <Input value={newTarget.companyName} onChange={(e) => setNewTarget({ ...newTarget, companyName: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div>
              <Label>Target Role (optional)</Label>
              <Input value={newTarget.targetRole} onChange={(e) => setNewTarget({ ...newTarget, targetRole: e.target.value })} placeholder="Senior Frontend Engineer" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={newTarget.priority} onValueChange={(v) => setNewTarget({ ...newTarget, priority: v })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTargetOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!newTarget.companyName) return toast("Company name is required");
              await addTargetCompany({ target: { companyName: newTarget.companyName, targetRole: newTarget.targetRole || undefined, priority: newTarget.priority as any } });
              toast("Target added");
              setAddTargetOpen(false);
              setNewTarget({ companyName: "", targetRole: "", priority: "high" });
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription>
              Upload or paste a CSV with headers: name, email, title, company, connectionDegree (1/2/3), relationshipStrength (1-5).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Default Company (used if company is missing in rows)</Label>
                <Input
                  value={csvDefaultCompany}
                  onChange={(e) => setCsvDefaultCompany(e.target.value)}
                  placeholder="Acme Corp"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Tip: This defaults to your selected target company when opening this dialog.
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label>Upload CSV File</Label>
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    setCsvText(text);
                    toast("CSV loaded");
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Or paste CSV here</Label>
                <textarea
                  className="w-full rounded-md border p-2 min-h-48 bg-background"
                  placeholder="name,email,title,company,connectionDegree,relationshipStrength
Jane Doe,jane@acme.com,Engineering Manager,Acme Corp,2,4"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              If a row is missing company, we'll use the Default Company above. If connectionDegree or relationshipStrength are missing, they default to 2 and 3.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button
              disabled={isImporting || !csvText.trim()}
              onClick={async () => {
                if (!csvText.trim()) return toast("Please upload or paste CSV");
                // lightweight CSV parser that handles quoted values with commas
                function parseCSV(text: string): Array<Record<string, string>> {
                  const rows: string[][] = [];
                  let row: string[] = [];
                  let cell = "";
                  let inQuotes = false;
                  const pushCell = () => { row.push(cell); cell = ""; };
                  for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (char === '"') {
                      if (inQuotes && text[i + 1] === '"') {
                        cell += '"';
                        i++;
                      } else {
                        inQuotes = !inQuotes;
                      }
                    } else if (char === "," && !inQuotes) {
                      pushCell();
                    } else if ((char === "\n" || char === "\r") && !inQuotes) {
                      if (cell.length > 0 || row.length > 0) pushCell();
                      if (row.length > 0) rows.push(row), row = [];
                    } else {
                      cell += char;
                    }
                  }
                  if (cell.length > 0 || row.length > 0) { pushCell(); rows.push(row); }
                  if (rows.length === 0) return [];
                  const header = rows[0].map((h) => h.trim());
                  const out: Array<Record<string, string>> = [];
                  for (let i = 1; i < rows.length; i++) {
                    const r = rows[i];
                    if (r.every((c) => !c || c.trim() === "")) continue;
                    const obj: Record<string, string> = {};
                    for (let j = 0; j < header.length; j++) {
                      obj[header[j]] = (r[j] ?? "").trim();
                    }
                    out.push(obj);
                  }
                  return out;
                }

                try {
                  setIsImporting(true);
                  const data = parseCSV(csvText);
                  if (data.length === 0) {
                    toast("No rows detected in CSV");
                    return;
                  }
                  let imported = 0;
                  for (const row of data) {
                    const name = row.name || row.fullName || row.Name || "";
                    const email = row.email || row.Email || "";
                    const title = row.title || row.Title || "";
                    const company = row.company || row.Company || csvDefaultCompany || selectedCompany || undefined;

                    const cdRaw = row.connectionDegree || row.degree || row.ConnectionDegree || "";
                    const rsRaw = row.relationshipStrength || row.RelationshipStrength || row.strength || "";

                    const connectionDegree = (Number(cdRaw) as 1 | 2 | 3) || 2;
                    const relationshipStrength = Number(rsRaw) || 3;

                    if (!name) continue; // require name
                    // email is optional in our schema

                    await addContact({
                      contact: {
                        name,
                        email: email || undefined,
                        company,
                        title: title || undefined,
                        connectionDegree: connectionDegree >= 1 && connectionDegree <= 3 ? connectionDegree : 2,
                        relationshipStrength: relationshipStrength >= 1 && relationshipStrength <= 5 ? relationshipStrength : 3,
                      }
                    });
                    imported++;
                  }
                  toast(`Imported ${imported} contact${imported === 1 ? "" : "s"}`);
                  setImportOpen(false);
                  setCsvText("");
                } catch (e: any) {
                  toast(e?.message || "Failed to import CSV");
                } finally {
                  setIsImporting(false);
                }
              }}
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Composer */}
      <Dialog open={composer.open} onOpenChange={(open) => setComposer((c) => ({ ...c, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Outreach Draft</DialogTitle>
            <DialogDescription>Review and send your outreach.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">To: <span className="font-medium">{composer.contact?.name}</span> {composer.contact?.email ? `• ${composer.contact.email}` : ""}</div>
            {composer.message?.channel === "email" && (
              <div>
                <Label>Subject</Label>
                <Input value={composer.message?.subject || ""} onChange={(e) => setComposer((c) => c.message ? ({ ...c, message: { ...c.message, subject: e.target.value } }) : c)} />
              </div>
            )}
            <div>
              <Label>Message</Label>
              <textarea
                className="w-full rounded-md border p-2 min-h-48 bg-background"
                value={composer.message?.body || ""}
                onChange={(e) => setComposer((c) => c.message ? ({ ...c, message: { ...c.message, body: e.target.value } }) : c)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposer({ open: false })}>Close</Button>
            <Button
              disabled={sending || !composer.message}
              onClick={async () => {
                if (!composer.message) return;
                if (composer.message.channel === "email") {
                  if (!composer.contact?.email) {
                    return toast("This contact has no email");
                  }
                  try {
                    setSending(true);
                    await sendEmail({
                      to: composer.contact.email,
                      subject: composer.message.subject || "[No subject]",
                      body: composer.message.body,
                    });
                    toast("Email sent successfully");
                    setComposer({ open: false });
                  } catch (err: any) {
                    toast(err?.message || "Failed to send email. Check Resend integration in Integrations.");
                  } finally {
                    setSending(false);
                  }
                } else {
                  toast("DM text copied to clipboard");
                  await navigator.clipboard.writeText(composer.message.body);
                }
              }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (composer.message?.channel === "email" ? <Send className="h-4 w-4 mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />)}
              {composer.message?.channel === "email" ? "Send Email" : "Copy DM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}