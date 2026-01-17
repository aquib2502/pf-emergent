import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Landmark, Shield, TrendingUp } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const SCHEME_TYPES = [
  { value: "ppf", label: "PPF (Public Provident Fund)", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  { value: "nps", label: "NPS (National Pension System)", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "epf", label: "EPF (Employee Provident Fund)", icon: Landmark, color: "text-purple-600", bg: "bg-purple-50" },
  { value: "nsc", label: "NSC (National Savings Certificate)", icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
  { value: "scss", label: "SCSS (Senior Citizen Savings Scheme)", icon: Shield, color: "text-rose-600", bg: "bg-rose-50" },
  { value: "kvp", label: "KVP (Kisan Vikas Patra)", icon: Shield, color: "text-green-600", bg: "bg-green-50" },
  { value: "sukanya", label: "Sukanya Samriddhi Yojana", icon: Shield, color: "text-pink-600", bg: "bg-pink-50" },
];

export default function GovSchemes() {
  const { token } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);

  const [formData, setFormData] = useState({
    scheme_type: "ppf",
    account_number: "",
    institution: "",
    current_balance: "",
    interest_rate: "",
    start_date: "",
    maturity_date: "",
    yearly_contribution: "",
  });

  useEffect(() => { fetchSchemes(); }, [token]);

  const fetchSchemes = async () => {
    try {
      const res = await axios.get(`${API}/gov-schemes?token=${token}`);
      setSchemes(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        current_balance: parseFloat(formData.current_balance) || 0,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        yearly_contribution: parseFloat(formData.yearly_contribution) || 0,
      };
      if (editingScheme) {
        await axios.put(`${API}/gov-schemes/${editingScheme.id}?token=${token}`, data);
        toast.success("Scheme updated");
      } else {
        await axios.post(`${API}/gov-schemes?token=${token}`, data);
        toast.success("Scheme added");
      }
      setShowDialog(false);
      setEditingScheme(null);
      resetForm();
      fetchSchemes();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      scheme_type: scheme.scheme_type,
      account_number: scheme.account_number || "",
      institution: scheme.institution || "",
      current_balance: scheme.current_balance?.toString() || "",
      interest_rate: scheme.interest_rate?.toString() || "",
      start_date: scheme.start_date || "",
      maturity_date: scheme.maturity_date || "",
      yearly_contribution: scheme.yearly_contribution?.toString() || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this scheme?")) return;
    try {
      await axios.delete(`${API}/gov-schemes/${id}?token=${token}`);
      toast.success("Scheme deleted");
      fetchSchemes();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      scheme_type: "ppf",
      account_number: "",
      institution: "",
      current_balance: "",
      interest_rate: "",
      start_date: "",
      maturity_date: "",
      yearly_contribution: "",
    });
  };

  const getSchemeConfig = (type) => SCHEME_TYPES.find(s => s.value === type) || SCHEME_TYPES[0];
  const totalBalance = schemes.reduce((sum, s) => sum + (s.current_balance || 0), 0);
  const yearlyContribution = schemes.reduce((sum, s) => sum + (s.yearly_contribution || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Government Schemes</h1>
          <p className="text-gray-500 text-sm mt-1">PPF, NPS, EPF and other schemes</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingScheme(null); setShowDialog(true); }}>
          <Plus size={16} className="mr-2" />Add Scheme
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Yearly Contribution (80C)</p>
          <p className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(yearlyContribution)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : schemes.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Landmark size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes added yet</h3>
          <p className="text-gray-500 mb-4">Add your PPF, NPS, EPF accounts to track</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" />Add Scheme
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemes.map((scheme) => {
            const config = getSchemeConfig(scheme.scheme_type);
            const Icon = config.icon;
            return (
              <div key={scheme.id} className="card-surface p-5 group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md ${config.bg} flex items-center justify-center`}>
                      <Icon size={20} className={config.color} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{scheme.scheme_type.toUpperCase()}</h3>
                      <p className="text-xs text-gray-500">{scheme.institution || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(scheme)}>
                      <Edit2 size={14} className="text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(scheme.id)}>
                      <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500">Current Balance</p>
                      <p className="text-xl font-mono font-semibold text-gray-900">{formatCurrency(scheme.current_balance)}</p>
                    </div>
                    {scheme.yearly_contribution > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">This Year</p>
                        <p className="text-sm font-mono text-emerald-600">+{formatCurrency(scheme.yearly_contribution)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingScheme ? "Edit Scheme" : "Add Government Scheme"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Scheme Type</Label>
              <Select value={formData.scheme_type} onValueChange={(val) => setFormData({ ...formData, scheme_type: val })}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEME_TYPES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Number</Label>
                <Input value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} className="mt-1 font-mono" placeholder="Optional" />
              </div>
              <div>
                <Label>Institution</Label>
                <Input value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} className="mt-1" placeholder="SBI, Post Office" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Balance (₹)</Label>
                <Input type="number" step="0.01" value={formData.current_balance} onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input type="number" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} className="mt-1 font-mono" placeholder="7.1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Maturity Date</Label>
                <Input type="date" value={formData.maturity_date} onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Yearly Contribution (₹)</Label>
              <Input type="number" step="0.01" value={formData.yearly_contribution} onChange={(e) => setFormData({ ...formData, yearly_contribution: e.target.value })} className="mt-1 font-mono" placeholder="For 80C calculation" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingScheme ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
