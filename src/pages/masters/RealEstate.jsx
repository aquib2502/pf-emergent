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
import { Plus, Edit2, Trash2, Home, Building, Map, TrendingUp } from "lucide-react";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);

const PROPERTY_TYPES = [
  { value: "residential", label: "Residential Property", icon: Home },
  { value: "commercial", label: "Commercial Property", icon: Building },
  { value: "land", label: "Land / Plot", icon: Map },
];

export default function RealEstate() {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  const [formData, setFormData] = useState({
    property_type: "residential",
    property_name: "",
    address: "",
    purchase_date: "",
    purchase_value: "",
    current_value: "",
    rental_income: "",
  });

  useEffect(() => { fetchProperties(); }, [token]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API}/real-estate?token=${token}`);
      setProperties(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        purchase_value: parseFloat(formData.purchase_value) || 0,
        current_value: parseFloat(formData.current_value) || 0,
        rental_income: parseFloat(formData.rental_income) || 0,
      };
      if (editingProperty) {
        await axios.put(`${API}/real-estate/${editingProperty.id}?token=${token}`, data);
        toast.success("Property updated");
      } else {
        await axios.post(`${API}/real-estate?token=${token}`, data);
        toast.success("Property added");
      }
      setShowDialog(false);
      setEditingProperty(null);
      resetForm();
      fetchProperties();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      property_type: property.property_type,
      property_name: property.property_name,
      address: property.address || "",
      purchase_date: property.purchase_date || "",
      purchase_value: property.purchase_value?.toString() || "",
      current_value: property.current_value?.toString() || "",
      rental_income: property.rental_income?.toString() || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this property?")) return;
    try {
      await axios.delete(`${API}/real-estate/${id}?token=${token}`);
      toast.success("Property deleted");
      fetchProperties();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setFormData({
      property_type: "residential",
      property_name: "",
      address: "",
      purchase_date: "",
      purchase_value: "",
      current_value: "",
      rental_income: "",
    });
  };

  const totalValue = properties.reduce((sum, p) => sum + (p.current_value || 0), 0);
  const totalCost = properties.reduce((sum, p) => sum + (p.purchase_value || 0), 0);
  const monthlyRental = properties.reduce((sum, p) => sum + (p.rental_income || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real Estate</h1>
          <p className="text-gray-500 text-sm mt-1">Track your properties and rental income</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProperty(null); setShowDialog(true); }}>
          <Plus size={16} className="mr-2" />Add Property
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Appreciation</p>
          <p className={`text-2xl font-mono font-bold ${totalValue - totalCost >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(totalValue - totalCost)}
          </p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500">Monthly Rental</p>
          <p className="text-2xl font-mono font-bold text-blue-600">{formatCurrency(monthlyRental)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : properties.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Home size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties added yet</h3>
          <p className="text-gray-500 mb-4">Add your real estate to track value and rental income</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" />Add Property
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => {
            const appreciation = property.current_value - property.purchase_value;
            const appreciationPercent = property.purchase_value > 0 ? (appreciation / property.purchase_value * 100).toFixed(1) : 0;
            const Icon = PROPERTY_TYPES.find(t => t.value === property.property_type)?.icon || Home;
            return (
              <div key={property.id} className="card-surface p-5 group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center">
                      <Icon size={24} className="text-amber-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{property.property_name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{property.property_type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(property)}>
                      <Edit2 size={14} className="text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(property.id)}>
                      <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                    </Button>
                  </div>
                </div>

                {property.address && (
                  <p className="text-sm text-gray-500 mt-3 line-clamp-1">{property.address}</p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Current Value</p>
                    <p className="text-lg font-mono font-semibold text-gray-900">{formatCurrency(property.current_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Appreciation</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-lg font-mono font-semibold ${appreciation >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {appreciation >= 0 ? "+" : ""}{formatCurrency(appreciation)}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${appreciation >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {appreciationPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {property.rental_income > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Monthly Rental Income</p>
                    <p className="font-mono text-blue-600">{formatCurrency(property.rental_income)}</p>
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
            <DialogTitle>{editingProperty ? "Edit Property" : "Add Property"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property Type</Label>
                <Select value={formData.property_type} onValueChange={(val) => setFormData({ ...formData, property_type: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property Name</Label>
                <Input value={formData.property_name} onChange={(e) => setFormData({ ...formData, property_name: e.target.value })} className="mt-1" placeholder="My Flat" required />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1 h-20" placeholder="Full address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Purchase Value (₹)</Label>
                <Input type="number" step="1" value={formData.purchase_value} onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })} className="mt-1 font-mono" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Value (₹)</Label>
                <Input type="number" step="1" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Monthly Rental (₹)</Label>
                <Input type="number" step="1" value={formData.rental_income} onChange={(e) => setFormData({ ...formData, rental_income: e.target.value })} className="mt-1 font-mono" placeholder="If rented out" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingProperty ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
