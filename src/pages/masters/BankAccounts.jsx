import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Landmark, Wallet, Building } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings Account", icon: Wallet },
  { value: "current", label: "Current Account", icon: Building },
  { value: "salary", label: "Salary Account", icon: Landmark },
];

const BANKS = [
  "HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra", 
  "Yes Bank", "IndusInd Bank", "IDFC First", "Federal Bank", "Bank of Baroda",
  "Punjab National Bank", "Canara Bank", "Union Bank", "Other"
];

export default function BankAccounts() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [formData, setFormData] = useState({
    bank_name: "",
    account_type: "savings",
    account_number: "",
    ifsc: "",
    branch: "",
    current_balance: "",
  });

  useEffect(() => { fetchAccounts(); }, [token]);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API}/bank-accounts?token=${token}`);
      setAccounts(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, current_balance: parseFloat(formData.current_balance) || 0 };
      if (editingAccount) {
        await axios.put(`${API}/bank-accounts/${editingAccount.id}?token=${token}`, data);
        toast.success("Account updated");
      } else {
        await axios.post(`${API}/bank-accounts?token=${token}`, data);
        toast.success("Account added");
      }
      setShowDialog(false);
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_type: account.account_type,
      account_number: account.account_number || "",
      ifsc: account.ifsc || "",
      branch: account.branch || "",
      current_balance: account.current_balance?.toString() || "0",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this account?")) return;
    try {
      await axios.delete(`${API}/bank-accounts/${id}?token=${token}`);
      toast.success("Account deleted");
      fetchAccounts();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      bank_name: "",
      account_type: "savings",
      account_number: "",
      ifsc: "",
      branch: "",
      current_balance: "",
    });
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your bank accounts</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingAccount(null); setShowDialog(true); }}>
          <Plus size={16} className="mr-2" />Add Account
        </Button>
      </div>

      {/* Summary */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Bank Balance</p>
            <p className="text-3xl font-mono font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{accounts.length} Accounts</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Landmark size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bank accounts yet</h3>
          <p className="text-gray-500 mb-4">Add your bank accounts to track balances</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" />Add Bank Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="card-surface p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                    <Landmark size={20} className="text-blue-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.bank_name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{account.account_type} Account</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(account)}>
                    <Edit2 size={14} className="text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(account.id)}>
                    <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                {account.account_number && (
                  <p className="text-xs text-gray-500 font-mono mb-2">
                    A/C: ••••{account.account_number.slice(-4)}
                  </p>
                )}
                <p className="text-xs text-gray-500">Current Balance</p>
                <p className={`text-xl font-mono font-semibold ${account.current_balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(account.current_balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Bank Account"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Bank Name</Label>
              <Select value={formData.bank_name} onValueChange={(val) => setFormData({ ...formData, bank_name: val })}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>
                  {BANKS.map(bank => (<SelectItem key={bank} value={bank}>{bank}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Account Type</Label>
              <Select value={formData.account_type} onValueChange={(val) => setFormData({ ...formData, account_type: val })}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Number</Label>
                <Input value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} className="mt-1 font-mono" placeholder="Optional" />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input value={formData.ifsc} onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })} className="mt-1 font-mono" placeholder="Optional" />
              </div>
            </div>

            <div>
              <Label>Branch</Label>
              <Input value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} className="mt-1" placeholder="Optional" />
            </div>

            <div>
              <Label>Current Balance (₹)</Label>
              <Input type="number" step="0.01" value={formData.current_balance} onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })} className="mt-1 font-mono" placeholder="0.00" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingAccount ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
