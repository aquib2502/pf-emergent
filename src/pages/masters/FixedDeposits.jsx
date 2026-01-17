import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2, Building2, Calendar } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const BANKS = [
  "HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra", 
  "Yes Bank", "IndusInd Bank", "IDFC First", "Federal Bank", "Post Office",
  "LIC Housing", "Bajaj Finance", "Mahindra Finance", "Other"
];

const PAYOUT_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "maturity", label: "At Maturity" },
];

export default function FixedDeposits() {
  const { token } = useAuth();
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFd, setEditingFd] = useState(null);

  const [formData, setFormData] = useState({
    bank_name: "",
    fd_number: "",
    principal: "",
    interest_rate: "",
    start_date: "",
    maturity_date: "",
    maturity_amount: "",
    interest_payout: "maturity",
    is_tax_saver: false,
    tds_deducted: "",
  });

  useEffect(() => { fetchFds(); }, [token]);

  const fetchFds = async () => {
    try {
      const res = await axios.get(`${API}/fixed-deposits?token=${token}`);
      setFds(res.data);
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
        maturity_amount: formData.maturity_amount ? parseFloat(formData.maturity_amount) : null,
        tds_deducted: parseFloat(formData.tds_deducted) || 0,
      };
      if (editingFd) {
        await axios.put(`${API}/fixed-deposits/${editingFd.id}?token=${token}`, data);
        toast.success("FD updated");
      } else {
        await axios.post(`${API}/fixed-deposits?token=${token}`, data);
        toast.success("FD added");
      }
      setShowDialog(false);
      setEditingFd(null);
      resetForm();
      fetchFds();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (fd) => {
    setEditingFd(fd);
    setFormData({
      bank_name: fd.bank_name,
      fd_number: fd.fd_number || "",
      principal: fd.principal?.toString() || "",
      interest_rate: fd.interest_rate?.toString() || "",
      start_date: fd.start_date || "",
      maturity_date: fd.maturity_date || "",
      maturity_amount: fd.maturity_amount?.toString() || "",
      interest_payout: fd.interest_payout || "maturity",
      is_tax_saver: fd.is_tax_saver || false,
      tds_deducted: fd.tds_deducted?.toString() || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this FD?")) return;
    try {
      await axios.delete(`${API}/fixed-deposits/${id}?token=${token}`);
      toast.success("FD deleted");
      fetchFds();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      bank_name: "",
      fd_number: "",
      principal: "",
      interest_rate: "",
      start_date: "",
      maturity_date: "",
      maturity_amount: "",
      interest_payout: "maturity",
      is_tax_saver: false,
      tds_deducted: "",
    });
  };

  const totalPrincipal = fds.reduce((sum, fd) => sum + (fd.principal || 0), 0);
  const totalMaturity = fds.reduce((sum, fd) => sum + (fd.maturity_amount || fd.principal || 0), 0);
  const totalTDS = fds.reduce((sum, fd) => sum + (fd.tds_deducted || 0), 0);

  const getDaysToMaturity = (maturityDate) => {
    if (!maturityDate) return null;
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diff = Math.ceil((maturity - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="fixed-deposits-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixed Deposits</h1>
          <p className="text-gray-500 text-sm mt-1">Track your FDs, ROI and TDS</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingFd(null); setShowDialog(true); }} data-testid="add-fd-btn">
          <Plus size={16} className="mr-2" />Add FD
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="text-2xl font-mono font-bold text-gray-900" data-testid="total-principal">{formatCurrency(totalPrincipal)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Maturity Value</p>
          <p className="text-2xl font-mono font-bold text-emerald-600" data-testid="total-maturity">{formatCurrency(totalMaturity)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Expected Returns</p>
          <p className="text-2xl font-mono font-bold text-blue-600" data-testid="expected-returns">{formatCurrency(totalMaturity - totalPrincipal)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">TDS Deducted</p>
          <p className="text-2xl font-mono font-bold text-amber-600" data-testid="total-tds">{formatCurrency(totalTDS)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : fds.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Fixed Deposits yet</h3>
          <p className="text-gray-500 mb-4">Add your FDs to track maturity and returns</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" />Add Fixed Deposit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fds.map((fd) => {
            const daysToMaturity = getDaysToMaturity(fd.maturity_date);
            return (
              <div key={fd.id} className="card-surface p-5 group hover:shadow-md transition-shadow" data-testid={`fd-item-${fd.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center">
                      <Building2 size={20} className="text-purple-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{fd.bank_name}</h3>
                      <div className="flex items-center gap-2">
                        {fd.fd_number && <span className="text-xs text-gray-500 font-mono">{fd.fd_number}</span>}
                        {fd.is_tax_saver && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">80C</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(fd)}>
                      <Edit2 size={14} className="text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(fd.id)}>
                      <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Principal</p>
                    <p className="font-mono font-semibold text-gray-900">{formatCurrency(fd.principal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ROI (p.a.)</p>
                    <p className="font-mono font-semibold text-blue-600">{fd.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">TDS</p>
                    <p className="font-mono font-semibold text-amber-600">{formatCurrency(fd.tds_deducted || 0)}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>Matures: {fd.maturity_date}</span>
                  </div>
                  {daysToMaturity !== null && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      daysToMaturity <= 30 ? "bg-amber-50 text-amber-700" : 
                      daysToMaturity <= 90 ? "bg-blue-50 text-blue-700" : 
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {daysToMaturity > 0 ? `${daysToMaturity} days left` : "Matured"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFd ? "Edit Fixed Deposit" : "Add Fixed Deposit"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank / Institution</Label>
                <Select value={formData.bank_name} onValueChange={(val) => setFormData({ ...formData, bank_name: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BANKS.map(bank => (<SelectItem key={bank} value={bank}>{bank}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>FD Number</Label>
                <Input value={formData.fd_number} onChange={(e) => setFormData({ ...formData, fd_number: e.target.value })} className="mt-1 font-mono" placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Principal Amount (₹)</Label>
                <Input type="number" step="0.01" value={formData.principal} onChange={(e) => setFormData({ ...formData, principal: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Interest Rate / ROI (%)</Label>
                <Input type="number" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} className="mt-1 font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label>Maturity Date</Label>
                <Input type="date" value={formData.maturity_date} onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })} className="mt-1" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Maturity Amount (₹)</Label>
                <Input type="number" step="0.01" value={formData.maturity_amount} onChange={(e) => setFormData({ ...formData, maturity_amount: e.target.value })} className="mt-1 font-mono" placeholder="Optional" />
              </div>
              <div>
                <Label>TDS Deducted (₹)</Label>
                <Input type="number" step="0.01" value={formData.tds_deducted} onChange={(e) => setFormData({ ...formData, tds_deducted: e.target.value })} className="mt-1 font-mono" placeholder="0" />
              </div>
            </div>

            <div>
              <Label>Interest Payout</Label>
              <Select value={formData.interest_payout} onValueChange={(val) => setFormData({ ...formData, interest_payout: val })}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYOUT_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="taxSaver" checked={formData.is_tax_saver} onCheckedChange={(checked) => setFormData({ ...formData, is_tax_saver: checked })} />
              <label htmlFor="taxSaver" className="text-sm text-gray-700">Tax Saver FD (5-year lock-in, eligible for 80C)</label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingFd ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
