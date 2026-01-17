import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, User, Users, Briefcase, Crown } from "lucide-react";

const ENTITY_TYPES = [
  { value: "individual", label: "Individual", icon: User },
  { value: "family_member", label: "Family Member", icon: Users },
  { value: "business", label: "Business", icon: Briefcase },
];

const RELATIONSHIPS = [
  { value: "self", label: "Self" },
  { value: "spouse", label: "Spouse" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "other", label: "Other" },
];

export default function Profiles() {
  const { token } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    entity_type: "individual",
    pan: "",
    email: "",
    phone: "",
    date_of_birth: "",
    tax_regime: "new",
    relationship: "self",
  });

  useEffect(() => { fetchProfiles(); }, [token]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${API}/profiles?token=${token}`);
      setProfiles(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProfile) {
        await axios.put(`${API}/profiles/${editingProfile.id}?token=${token}`, formData);
        toast.success("Profile updated");
      } else {
        await axios.post(`${API}/profiles?token=${token}`, formData);
        toast.success("Profile created");
      }
      setShowDialog(false);
      setEditingProfile(null);
      resetForm();
      fetchProfiles();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      entity_type: profile.entity_type,
      pan: profile.pan || "",
      email: profile.email || "",
      phone: profile.phone || "",
      date_of_birth: profile.date_of_birth || "",
      tax_regime: profile.tax_regime || "new",
      relationship: profile.relationship || "self",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this profile?")) return;
    try {
      await axios.delete(`${API}/profiles/${id}?token=${token}`);
      toast.success("Profile deleted");
      fetchProfiles();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cannot delete");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      entity_type: "individual",
      pan: "",
      email: "",
      phone: "",
      date_of_birth: "",
      tax_regime: "new",
      relationship: "self",
    });
  };

  const getEntityIcon = (type) => {
    const entity = ENTITY_TYPES.find(e => e.value === type);
    return entity?.icon || User;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profiles & Family</h1>
          <p className="text-gray-500 text-sm mt-1">Manage family members and entities</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProfile(null); setShowDialog(true); }}>
          <Plus size={16} className="mr-2" />Add Profile
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : profiles.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <User size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
          <p className="text-gray-500 mb-4">Create your first profile to get started</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" />Create Profile
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => {
            const Icon = getEntityIcon(profile.entity_type);
            return (
              <div key={profile.id} className="card-surface p-5 group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Icon size={24} className="text-blue-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                        {profile.is_primary && (
                          <Crown size={14} className="text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{profile.relationship || profile.entity_type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(profile)}>
                      <Edit2 size={14} className="text-gray-500" />
                    </Button>
                    {!profile.is_primary && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(profile.id)}>
                        <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                  {profile.pan && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">PAN</span>
                      <span className="font-mono text-gray-700">{profile.pan}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax Regime</span>
                    <span className="text-gray-700 capitalize">{profile.tax_regime}</span>
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
            <DialogTitle>{editingProfile ? "Edit Profile" : "Add Profile"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entity Type</Label>
                <Select value={formData.entity_type} onValueChange={(val) => setFormData({ ...formData, entity_type: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Relationship</Label>
                <Select value={formData.relationship} onValueChange={(val) => setFormData({ ...formData, relationship: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map(r => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>PAN Number</Label>
              <Input value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} className="mt-1 font-mono" placeholder="ABCDE1234F" maxLength={10} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Tax Regime</Label>
                <Select value={formData.tax_regime} onValueChange={(val) => setFormData({ ...formData, tax_regime: val })}>
                  <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="old">Old Regime</SelectItem>
                    <SelectItem value="new">New Regime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingProfile ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
