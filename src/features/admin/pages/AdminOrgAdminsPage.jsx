import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Store, 
  ShieldCheck, 
  Search, 
  Plus, 
  Building,
  ArrowRight,
  Edit,
  X,
  Mail,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/config/supabase";

export default function AdminOrgAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Form states
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [promoteUserId, setPromoteUserId] = useState("");
  const [linkShopId, setLinkShopId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  async function loadData() {
    try {
      setLoading(true);
      // Fetch shops
      const { data: shopData } = await supabase
        .from("shops")
        .select("id, shop_name, owner_id");
      setShops(shopData || []);

      // Fetch profiles with role = 'seller'
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "seller")
        .order("created_at", { ascending: false });
      setAdmins(profiles || []);

    } catch (err) {
      console.error("[OrgAdmins] Load error:", err);
      toast.error("Failed to load administrators");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Fetch users that can be promoted (role = 'customer')
  async function handleOpenPromote() {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "customer");
      setEligibleUsers(data || []);
      if (data && data.length > 0) {
        setPromoteUserId(data[0].id);
      }
      setIsPromoteOpen(true);
    } catch (err) {
      toast.error("Failed to load customer list");
    }
  }

  // Handle user promotion to seller
  async function handlePromoteUser(e) {
    e.preventDefault();
    if (!promoteUserId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "seller" })
        .eq("id", promoteUserId);

      if (error) throw error;
      toast.success("User promoted to Organization Admin successfully!");
      setIsPromoteOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to promote user");
    } finally {
      setSubmitting(false);
    }
  }

  // Open link modal
  function handleOpenLink(admin) {
    setSelectedAdmin(admin);
    const linkedShop = shops.find(s => s.owner_id === admin.id);
    setLinkShopId(linkedShop?.id || "");
    setIsLinkOpen(true);
  }

  // Handle re-assigning owner to a shop
  async function handleLinkShop(e) {
    e.preventDefault();
    if (!selectedAdmin) return;
    setSubmitting(true);
    try {
      // 1. Clear previous ownership of the target shop if it has one
      if (linkShopId) {
        const { error: clearErr } = await supabase
          .from("shops")
          .update({ owner_id: selectedAdmin.id })
          .eq("id", linkShopId);
        
        if (clearErr) throw clearErr;
      }
      
      toast.success("Ownership mapped successfully!");
      setIsLinkOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to link organization");
    } finally {
      setSubmitting(false);
    }
  }

  // Filter admins
  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      const matchesSearch = 
        (admin.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [admins, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 text-white max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Organization Admins</h1>
          <p className="mt-1 text-xs text-slate-400">Promote system users, audit merchant profile states, and map storefront ownerships.</p>
        </div>
        <Button
          onClick={handleOpenPromote}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Promote Org Admin</span>
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by admin name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-200 transition-colors"
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4.5">Administrator</th>
                <th className="px-6 py-4.5">Associated Shop / Org</th>
                <th className="px-6 py-4.5">Joined Date</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-transparent text-xs text-slate-300">
              {filteredAdmins.map((admin, idx) => {
                const linkedShop = shops.find(s => s.owner_id === admin.id);
                const joinDate = admin.created_at ? new Date(admin.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                }) : "—";

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={admin.id} 
                    className="hover:bg-slate-900/10 transition-colors"
                  >
                    {/* Admin profile info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <span className="font-bold text-white block text-sm">{admin.full_name || "Merchant"}</span>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{admin.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Linked store */}
                    <td className="px-6 py-4 font-semibold">
                      {linkedShop ? (
                        <div className="flex items-center gap-2 text-slate-200">
                          <Building className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{linkedShop.shop_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-normal">No Shop Associated</span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4 text-slate-400 font-medium">{joinDate}</td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleOpenLink(admin)}
                        className="text-blue-450 hover:text-white transition-colors bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Map Shop
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredAdmins.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Users className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No Administrators Found</p>
            </div>
          )}
        </div>
      </div>

      {/* PROMOTE MODAL */}
      <AnimatePresence>
        {isPromoteOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Promote User to Admin</h2>
                <p className="text-[10px] text-slate-500 mt-1">Upgrade an existing customer profile to a merchant/seller account.</p>
              </div>

              <form onSubmit={handlePromoteUser} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Select Platform Customer</label>
                  <select
                    value={promoteUserId}
                    onChange={(e) => setPromoteUserId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    {eligibleUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                    {eligibleUsers.length === 0 && (
                      <option value="">No customer accounts eligible for promotion.</option>
                    )}
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-4 flex gap-3 justify-end text-xs">
                  <Button
                    type="button"
                    onClick={() => setIsPromoteOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-550 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Promote Role
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LINK/MAP SHOP MODAL */}
      <AnimatePresence>
        {isLinkOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Map Organization Ownership</h2>
                <p className="text-[10px] text-slate-500 mt-1">Assign the shop ownership properties for "{selectedAdmin?.full_name}".</p>
              </div>

              <form onSubmit={handleLinkShop} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Select Target Shop</label>
                  <select
                    value={linkShopId}
                    onChange={(e) => setLinkShopId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">Unlinked (No Store)</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.shop_name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-4 flex gap-3 justify-end text-xs">
                  <Button
                    type="button"
                    onClick={() => setIsLinkOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-550 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Confirm Linkage
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
