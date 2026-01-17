import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Receipt, Home, Car, GraduationCap, Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const LOAN_TYPES = [
  { value: "home", label: "Home Loan", icon: Home },
  { value: "car", label: "Car Loan", icon: Car },
  { value: "personal", label: "Personal Loan", icon: Wallet },
  { value: "education", label: "Education Loan", icon: GraduationCap },
  { value: "gold", label: "Gold Loan", icon: Receipt },
  { value: "other", label: "Other Loan", icon: Receipt },
];

const LENDERS = [
  "HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra",
  "Bajaj Finance", "HDFC Ltd", "LIC Housing", "PNB Housing", "Tata Capital", "Other"
];

export default function Loans() {
  const { token } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [activeTab, setActiveTab] = useState("taken");

  const [formData, setFormData] = useState({
    loan_type: "home",
    lender: "",
    loan_account_number: "",
    principal: "",
    interest_rate: "",
    tenure_months: "",
    emi_amount: "",
    start_date: "",
    outstanding_principal: "",
    total_interest_paid: "",
    is_given: false,
    borrower_name: "",
  });

  useEffect(() => { fetchLoans(); }, [token]);

  const fetchLoans = async () => {
    try {
      const res = await axios.get(`${API}/loans?token=${token}`);
      setLoans(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        principal: parseFloat(formData.principal) || 0,
        interest_rate: parseFloat(formData.interest_rate) || 0,
        tenure_months: parseInt(formData.tenure_months) || 0,
        emi_amount: parseFloat(formData.emi_amount) || 0,
        outstanding_principal: formData.outstanding_principal ? parseFloat(formData.outstanding_principal) : null,
        total_interest_paid: parseFloat(formData.total_interest_paid) || 0,
        is_given: activeTab === "given",
      };
      if (editingLoan) {
        await axios.put(`${API}/loans/${editingLoan.id}?token=${token}`, data);
        toast.success("Loan updated");
      } else {
        await axios.post(`${API}/loans?token=${token}`, data);
        toast.success("Loan added");
      }
      setShowDialog(false);
      setEditingLoan(null);
      resetForm();
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setActiveTab(loan.is_given ? "given" : "taken");
    setFormData({
      loan_type: loan.loan_type,
      lender: loan.lender,
      loan_account_number: loan.loan_account_number || "",
      principal: loan.principal?.toString() || "",
      interest_rate: loan.interest_rate?.toString() || "",
      tenure_months: loan.tenure_months?.toString() || "",
      emi_amount: loan.emi_amount?.toString() || "",
      start_date: loan.start_date || "",
      outstanding_principal: loan.outstanding_principal?.toString() || "",
      total_interest_paid: loan.total_interest_paid?.toString() || "",
      is_given: loan.is_given,
      borrower_name: loan.borrower_name || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this loan?")) return;
    try {
      await axios.delete(`${API}/loans/${id}?token=${token}`);
      toast.success("Loan deleted");
      fetchLoans();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      loan_type: "home",
      lender: "",
      loan_account_number: "",
      principal: "",
      interest_rate: "",
      tenure_months: "",
      emi_amount: "",
      start_date: "",
      outstanding_principal: "",
      total_interest_paid: "",
      is_given: false,
      borrower_name: "",
    });
  };

  const loansTaken = loans.filter(l => !l.is_given);
  const loansGiven = loans.filter(l => l.is_given);
  
  const totalLiability = loansTaken.reduce((sum, l) => sum + (l.outstanding_principal || l.principal || 0), 0);
  const totalReceivable = loansGiven.reduce((sum, l) => sum + (l.outstanding_principal || l.principal || 0), 0);
  const totalEMI = loansTaken.reduce((sum, l) => sum + (l.emi_amount || 0), 0);

  const getLoanIcon = (type) => {
    const loan = LOAN_TYPES.find(l => l.value === type);
    return loan?.icon || Receipt;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-gray-500 text-sm mt-1">Manage loans taken and given</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingLoan(null); setShowDialog(true); }}>
          <Plus size={16} className="mr-2" />Add Loan
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight size={16} className="text-rose-600" />
            <p className="text-sm text-gray-500">Loans Taken</p>
          </div>
          <p className="text-2xl font-mono font-bold text-rose-600">{formatCurrency(totalLiability)}</p>
        </div>
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-emerald-600" />
            <p className="text-sm text-gray-500">Loans Given</p>
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(totalReceivable)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Monthly EMI</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatCurrency(totalEMI)}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="taken" className="flex items-center gap-2">
            <ArrowDownRight size={14} />
            Loans Taken ({loansTaken.length})
          </TabsTrigger>
          <TabsTrigger value="given" className="flex items-center gap-2">
            <ArrowUpRight size={14} />
            Loans Given ({loansGiven.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taken" className="mt-6">
          {loansTaken.length === 0 ? (
            <div className="card-surface p-12 text-center">
              <Receipt size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No loans taken</h3>
              <p className="text-gray-500 mb-4">Add your home loan, car loan, or any other loans</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loansTaken.map((loan) => {
                const Icon = getLoanIcon(loan.loan_type);
                const outstanding = loan.outstanding_principal || loan.principal;
                const progress = loan.principal > 0 ? ((loan.principal - outstanding) / loan.principal * 100) : 0;
                return (
                  <div key={loan.id} className="card-surface p-5 group hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center">
                          <Icon size={20} className="text-rose-600" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">{loan.loan_type} Loan</h3>
                          <p className="text-xs text-gray-500">{loan.lender}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(loan)}>
                          <Edit2 size={14} className="text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(loan.id)}>
                          <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Outstanding</span>
                        <span className="font-mono text-rose-600">{formatCurrency(outstanding)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{progress.toFixed(0)}% paid</span>
                        <span>of {formatCurrency(loan.principal)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">EMI</p>
                        <p className="font-mono text-sm">{formatCurrency(loan.emi_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Rate</p>
                        <p className="font-mono text-sm">{loan.interest_rate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tenure</p>
                        <p className="font-mono text-sm">{loan.tenure_months} mo</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="given" className="mt-6">
          {loansGiven.length === 0 ? (
            <div className="card-surface p-12 text-center">
              <ArrowUpRight size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No loans given</h3>
              <p className="text-gray-500 mb-4">Track money you've lent to others</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loansGiven.map((loan) => (
                <div key={loan.id} className="card-surface p-5 group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{loan.borrower_name || loan.lender}</h3>
                      <p className="text-xs text-gray-500">{loan.start_date}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(loan)}>
                        <Edit2 size={14} className="text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(loan.id)}>
                        <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">Outstanding</p>
                    <p className="text-xl font-mono font-semibold text-emerald-600">
                      {formatCurrency(loan.outstanding_principal || loan.principal)}
                    </p>
                    {loan.interest_rate > 0 && (
                      <p className="text-xs text-gray-500 mt-1">@ {loan.interest_rate}% p.a.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLoan ? "Edit Loan" : `Add Loan ${activeTab === "given" ? "Given" : "Taken"}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "given" ? (
              <div>
                <Label>Borrower Name</Label>
                <Input value={formData.borrower_name} onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })} className="mt-1" placeholder="Person you lent to" required />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loan Type</Label>
                  <Select value={formData.loan_type} onValueChange={(val) => setFormData({ ...formData, loan_type: val })}>
                    <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lender</Label>
                  <Select value={formData.lender} onValueChange={(val) => setFormData({ ...formData, lender: val })}>
                    <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {LENDERS.map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Principal Amount (₹)</Label>
                <Input type="number" step="1" value={formData.principal} onChange={(e) => setFormData({ ...formData, principal: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Interest Rate (% p.a.)</Label>
                <Input type="number" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} className="mt-1 font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tenure (months)</Label>
                <Input type="number" value={formData.tenure_months} onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>EMI Amount (₹)</Label>
                <Input type="number" step="1" value={formData.emi_amount} onChange={(e) => setFormData({ ...formData, emi_amount: e.target.value })} className="mt-1 font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label>Outstanding Principal (₹)</Label>
                <Input type="number" step="1" value={formData.outstanding_principal} onChange={(e) => setFormData({ ...formData, outstanding_principal: e.target.value })} className="mt-1 font-mono" placeholder="Current outstanding" />
              </div>
            </div>

            {activeTab === "taken" && (
              <div>
                <Label>Total Interest Paid (₹)</Label>
                <Input type="number" step="1" value={formData.total_interest_paid} onChange={(e) => setFormData({ ...formData, total_interest_paid: e.target.value })} className="mt-1 font-mono" placeholder="For tax calculation" />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingLoan ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
