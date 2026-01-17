import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, CreditCard } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const BANKS = [
  "HDFC Bank", "ICICI Bank", "SBI Card", "Axis Bank", "Kotak Mahindra",
  "Yes Bank", "IndusInd Bank", "American Express", "Citibank", "RBL Bank", "Other"
];

export default function CreditCards() {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const [formData, setFormData] = useState({
    bank_name: "",
    card_name: "",
    card_number_last4: "",
    credit_limit: "",
    current_outstanding: "",
    billing_date: "",
    due_date: "",
  });

  useEffect(() => { fetchCards(); }, [token]);

  const fetchCards = async () => {
    try {
      const res = await axios.get(`${API}/credit-cards?token=${token}`);
      setCards(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        current_outstanding: parseFloat(formData.current_outstanding) || 0,
        billing_date: formData.billing_date ? parseInt(formData.billing_date) : null,
        due_date: formData.due_date ? parseInt(formData.due_date) : null,
      };
      if (editingCard) {
        await axios.put(`${API}/credit-cards/${editingCard.id}?token=${token}`, data);
        toast.success("Card updated");
      } else {
        await axios.post(`${API}/credit-cards?token=${token}`, data);
        toast.success("Card added");
      }
      setShowDialog(false);
      setEditingCard(null);
      resetForm();
      fetchCards();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      bank_name: card.bank_name,
      card_name: card.card_name || "",
      card_number_last4: card.card_number_last4 || "",
      credit_limit: card.credit_limit?.toString() || "",
      current_outstanding: card.current_outstanding?.toString() || "",
      billing_date: card.billing_date?.toString() || "",
      due_date: card.due_date?.toString() || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this card?")) return;
    try {
      await axios.delete(`${API}/credit-cards/${id}?token=${token}`);
      toast.success("Card deleted");
      fetchCards();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      bank_name: "",
      card_name: "",
      card_number_last4: "",
      credit_limit: "",
      current_outstanding: "",
      billing_date: "",
      due_date: "",
    });
  };

  const totalLimit = cards.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  const totalOutstanding = cards.reduce((sum, c) => sum + (c.current_outstanding || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Cards</h1>
          <p className="text-gray-500 text-sm mt-1">Track your credit card limits and dues</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingCard(null); setShowDialog(true); }}>
          <Plus size={16} className="mr-2" />Add Card
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Total Credit Limit</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatCurrency(totalLimit)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-mono font-bold text-rose-600">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Available Credit</p>
          <p className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(totalLimit - totalOutstanding)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <CreditCard size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No credit cards added yet</h3>
          <p className="text-gray-500 mb-4">Add your credit cards to track limits and dues</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" />Add Credit Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const utilization = card.credit_limit > 0 ? (card.current_outstanding / card.credit_limit * 100) : 0;
            return (
              <div key={card.id} className="card-surface p-5 group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                      <CreditCard size={20} className="text-blue-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{card.bank_name}</h3>
                      <p className="text-xs text-gray-500">{card.card_name || "Credit Card"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(card)}>
                      <Edit2 size={14} className="text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(card.id)}>
                      <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                    </Button>
                  </div>
                </div>

                {card.card_number_last4 && (
                  <p className="text-sm text-gray-400 font-mono mt-2">•••• {card.card_number_last4}</p>
                )}

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Outstanding</span>
                    <span className="font-mono text-rose-600">{formatCurrency(card.current_outstanding)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${utilization > 75 ? "bg-rose-500" : utilization > 50 ? "bg-amber-500" : "bg-emerald-500"}`} 
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{utilization.toFixed(0)}% utilized</span>
                    <span>Limit: {formatCurrency(card.credit_limit)}</span>
                  </div>
                </div>

                {(card.billing_date || card.due_date) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                    {card.billing_date && <span>Bill: {card.billing_date}th</span>}
                    {card.due_date && <span>Due: {card.due_date}th</span>}
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
            <DialogTitle>{editingCard ? "Edit Credit Card" : "Add Credit Card"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank</Label>
                <Select value={formData.bank_name} onValueChange={(val) => setFormData({ ...formData, bank_name: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BANKS.map(b => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Card Name</Label>
                <Input value={formData.card_name} onChange={(e) => setFormData({ ...formData, card_name: e.target.value })} className="mt-1" placeholder="Regalia, Millennia" />
              </div>
            </div>

            <div>
              <Label>Last 4 Digits</Label>
              <Input value={formData.card_number_last4} onChange={(e) => setFormData({ ...formData, card_number_last4: e.target.value })} className="mt-1 font-mono" placeholder="1234" maxLength={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Credit Limit (₹)</Label>
                <Input type="number" step="1" value={formData.credit_limit} onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Current Outstanding (₹)</Label>
                <Input type="number" step="1" value={formData.current_outstanding} onChange={(e) => setFormData({ ...formData, current_outstanding: e.target.value })} className="mt-1 font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Billing Date (day)</Label>
                <Input type="number" min="1" max="31" value={formData.billing_date} onChange={(e) => setFormData({ ...formData, billing_date: e.target.value })} className="mt-1" placeholder="15" />
              </div>
              <div>
                <Label>Due Date (day)</Label>
                <Input type="number" min="1" max="31" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="mt-1" placeholder="5" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingCard ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
