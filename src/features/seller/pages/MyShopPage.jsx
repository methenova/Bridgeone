import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";
import toast from "react-hot-toast";
import {
  Store,
  Plus,
  Trash2,
  Copy,
  Archive,
  ArrowRightLeft,
  Settings,
  X,
  Check,
  Languages,
  DollarSign,
  Clock,
  Sliders,
  UserCheck,
  Shield,
  Search,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  UserX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES_LIST = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "vi", name: "Vietnamese" }
];

const CURRENCIES_LIST = [
  { code: "USD", name: "USD ($)" },
  { code: "EUR", name: "EUR (€)" },
  { code: "GBP", name: "GBP (£)" },
  { code: "INR", name: "INR (₹)" },
  { code: "VND", name: "VND (₫)" },
  { code: "CAD", name: "CAD ($)" },
  { code: "AUD", name: "AUD ($)" }
];

const CATEGORIES_LIST = [
  { value: "fashion_apparel", label: "Fashion & Apparel" },
  { value: "beauty_cosmetics", label: "Beauty & Cosmetics" },
  { value: "luxury_jewelry", label: "Luxury & Jewelry" },
  { value: "electronics_tech", label: "Electronics & Tech" },
  { value: "home_living", label: "Home & Living" },
  { value: "health_wellness", label: "Health & Wellness" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "other_retail", label: "Other Retail" }
];

