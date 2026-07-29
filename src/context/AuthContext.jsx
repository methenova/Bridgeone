import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/config/supabase";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "@/features/auth/services/auth.service";

import {
  getProfile,
} from "@/features/auth/services/profile.service";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  // Workspace & Multi-Shop States
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  async function loadWorkspace(userId, activeOrgId = null, activeShopId = null) {
    if (!userId) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setShops([]);
      setCurrentShop(null);
      return;
    }

    try {
      setLoadingWorkspace(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      const isAgent = profileData?.role === "agent";

      let orgs = [];
      let shopList = [];

      if (isAgent) {
        // Fetch shops agent belongs to
        const { data: memberData, error: memErr } = await supabase
          .from("shop_members")
          .select(`
            shop_id,
            shops (
              *,
              widget_settings ( primary_color, widget_position, welcome_message, settings ),
              shop_integrations ( provider, settings )
            )
          `)
          .eq("profile_id", userId);

        if (memErr) throw memErr;

        const rawShops = (memberData || [])
          .map(m => m.shops)
          .filter(Boolean);

        const orgIds = [...new Set(rawShops.map(s => s.organization_id).filter(Boolean))];

        if (orgIds.length > 0) {
          const { data: orgData, error: orgErr } = await supabase
            .from("organizations")
            .select("*")
            .in("id", orgIds);

          if (orgErr) throw orgErr;
          orgs = orgData || [];
        }

        shopList = rawShops;
      } else {
        // Fetch organizations owned by owner
        const { data: orgData, error: orgErr } = await supabase
          .from("organizations")
          .select("*")
          .eq("owner_id", userId)
          .order("created_at", { ascending: true });

        if (orgErr) throw orgErr;
        orgs = orgData || [];

        if (orgs.length > 0) {
          let targetOrgId = activeOrgId || localStorage.getItem(`active-org-${userId}`);
          let activeOrg = orgs.find(o => o.id === targetOrgId);
          if (!activeOrg) activeOrg = orgs[0];

          // Fetch shops for active organization
          const { data: shopData, error: shopErr } = await supabase
            .from("shops")
            .select(`
              *,
              widget_settings ( primary_color, widget_position, welcome_message, settings ),
              shop_integrations ( provider, settings )
            `)
            .eq("organization_id", activeOrg.id)
            .order("created_at", { ascending: true });

          if (shopErr) throw shopErr;
          shopList = shopData || [];
        }
      }

      setOrganizations(orgs);

      let activeOrg = null;
      if (orgs.length > 0) {
        const savedOrgId = activeOrgId || localStorage.getItem(`active-org-${userId}`);
        activeOrg = orgs.find(o => o.id === savedOrgId) || orgs[0];
        setCurrentOrganization(activeOrg);
        localStorage.setItem(`active-org-${userId}`, activeOrg.id);
      } else {
        setCurrentOrganization(null);
      }

      // Format shops
      const formattedShops = shopList.map(shop => {
        const ws = shop.widget_settings?.[0] || {};
        const customInt = shop.shop_integrations?.find(i => i.provider === 'custom')?.settings || {};
        return {
          ...shop,
          widget_color: ws.primary_color,
          widget_position: ws.widget_position,
          welcome_message: ws.welcome_message,
          business_hours: ws.settings?.business_hours,
          business_hours_config: ws.settings?.business_hours_config,
          routing_rules: ws.settings?.routing_rules,
          is_online: shop.widget_enabled,
          webhook_url: customInt.webhook_url,
          api_key: shop.api_key || customInt.api_key || "",
          google_analytics_id: customInt.google_analytics_id,
          meta_pixel_id: customInt.meta_pixel_id,
          shopify_domain: shop.shopify_domain || customInt.shopify_domain || "",
          woocommerce_url: customInt.woocommerce_url
        };
      });

      const filteredShops = activeOrg 
        ? formattedShops.filter(s => s.organization_id === activeOrg.id)
        : [];

      setShops(filteredShops);

      if (filteredShops.length > 0) {
        const savedShopId = activeShopId || localStorage.getItem(`active-shop-${userId}`);
        const activeShop = filteredShops.find(s => s.id === savedShopId) || filteredShops[0];
        setCurrentShop(activeShop);
        localStorage.setItem(`active-shop-${userId}`, activeShop.id);
      } else {
        setCurrentShop(null);
      }

    } catch (err) {
      console.warn("loadWorkspace error:", err);
    } finally {
      setLoadingWorkspace(false);
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;

      setUser(authUser);

      if (authUser) {
        try {
          const profileData = await getProfile(authUser.id);
          setProfile(profileData);
          await loadWorkspace(authUser.id);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setOrganizations([]);
        setCurrentOrganization(null);
        setShops([]);
        setCurrentShop(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(values) {
    const { user } = await loginUser(values);

    setUser(user);

    const profileData = await getProfile(user.id);

    setProfile(profileData);
    await loadWorkspace(user.id);

    return { user, profile: profileData };
  }

  async function refreshProfile() {
    if (!user) return null;
    const profileData = await getProfile(user.id);
    setProfile(profileData);
    await loadWorkspace(user.id);
    return profileData;
  }

  async function register(values) {
    const data = await registerUser(values);

    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const profileData = await getProfile(currentUser.id);
      setProfile(profileData);
      await loadWorkspace(currentUser.id);
    }

    return data;
  }

  async function logout() {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setUser(null);
      setProfile(null);
      setOrganizations([]);
      setCurrentOrganization(null);
      setShops([]);
      setCurrentShop(null);
    }
  }

  // Switcher & Management CRUD Operations
  async function switchOrganization(orgId) {
    if (!user) return;
    localStorage.removeItem(`active-shop-${user.id}`);
    await loadWorkspace(user.id, orgId);
  }

  async function switchShop(shopId) {
    if (!user) return;
    localStorage.setItem(`active-shop-${user.id}`, shopId);
    const activeShop = shops.find(s => s.id === shopId);
    if (activeShop) {
      setCurrentShop(activeShop);
    }
  }

  async function createOrganization(name) {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          owner_id: user.id,
          organization_name: name,
          business_email: user.email,
          status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadWorkspace(user.id, data.id);
      return data;
    } catch (err) {
      console.error("createOrganization error:", err);
      throw err;
    }
  }

  async function renameOrganization(orgId, newName) {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ organization_name: newName })
        .eq("id", orgId);

      if (error) throw error;
      await loadWorkspace(user.id, currentOrganization?.id);
    } catch (err) {
      console.error("renameOrganization error:", err);
      throw err;
    }
  }

  async function deleteOrganization(orgId) {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      const remainingOrgs = organizations.filter(o => o.id !== orgId);
      const nextOrgId = remainingOrgs.length > 0 ? remainingOrgs[0].id : null;
      localStorage.removeItem(`active-shop-${user.id}`);
      await loadWorkspace(user.id, nextOrgId);
    } catch (err) {
      console.error("deleteOrganization error:", err);
      throw err;
    }
  }

  async function transferOrganizationOwnership(orgId, targetEmail) {
    if (!user) return;
    try {
      const { data: targetProfile, error: profErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", targetEmail)
        .single();

      if (profErr || !targetProfile) {
        throw new Error("No user profile found with that email address.");
      }

      const { error } = await supabase
        .from("organizations")
        .update({ owner_id: targetProfile.id })
        .eq("id", orgId);

      if (error) throw error;

      await loadWorkspace(user.id);
    } catch (err) {
      console.error("transferOrganizationOwnership error:", err);
      throw err;
    }
  }

  async function createShopInActiveOrg(shopName, details = {}) {
    if (!user || !currentOrganization) return null;
    try {
      const cleanDomain = (details.website || "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "") || `${shopName.toLowerCase().replace(/\s+/g, "-")}.com`;

      const category = details.category || "Fashion & Apparel";

      const shopPayload = {
        owner_id: user.id,
        organization_id: currentOrganization.id,
        shop_name: shopName,
        name: shopName,
        business_name: currentOrganization.organization_name,
        business_email: currentOrganization.business_email || user.email,
        business_phone: currentOrganization.business_phone || "",
        website: details.website || `http://${cleanDomain}`,
        domain: cleanDomain,
        category: category,
        status: "active",
        widget_enabled: true
      };

      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .insert(shopPayload)
        .select()
        .single();

      if (shopError) throw shopError;

      const widgetPayload = {
        shop_id: shopData.id,
        primary_color: "#4F46E5",
        widget_position: "bottom-right",
        welcome_message: "How can we help you today?",
        settings: {
          business_hours: "Mon-Fri: 09:00 - 18:00",
          routing_rules: "all-agents"
        }
      };

      await supabase.from("widget_settings").insert(widgetPayload);

      await loadWorkspace(user.id, currentOrganization.id, shopData.id);
      return shopData;
    } catch (err) {
      console.error("createShopInActiveOrg error:", err);
      throw err;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,

        role: profile?.role,
        onboardingCompleted: profile?.onboarding_completed ?? false,

        loading,

        login,
        register,
        logout,
        refreshProfile,

        isAuthenticated: !!user,

        // Exposing Multi-Shop & Organization Switcher Controls
        organizations,
        currentOrganization,
        shops,
        currentShop,
        loadingWorkspace,
        reloadWorkspace: () => loadWorkspace(user?.id, currentOrganization?.id, currentShop?.id),
        switchOrganization,
        switchShop,
        createOrganization,
        renameOrganization,
        deleteOrganization,
        transferOrganizationOwnership,
        createShopInActiveOrg
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}