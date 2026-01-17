import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Calculator, Shield, Home, GraduationCap, Heart, Percent, CheckCircle, AlertCircle } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const TAX_SECTIONS = [
  { value: "80C", label: "Section 80C", limit: 150000, description: "PPF, ELSS, LIC, FD (5yr), EPF" },
  { value: "80D", label: "Section 80D", limit: 75000, description: "Health Insurance Premiums" },
  { value: "80E", label: "Section 80E", limit: null, description: "Education Loan Interest" },
  { value: "24b", label: "Section 24(b)", limit: 200000, description: "Home Loan Interest" },
  { value: "80G", label: "Section 80G", limit: null, description: "Donations to Charitable Trusts" },
  { value: "80TTA", label: "Section 80TTA", limit: 10000, description: "Savings Bank Interest" },
  { value: "80CCD", label: "Section 80CCD(1B)", limit: 50000, description: "NPS Additional Contribution" },
];

const getSectionIcon = (section) => {
  switch (section) {
    case "80C": return Shield;
    case "80D": return Heart;
    case "80E": return GraduationCap;
    case "24b": return Home;
    default: return Calculator;
  }
};

export default function TaxPlanning() {
  const { token } = useAuth();
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2024-25");

  const [formData, setFormData] = useState({
    financial_year: "2024-25",
    section: "80C",
    description: "",
    amount: "",
    proof_available: false,
  });

  const FINANCIAL_YEARS = ["2024-25", "2023-24", "2022-23"];

  useEffect(() => { fetchTaxSummary(); }, [token, selectedYear]);

  const fetchTaxSummary = async () => {
    try {
      const res = await axios.get(`${API}/reports/tax-summary?financial_year=${selectedYear}&token=${token}`);
      setTaxData(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      };
      await axios.post(`${API}/tax-deductions?token=${token}`, data);
      toast.success("Deduction added");
      setShowDialog(false);
      resetForm();
      fetchTaxSummary();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const resetForm = () => {
    setFormData({
      financial_year: selectedYear,
      section: "80C",
      description: "",
      amount: "",
      proof_available: false,
    });
  };

  const getSectionConfig = (section) => TAX_SECTIONS.find(s => s.value === section);

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="tax-planning-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Planning</h1>
          <p className="text-gray-500 text-sm mt-1">Track deductions and optimize your taxes</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px] bg-white" data-testid="year-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINANCIAL_YEARS.map(y => (<SelectItem key={y} value={y}>FY {y}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} data-testid="add-deduction-btn">
            <Plus size={16} className="mr-2" />Add Deduction
          </Button>
        </div>
      </div>

      {/* Total Summary */}
      <div className="net-worth-card metric-card p-6 rounded-lg">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-wider text-white/70 mb-1">Total Deductions - FY {selectedYear}</p>
          <p className="text-3xl font-mono font-bold text-white" data-testid="total-deductions">
            {formatCurrency(taxData?.total_deductions || 0)}
          </p>
          <div className="flex gap-8 mt-4">
            <div>
              <p className="text-xs text-white/60">Old Regime Tax Saved (30%)</p>
              <p className="font-mono text-emerald-300">{formatCurrency((taxData?.total_deductions || 0) * 0.3)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Number of Sections Used</p>
              <p className="font-mono text-white">{Object.keys(taxData?.sections || {}).length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TAX_SECTIONS.map((section) => {
            const data = taxData?.sections?.[section.value];
            const total = data?.total || 0;
            const limit = data?.limit || section.limit;
            const utilized = limit ? Math.min((total / limit) * 100, 100) : 0;
            const remaining = limit ? Math.max(limit - total, 0) : null;
            const Icon = getSectionIcon(section.value);

            return (
              <div key={section.value} className="card-surface p-5" data-testid={`section-${section.value}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      total > 0 ? "bg-emerald-50" : "bg-gray-100"
                    }`}>
                      <Icon size={20} className={total > 0 ? "text-emerald-600" : "text-gray-400"} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{section.label}</h3>
                      <p className="text-xs text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  {limit && total >= limit && (
                    <CheckCircle size={18} className="text-emerald-500" />
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Claimed</span>
                    <span className="font-mono text-gray-900">{formatCurrency(total)}</span>
                  </div>
                  
                  {limit && (
                    <>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${utilized >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                          style={{ width: `${utilized}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{utilized.toFixed(0)}% utilized</span>
                        <span>Limit: {formatCurrency(limit)}</span>
                      </div>
                      {remaining > 0 && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formatCurrency(remaining)} more can be claimed
                        </p>
                      )}
                    </>
                  )}
                </div>

                {data?.items?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Breakdown</p>
                    <div className="space-y-1">
                      {data.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate mr-2">
                            {item.description}
                            {item.auto_calculated && <span className="text-xs text-blue-500 ml-1">(auto)</span>}
                          </span>
                          <span className="font-mono text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tax Deduction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Financial Year</Label>
                <Select value={formData.financial_year} onValueChange={(val) => setFormData({ ...formData, financial_year: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FINANCIAL_YEARS.map(y => (<SelectItem key={y} value={y}>FY {y}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select value={formData.section} onValueChange={(val) => setFormData({ ...formData, section: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TAX_SECTIONS.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                className="mt-1" 
                placeholder="e.g., LIC Premium, PPF Contribution" 
                required 
              />
            </div>

            <div>
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                step="1" 
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                className="mt-1 font-mono" 
                required 
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">Add Deduction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
