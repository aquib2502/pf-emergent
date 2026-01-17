import { useState, useEffect, useRef } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Upload, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const HOLDING_TYPES = [
  { value: "stock", label: "Stocks" },
  { value: "mutual_fund", label: "Mutual Funds" },
  { value: "etf", label: "ETFs" },
];

const BROKERS = ["Zerodha", "Groww", "Angel One", "Upstox", "ICICI Direct", "HDFC Securities", "Kotak Securities", "Other"];

export default function Portfolio() {
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [importing, setImporting] = useState(false);
  const [importBroker, setImportBroker] = useState("zerodha");

  const [formData, setFormData] = useState({
    holding_type: "stock",
    symbol: "",
    name: "",
    quantity: "",
    avg_buy_price: "",
    current_price: "",
    broker: "",
  });

  useEffect(() => { fetchHoldings(); }, [token]);

  const fetchHoldings = async () => {
    try {
      const res = await axios.get(`${API}/investment-holdings?token=${token}`);
      setHoldings(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        avg_buy_price: parseFloat(formData.avg_buy_price) || 0,
        current_price: parseFloat(formData.current_price) || 0,
      };
      if (editingHolding) {
        await axios.put(`${API}/investment-holdings/${editingHolding.id}?token=${token}`, data);
        toast.success("Holding updated");
      } else {
        await axios.post(`${API}/investment-holdings?token=${token}`, data);
        toast.success("Holding added");
      }
      setShowDialog(false);
      setEditingHolding(null);
      resetForm();
      fetchHoldings();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await axios.post(`${API}/investment-holdings/import-csv?broker=${importBroker}&token=${token}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`Imported ${res.data.count} holdings`);
      fetchHoldings();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEdit = (holding) => {
    setEditingHolding(holding);
    setFormData({
      holding_type: holding.holding_type,
      symbol: holding.symbol || "",
      name: holding.name,
      quantity: holding.quantity?.toString() || "",
      avg_buy_price: holding.avg_buy_price?.toString() || "",
      current_price: holding.current_price?.toString() || "",
      broker: holding.broker || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this holding?")) return;
    try {
      await axios.delete(`${API}/investment-holdings/${id}?token=${token}`);
      toast.success("Holding deleted");
      fetchHoldings();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      holding_type: "stock",
      symbol: "",
      name: "",
      quantity: "",
      avg_buy_price: "",
      current_price: "",
      broker: "",
    });
  };

  // Filter by type
  const filteredHoldings = activeTab === "all" ? holdings : holdings.filter(h => h.holding_type === activeTab);

  // Calculations
  const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.avg_buy_price), 0);
  const totalCurrent = holdings.reduce((sum, h) => sum + (h.quantity * h.current_price), 0);
  const totalPnL = totalCurrent - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested * 100) : 0;

  // Allocation chart data
  const allocationData = [
    { name: "Stocks", value: holdings.filter(h => h.holding_type === "stock").reduce((sum, h) => sum + (h.quantity * h.current_price), 0) },
    { name: "Mutual Funds", value: holdings.filter(h => h.holding_type === "mutual_fund").reduce((sum, h) => sum + (h.quantity * h.current_price), 0) },
    { name: "ETFs", value: holdings.filter(h => h.holding_type === "etf").reduce((sum, h) => sum + (h.quantity * h.current_price), 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-gray-500 text-sm mt-1">Stocks, Mutual Funds & ETFs</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Select value={importBroker} onValueChange={setImportBroker}>
              <SelectTrigger className="w-[120px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zerodha">Zerodha</SelectItem>
                <SelectItem value="groww">Groww</SelectItem>
              </SelectContent>
            </Select>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload size={16} className="mr-2" />
              {importing ? "Importing..." : "Import CSV"}
            </Button>
          </div>
          <Button onClick={() => { resetForm(); setEditingHolding(null); setShowDialog(true); }}>
            <Plus size={16} className="mr-2" />Add Holding
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Invested</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Total P&L</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-mono font-bold ${totalPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {totalPnL >= 0 ? "+" : ""}{formatCurrency(totalPnL)}
            </p>
            <span className={`text-xs px-2 py-1 rounded ${totalPnL >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500 mb-2">Allocation</p>
          {allocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={60}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={15} outerRadius={25} dataKey="value">
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400">No data</p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({holdings.length})</TabsTrigger>
          <TabsTrigger value="stock">Stocks ({holdings.filter(h => h.holding_type === "stock").length})</TabsTrigger>
          <TabsTrigger value="mutual_fund">Mutual Funds ({holdings.filter(h => h.holding_type === "mutual_fund").length})</TabsTrigger>
          <TabsTrigger value="etf">ETFs ({holdings.filter(h => h.holding_type === "etf").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredHoldings.length === 0 ? (
            <div className="card-surface p-12 text-center">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No holdings yet</h3>
              <p className="text-gray-500 mb-4">Add your investments or import from broker</p>
            </div>
          ) : (
            <div className="card-surface overflow-hidden">
              <table className="w-full">
                <thead className="table-dense">
                  <tr>
                    <th className="text-left">Name</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Avg Cost</th>
                    <th className="text-right">Current</th>
                    <th className="text-right">Invested</th>
                    <th className="text-right">Current Value</th>
                    <th className="text-right">P&L</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="table-dense">
                  {filteredHoldings.map((holding) => {
                    const invested = holding.quantity * holding.avg_buy_price;
                    const current = holding.quantity * holding.current_price;
                    const pnl = current - invested;
                    const pnlPct = invested > 0 ? (pnl / invested * 100) : 0;
                    return (
                      <tr key={holding.id} className="group">
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{holding.symbol || holding.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{holding.holding_type.replace("_", " ")} • {holding.broker || "—"}</p>
                          </div>
                        </td>
                        <td className="text-right font-mono">{holding.quantity}</td>
                        <td className="text-right font-mono">{formatCurrency(holding.avg_buy_price)}</td>
                        <td className="text-right font-mono">{formatCurrency(holding.current_price)}</td>
                        <td className="text-right font-mono">{formatCurrency(invested)}</td>
                        <td className="text-right font-mono">{formatCurrency(current)}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`font-mono ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${pnl >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(holding)}>
                              <Edit2 size={14} className="text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(holding.id)}>
                              <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingHolding ? "Edit Holding" : "Add Investment Holding"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.holding_type} onValueChange={(val) => setFormData({ ...formData, holding_type: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOLDING_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Broker</Label>
                <Select value={formData.broker} onValueChange={(val) => setFormData({ ...formData, broker: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BROKERS.map(b => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Symbol</Label>
                <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} className="mt-1 font-mono" placeholder="RELIANCE, INFY" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" step="0.001" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Avg Buy Price</Label>
                <Input type="number" step="0.01" value={formData.avg_buy_price} onChange={(e) => setFormData({ ...formData, avg_buy_price: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Current Price</Label>
                <Input type="number" step="0.01" value={formData.current_price} onChange={(e) => setFormData({ ...formData, current_price: e.target.value })} className="mt-1 font-mono" required />
              </div>
            </div>

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
