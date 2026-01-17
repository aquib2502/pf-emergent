import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Coins } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const GOLD_TYPES = [
  { value: "physical", label: "Physical Gold (Jewellery/Coins)" },
  { value: "digital", label: "Digital Gold" },
  { value: "sgb", label: "Sovereign Gold Bonds (SGB)" },
];

const PURITY_OPTIONS = [
  { value: "24K", label: "24K (99.9% Pure)" },
  { value: "22K", label: "22K (91.6% Pure)" },
  { value: "18K", label: "18K (75% Pure)" },
  { value: "14K", label: "14K (58.3% Pure)" },
];

export default function Gold() {
  const { token } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);

  const [formData, setFormData] = useState({
    gold_type: "physical",
    description: "",
    quantity_grams: "",
    purity: "24K",
    purchase_price_per_gram: "",
    current_price_per_gram: "",
    purchase_date: "",
  });

  useEffect(() => { fetchHoldings(); }, [token]);

  const fetchHoldings = async () => {
    try {
      const res = await axios.get(`${API}/gold-holdings?token=${token}`);
      setHoldings(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const calculateValues = (data) => {
    const grams = parseFloat(data.quantity_grams) || 0;
    const purchasePPG = parseFloat(data.purchase_price_per_gram) || 0;
    const currentPPG = parseFloat(data.current_price_per_gram) || 0;
    return {
      purchase_value: grams * purchasePPG,
      current_value: grams * currentPPG,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const values = calculateValues(formData);
      const data = {
        ...formData,
        quantity_grams: parseFloat(formData.quantity_grams) || 0,
        purchase_price_per_gram: parseFloat(formData.purchase_price_per_gram) || 0,
        current_price_per_gram: parseFloat(formData.current_price_per_gram) || 0,
        purchase_value: values.purchase_value,
        current_value: values.current_value,
      };
      if (editingHolding) {
        await axios.put(`${API}/gold-holdings/${editingHolding.id}?token=${token}`, data);
        toast.success("Gold holding updated");
      } else {
        await axios.post(`${API}/gold-holdings?token=${token}`, data);
        toast.success("Gold holding added");
      }
      setShowDialog(false);
      setEditingHolding(null);
      resetForm();
      fetchHoldings();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (holding) => {
    setEditingHolding(holding);
    setFormData({
      gold_type: holding.gold_type,
      description: holding.description || "",
      quantity_grams: holding.quantity_grams?.toString() || "",
      purity: holding.purity || "24K",
      purchase_price_per_gram: holding.purchase_price_per_gram?.toString() || "",
      current_price_per_gram: holding.current_price_per_gram?.toString() || "",
      purchase_date: holding.purchase_date || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this gold holding?")) return;
    try {
      await axios.delete(`${API}/gold-holdings/${id}?token=${token}`);
      toast.success("Gold holding deleted");
      fetchHoldings();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      gold_type: "physical",
      description: "",
      quantity_grams: "",
      purity: "24K",
      purchase_price_per_gram: "",
      current_price_per_gram: "",
      purchase_date: "",
    });
  };

  const totalGrams = holdings.reduce((sum, h) => sum + (h.quantity_grams || 0), 0);
  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.purchase_value || 0), 0);

  // Calculate display values with per-gram prices
  const getDisplayValues = (holding) => {
    const grams = holding.quantity_grams || 0;
    const purchasePPG = holding.purchase_price_per_gram || 0;
    const currentPPG = holding.current_price_per_gram || 0;
    const purchaseValue = purchasePPG > 0 ? grams * purchasePPG : holding.purchase_value || 0;
    const currentValue = currentPPG > 0 ? grams * currentPPG : holding.current_value || 0;
    return { purchaseValue, currentValue, purchasePPG, currentPPG };
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="gold-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gold Holdings</h1>
          <p className="text-gray-500 text-sm mt-1">Physical gold, Digital gold & SGBs</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingHolding(null); setShowDialog(true); }} data-testid="add-gold-btn">
          <Plus size={16} className="mr-2" />Add Gold
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Total Gold</p>
          <p className="text-2xl font-mono font-bold text-amber-600" data-testid="total-grams">{totalGrams.toFixed(2)} grams</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-2xl font-mono font-bold text-gray-900" data-testid="total-value">{formatCurrency(totalValue)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Profit/Loss</p>
          <p className={`text-2xl font-mono font-bold ${totalValue - totalCost >= 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="total-pnl">
            {formatCurrency(totalValue - totalCost)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : holdings.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Coins size={48} className="mx-auto text-amber-300 mb-4" strokeWidth={1} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gold holdings yet</h3>
          <p className="text-gray-500 mb-4">Add your gold investments to track</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" />Add Gold Holding
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdings.map((holding) => {
            const { purchaseValue, currentValue, purchasePPG, currentPPG } = getDisplayValues(holding);
            const pnl = currentValue - purchaseValue;
            return (
              <div key={holding.id} className="card-surface p-5 group hover:shadow-md transition-shadow" data-testid={`gold-item-${holding.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center">
                      <Coins size={20} className="text-amber-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">{holding.gold_type.replace("_", " ")}</h3>
                      <p className="text-xs text-gray-500">{holding.description || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(holding)}>
                      <Edit2 size={14} className="text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(holding.id)}>
                      <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-mono font-semibold text-amber-600">{holding.quantity_grams} g</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Purity</p>
                    <p className="font-semibold text-gray-900">{holding.purity || "24K"}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Buy Rate/gram</p>
                    <p className="font-mono text-sm text-gray-700">{formatCurrency(purchasePPG)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Rate/gram</p>
                    <p className="font-mono text-sm text-gray-700">{formatCurrency(currentPPG)}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500">Current Value</p>
                      <p className="font-mono font-semibold text-gray-900">{formatCurrency(currentValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">P&L</p>
                      <p className={`font-mono font-semibold ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                      </p>
                    </div>
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
            <DialogTitle>{editingHolding ? "Edit Gold Holding" : "Add Gold Holding"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gold Type</Label>
                <Select value={formData.gold_type} onValueChange={(val) => setFormData({ ...formData, gold_type: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOLD_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Purity</Label>
                <Select value={formData.purity} onValueChange={(val) => setFormData({ ...formData, purity: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PURITY_OPTIONS.map(p => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1" placeholder="e.g., Wedding jewellery, Gold coins" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity (grams)</Label>
                <Input type="number" step="0.01" value={formData.quantity_grams} onChange={(e) => setFormData({ ...formData, quantity_grams: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Rate (₹/gram)</Label>
                <Input type="number" step="0.01" value={formData.purchase_price_per_gram} onChange={(e) => setFormData({ ...formData, purchase_price_per_gram: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Current Rate (₹/gram)</Label>
                <Input type="number" step="0.01" value={formData.current_price_per_gram} onChange={(e) => setFormData({ ...formData, current_price_per_gram: e.target.value })} className="mt-1 font-mono" required />
              </div>
            </div>

            {/* Preview calculation */}
            {formData.quantity_grams && formData.current_price_per_gram && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Calculated Value:</span>
                  <span className="font-mono font-medium text-gray-900">
                    {formatCurrency(parseFloat(formData.quantity_grams) * parseFloat(formData.current_price_per_gram))}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingHolding ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