export default function MyShopPage() {
  const {
    user,
    organizations,
    currentOrganization,
    shops,
    reloadWorkspace,
    loadingWorkspace
  } = useAuthContext();

  const [activeTab, setActiveTab] = useState("active"); // "active" | "archived"
  const [editingShop, setEditingShop] = useState(null);
  const [editorTab, setEditorTab] = useState("general"); // "general" | "widget" | "hours" | "languages" | "team" | "transfer"

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [shopToTransfer, setShopToTransfer] = useState(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    name: "",
    website: "",
    category: "fashion_apparel"
  });

  const [transferForm, setTransferForm] = useState({
    type: "org", // "org" | "owner"
    targetOrgId: "",
    targetEmail: ""
  });

  // Settings State for Editing Shop
  const [editForm, setEditForm] = useState({
    name: "",
    website: "",
    category: "",
    defaultLanguage: "en",
    currency: "USD",
    widgetEnabled: true,
    widgetColor: "#4F46E5",
    widgetPosition: "bottom-right",
    welcomeMessage: "How can we help you today?",
    businessHours: "Mon-Fri: 09:00 - 18:00"
  });

  // Team Assignment State
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [assignForm, setAssignForm] = useState({
    profileId: "",
    role: "agent" // "manager" | "agent"
  });

  const [allOrgs, setAllOrgs] = useState([]);

  useEffect(() => {
    if (editingShop) {
      loadAssignedMembers(editingShop.id);
      loadAvailableProfiles(editingShop.id);
    }
  }, [editingShop]);

  useEffect(() => {
    if (organizations) {
      setAllOrgs(organizations);
    }
  }, [organizations]);

  // Load team members for the shop
  async function loadAssignedMembers(shopId) {
    try {
      const { data, error } = await supabase
        .from("shop_members")
        .select(`
          id,
          profile_id,
          role,
          is_active,
          profiles:profile_id ( id, full_name, email )
        `)
        .eq("shop_id", shopId);

      if (error) throw error;
      setAssignedMembers(data || []);
    } catch (err) {
      console.error("loadAssignedMembers error:", err);
    }
  }

  // Load available profiles to assign
  async function loadAvailableProfiles(shopId) {
    try {
      const { data: members } = await supabase
        .from("shop_members")
        .select("profile_id")
        .eq("shop_id", shopId);

      const existingIds = (members || []).map(m => m.profile_id);

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;

      const unassigned = (profiles || []).filter(p => !existingIds.includes(p.id));
      setAvailableProfiles(unassigned);
    } catch (err) {
      console.error("loadAvailableProfiles error:", err);
    }
  }

  // Handle Edit click
  function handleStartEdit(shop) {
    setEditingShop(shop);
    setEditForm({
      name: shop.shop_name || shop.name || "",
      website: shop.website || "",
      category: shop.categories?.slug || shop.category || "fashion_apparel",
      defaultLanguage: shop.default_language || shop.language || "en",
      currency: shop.currency || "USD",
      widgetEnabled: shop.widget_enabled ?? true,
      widgetColor: shop.widget_color || "#4F46E5",
      widgetPosition: shop.widget_position || "bottom-right",
      welcomeMessage: shop.welcome_message || "How can we help you today?",
      businessHours: shop.business_hours || "Mon-Fri: 09:00 - 18:00"
    });
    setEditorTab("general");
  }

  // Save general shop configuration
  async function handleSaveSettings(e) {
    if (e) e.preventDefault();
    if (!editingShop) return;

    try {
      const cleanDomain = (editForm.website || "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "") || `${editForm.name.toLowerCase().replace(/\s+/g, "-")}.com`;

      const category = editForm.category || "Fashion & Apparel";

      // 1. Update shops table
      const { error: shopError } = await supabase
        .from("shops")
        .update({
          shop_name: editForm.name,
          name: editForm.name,
          website: editForm.website,
          category: category,
          default_language: editForm.defaultLanguage,
          language: editForm.defaultLanguage,
          currency: editForm.currency,
          business_hours: editForm.businessHours,
          widget_enabled: editForm.widgetEnabled
        })
        .eq("id", editingShop.id);

      if (shopError) throw shopError;

      // 2. Update widget settings
      const { error: wsError } = await supabase
        .from("widget_settings")
        .update({
          primary_color: editForm.widgetColor,
          widget_position: editForm.widgetPosition,
          welcome_message: editForm.welcomeMessage,
          settings: {
            business_hours: editForm.businessHours,
            routing_rules: "all-agents"
          }
        })
        .eq("shop_id", editingShop.id);

      if (wsError) throw wsError;

      toast.success("Shop settings updated successfully!");
      setEditingShop(null);
      await reloadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to update shop settings.");
    }
  }

  // Create new shop
  async function handleCreateShop(e) {
    e.preventDefault();
    if (!currentOrganization) {
      toast.error("Please switch to or create an organization first.");
      return;
    }

    try {
      const cleanDomain = (createForm.website || "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "") || `${createForm.name.toLowerCase().replace(/\s+/g, "-")}.com`;

      const category = createForm.category || "Fashion & Apparel";

      const payload = {
        owner_id: user.id,
        organization_id: currentOrganization.id,
        shop_name: createForm.name,
        name: createForm.name,
        business_name: currentOrganization.organization_name,
        business_email: currentOrganization.business_email || user.email,
        business_phone: currentOrganization.business_phone || "",
        website: createForm.website || `http://${cleanDomain}`,
        category: category,
        status: "active",
        widget_enabled: true
      };

      const { data: newShop, error } = await supabase
        .from("shops")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Create widget settings
      const widgetPayload = {
        shop_id: newShop.id,
        primary_color: "#4F46E5",
        widget_position: "bottom-right",
        welcome_message: "How can we help you today?",
        settings: {
          business_hours: "Mon-Fri: 09:00 - 18:00",
          routing_rules: "all-agents"
        }
      };

      await supabase.from("widget_settings").insert(widgetPayload);

      toast.success(`Shop "${createForm.name}" created!`);
      setCreateForm({ name: "", website: "", category: "fashion_apparel" });
      setIsCreateOpen(false);
      await reloadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to create shop.");
    }
  }

  // Duplicate Shop
  async function handleDuplicateShop(shop) {
    try {
      const payload = {
        owner_id: shop.owner_id,
        organization_id: shop.organization_id,
        shop_name: `${shop.shop_name} - Copy`,
        name: `${shop.name || shop.shop_name} - Copy`,
        business_name: shop.business_name,
        business_email: shop.business_email,
        business_phone: shop.business_phone,
        website: shop.website,
        category: shop.category,
        currency: shop.currency,
        language: shop.language,
        default_language: shop.default_language,
        working_hours: shop.working_hours,
        business_hours: shop.business_hours,
        status: "active",
        widget_enabled: shop.widget_enabled
      };

      const { data: clonedShop, error } = await supabase
        .from("shops")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Duplicate widget settings if exists
      const { data: wsData } = await supabase
        .from("widget_settings")
        .select("*")
        .eq("shop_id", shop.id)
        .limit(1);

      if (wsData && wsData.length > 0) {
        const ws = wsData[0];
        await supabase.from("widget_settings").insert({
          shop_id: clonedShop.id,
          primary_color: ws.primary_color,
          widget_position: ws.widget_position,
          welcome_message: ws.welcome_message,
          settings: ws.settings
        });
      }

      toast.success(`Duplicated to "${clonedShop.shop_name}"`);
      await reloadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to duplicate shop.");
    }
  }

  // Toggle archive status
  async function handleToggleArchive(shop, shouldArchive) {
    try {
      const { error } = await supabase
        .from("shops")
        .update({ status: shouldArchive ? "archived" : "active" })
        .eq("id", shop.id);

      if (error) throw error;

      toast.success(shouldArchive ? "Shop archived successfully!" : "Shop restored successfully!");
      await reloadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to update shop status.");
    }
  }

  // Delete shop
  async function handleDeleteShop(shopId) {
    if (!window.confirm("Are you absolutely sure you want to delete this shop? All data, widget credentials, and logs will be lost permanently!")) return;
    try {
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("id", shopId);

      if (error) throw error;

      toast.success("Shop deleted successfully!");
      if (editingShop?.id === shopId) setEditingShop(null);
      await reloadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to delete shop.");
    }
  }

  // Transfer Shop
  async function handleTransferShop(e) {
    e.preventDefault();
    if (!shopToTransfer) return;

    try {
      if (transferForm.type === "org") {
        if (!transferForm.targetOrgId) throw new Error("Select an organization to transfer to.");
        const { error } = await supabase
          .from("shops")
          .update({ organization_id: transferForm.targetOrgId })
          .eq("id", shopToTransfer.id);

        if (error) throw error;
        toast.success("Shop transferred to organization successfully!");
      } else {
        if (!transferForm.targetEmail.trim()) throw new Error("Enter owner email to transfer.");
        const { data: targetProfile, error: profErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", transferForm.targetEmail.trim())
          .single();

        if (profErr || !targetProfile) throw new Error("Owner profile not found with that email.");

        const { error } = await supabase
          .from("shops")
          .update({ owner_id: targetProfile.id })
          .eq("id", shopToTransfer.id);

        if (error) throw error;
        toast.success("Shop ownership transferred successfully!");
      }

      setIsTransferOpen(false);
      setShopToTransfer(null);
      setTransferForm({ type: "org", targetOrgId: "", targetEmail: "" });
      await reloadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to transfer shop.");
    }
  }

  // Assign Team Member
  async function handleAssignMember(e) {
    e.preventDefault();
    if (!editingShop || !assignForm.profileId) return;

    try {
      const { data: member, error: memberError } = await supabase
        .from("shop_members")
        .insert({
          shop_id: editingShop.id,
          profile_id: assignForm.profileId,
          role: assignForm.role,
          is_active: true
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Insert linked shop_agent
      await supabase.from("shop_agents").insert({
        shop_member_id: member.id,
        display_name: null,
        status: "offline",
        max_active_conversations: 3
      });

      toast.success("Member assigned successfully!");
      setAssignForm({ profileId: "", role: "agent" });
      await loadAssignedMembers(editingShop.id);
      await loadAvailableProfiles(editingShop.id);
    } catch (err) {
      toast.error(err.message || "Failed to assign member.");
    }
  }

  // Unassign Team Member
  async function handleUnassignMember(member) {
    if (!window.confirm("Are you sure you want to remove this member from the shop?")) return;

    try {
      // 1. Delete linked agent record first
      await supabase
        .from("shop_agents")
        .delete()
        .eq("shop_member_id", member.id);

      // 2. Delete member record
      const { error } = await supabase
        .from("shop_members")
        .delete()
        .eq("id", member.id);

      if (error) throw error;

      toast.success("Member unassigned successfully!");
      await loadAssignedMembers(editingShop.id);
      await loadAvailableProfiles(editingShop.id);
    } catch (err) {
      toast.error(err.message || "Failed to unassign member.");
    }
  }

  const filteredShops = shops.filter(s => {
    const isArchived = s.status === "archived";
    return activeTab === "active" ? !isArchived : isArchived;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <Store className="h-8 w-8 text-blue-600" />
              Shop Manager
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Manage your e-commerce storefronts, widget settings, and agent assignments under <span className="font-semibold text-slate-800">{currentOrganization?.organization_name || "your organization"}</span>.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-sm font-bold shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Shop
          </button>
        </div>

        {/* Tab Filters & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Active Shops ({shops.filter(s => s.status !== "archived").length})
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "archived" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Archived ({shops.filter(s => s.status === "archived").length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-semibold bg-slate-100/60 px-3 py-1.5 rounded-lg border border-slate-200/50">
            Total Shops Loaded: {shops.length}
          </div>
        </div>

        {/* Shops Listing Grid */}
        {loadingWorkspace ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/65" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map(shop => {
              const categoryObj = CATEGORIES_LIST.find(c => c.value === (shop.categories?.slug || shop.category)) || { label: shop.categories?.name || shop.category || "General Retail" };
              return (
                <motion.div
                  key={shop.id}
                  layout
                  className="group relative flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Shop Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 group-hover:text-blue-650 transition-colors">
                          {shop.shop_name || shop.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {categoryObj.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${shop.widget_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} title={shop.widget_enabled ? 'Widget Online' : 'Widget Offline'} />
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="mt-5 space-y-2 flex-1">
                    {shop.website && (
                      <a
                        href={shop.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-slate-500 hover:text-blue-650 flex items-center gap-1 w-fit"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{shop.website}</span>
                      </a>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <Languages className="h-3 w-3" /> {shop.default_language?.toUpperCase() || shop.language?.toUpperCase() || "EN"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> {shop.currency || "USD"}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleStartEdit(shop)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200/80 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5" /> Configure
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateShop(shop)}
                        title="Duplicate Shop"
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setShopToTransfer(shop);
                          setIsTransferOpen(true);
                        }}
                        title="Transfer Shop"
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(shop, activeTab === "active")}
                        title={activeTab === "active" ? "Archive Shop" : "Restore Shop"}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      {activeTab === "archived" && (
                        <button
                          onClick={() => handleDeleteShop(shop.id)}
                          title="Delete Shop"
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-650 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredShops.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-dashed border-slate-250 flex flex-col items-center justify-center gap-3">
                <Store className="h-8 w-8 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">No {activeTab} shops found</p>
                <p className="text-xs text-slate-400 max-w-sm">Create a new storefront or configure your workspace properties using the buttons above.</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Config Workspace Editor */}
        <AnimatePresence>
          {editingShop && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
              <div className="absolute inset-0" onClick={() => setEditingShop(null)} />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="relative w-full max-w-2xl h-screen bg-white shadow-2xl flex flex-col z-50"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">Configure {editingShop.shop_name}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Customize shop defaults, widget styles, and team members</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingShop(null)}
                    className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Sub-Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 px-4 gap-1 shrink-0 overflow-x-auto scrollbar-none">
                  {[
                    { id: "general", label: "General", icon: Store },
                    { id: "widget", label: "Widget Customization", icon: Sliders },
                    { id: "hours", label: "Business Hours", icon: Clock },
                    { id: "languages", label: "Language & Currency", icon: Languages },
                    { id: "team", label: "Team Assignments", icon: UserCheck }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setEditorTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        editorTab === t.id ? "bg-white text-blue-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* TAB 1: GENERAL */}
                  {editorTab === "general" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Website URL</label>
                        <input
                          type="url"
                          value={editForm.website}
                          onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                        >
                          {CATEGORIES_LIST.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: WIDGET CUSTOMIZATION */}
                  {editorTab === "widget" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-250/60 p-4 rounded-2xl">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Enable Live Chat Widget</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Toggle widget visibility on your storefront.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.widgetEnabled}
                            onChange={(e) => setEditForm({ ...editForm, widgetEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Branding Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editForm.widgetColor}
                              onChange={(e) => setEditForm({ ...editForm, widgetColor: e.target.value })}
                              className="h-9 w-9 border-none cursor-pointer rounded-lg overflow-hidden"
                            />
                            <input
                              type="text"
                              value={editForm.widgetColor}
                              onChange={(e) => setEditForm({ ...editForm, widgetColor: e.target.value })}
                              className="flex-1 rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Alignment</label>
                          <select
                            value={editForm.widgetPosition}
                            onChange={(e) => setEditForm({ ...editForm, widgetPosition: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                          >
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Welcome Greeting</label>
                        <textarea
                          rows={3}
                          value={editForm.welcomeMessage}
                          onChange={(e) => setEditForm({ ...editForm, welcomeMessage: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BUSINESS HOURS */}
                  {editorTab === "hours" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Weekly Hours Schedule</label>
                        <input
                          type="text"
                          value={editForm.businessHours}
                          onChange={(e) => setEditForm({ ...editForm, businessHours: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                          placeholder="e.g. Mon-Fri: 09:00 - 18:00"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">
                        Your widget displays these operational hours to customers when all agents are offline or DND.
                      </p>
                    </div>
                  )}

                  {/* TAB 4: LANGUAGES & CURRENCIES */}
                  {editorTab === "languages" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Store Language</label>
                        <select
                          value={editForm.defaultLanguage}
                          onChange={(e) => setEditForm({ ...editForm, defaultLanguage: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                        >
                          {LANGUAGES_LIST.map(l => (
                            <option key={l.code} value={l.code}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Base Currency</label>
                        <select
                          value={editForm.currency}
                          onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 outline-none"
                        >
                          {CURRENCIES_LIST.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: TEAM ASSIGNMENTS */}
                  {editorTab === "team" && (
                    <div className="space-y-6">
                      <form onSubmit={handleAssignMember} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4">
                        <p className="text-xs font-bold text-slate-800">Assign Member to Store</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Select Profile</label>
                            <select
                              value={assignForm.profileId}
                              onChange={(e) => setAssignForm({ ...assignForm, profileId: e.target.value })}
                              className="w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                              required
                            >
                              <option value="">-- Choose User --</option>
                              {availableProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Access Role</label>
                            <select
                              value={assignForm.role}
                              onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                              className="w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                            >
                              <option value="agent">Agent (Handle Chats/Calls)</option>
                              <option value="manager">Manager (Store Admin)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Assign Member
                        </button>
                      </form>

                      {/* Assigned List */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-800">Assigned Team Members ({assignedMembers.length})</p>
                        <div className="space-y-2">
                          {assignedMembers.map(m => (
                            <div key={m.id} className="flex items-center justify-between border border-slate-150 p-3 rounded-2xl bg-white">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{m.profiles?.full_name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{m.profiles?.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  m.role === "manager" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {m.role}
                                </span>
                                <button
                                  onClick={() => handleUnassignMember(m)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                                  title="Unassign"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {assignedMembers.length === 0 && (
                            <p className="text-xs text-slate-400 italic">No managers or agents assigned to this shop.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Save */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50">
                  <button
                    onClick={() => setEditingShop(null)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Shop Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="absolute inset-0" onClick={() => setIsCreateOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md rounded-[2rem] border border-slate-100 bg-white shadow-2xl overflow-hidden flex flex-col z-50"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <h3 className="text-base font-extrabold text-slate-900">Create New Shop</h3>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleCreateShop} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Name</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                      placeholder="e.g. London Outlet"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Website URL</label>
                    <input
                      type="url"
                      value={createForm.website}
                      onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                      placeholder="https://londonoutlet.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                    >
                      {CATEGORIES_LIST.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer mt-2 shadow-lg shadow-blue-500/10"
                  >
                    Create & Activate Store
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Transfer Shop Modal */}
        <AnimatePresence>
          {isTransferOpen && shopToTransfer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="absolute inset-0" onClick={() => setIsTransferOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md rounded-[2rem] border border-slate-100 bg-white shadow-2xl overflow-hidden flex flex-col z-50"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Transfer {shopToTransfer.shop_name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Relocate shop to another workspace or user</p>
                  </div>
                  <button
                    onClick={() => setIsTransferOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleTransferShop} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Transfer Type</label>
                    <select
                      value={transferForm.type}
                      onChange={(e) => setTransferForm({ ...transferForm, type: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="org">Move to Another Organization</option>
                      <option value="owner">Transfer Ownership (Different User)</option>
                    </select>
                  </div>

                  {transferForm.type === "org" ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select Target Organization</label>
                      <select
                        value={transferForm.targetOrgId}
                        onChange={(e) => setTransferForm({ ...transferForm, targetOrgId: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">-- Choose Org --</option>
                        {allOrgs.map(o => (
                          <option key={o.id} value={o.id}>{o.organization_name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">New Owner Email Address</label>
                      <input
                        type="email"
                        value={transferForm.targetEmail}
                        onChange={(e) => setTransferForm({ ...transferForm, targetEmail: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                        placeholder="newowner@example.com"
                        required
                      />
                      <p className="text-[9px] text-amber-600 font-semibold leading-normal mt-1">
                        Warning: This transfers the database ownership row of this storefront. You will lose access to its settings immediately.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer mt-2 shadow-lg shadow-amber-500/10"
                  >
                    Transfer Storefront
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}