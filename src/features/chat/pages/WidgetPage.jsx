import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Video, VideoOff, PhoneOff, Mic, MicOff, Calendar, User, Mail, Phone, ChevronRight, Clock, Building, Users, RefreshCw, Maximize, Minimize, Tv, Wifi, WifiOff, Star, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import { SellerPeer } from "@/services/video/sellerPeer";

// Check if current time in shop timezone is outside operational hours, shifts, or holidays
function checkIsOutsideBusinessHours(shop) {
  if (!shop) return false;

  const config = shop.business_hours_config || { timezone: "UTC", holidays: [], shifts: [] };
  const timezone = config.timezone || "UTC";

  // Get current time in specified timezone
  const now = new Date();
  let timeInTZ;
  try {
    timeInTZ = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  } catch (e) {
    timeInTZ = now;
  }

  const currentYear = timeInTZ.getFullYear();
  const currentMonth = (timeInTZ.getMonth() + 1).toString().padStart(2, "0");
  const currentDate = timeInTZ.getDate().toString().padStart(2, "0");
  const todayStr = `${currentYear}-${currentMonth}-${currentDate}`; // "YYYY-MM-DD"
  const todayMDStr = `${currentMonth}-${currentDate}`; // "MM-DD"

  // Check holidays
  const holidays = config.holidays || [];
  if (holidays.includes(todayStr) || holidays.includes(todayMDStr)) {
    return true;
  }

  const dayName = timeInTZ.toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Mon"
  const currentHour = timeInTZ.getHours();
  const currentMin = timeInTZ.getMinutes();
  const currentMinutes = currentHour * 60 + currentMin;

  // Check shifts
  const shifts = config.shifts || [];
  if (shifts && shifts.length > 0) {
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    let insideAnyShift = false;
    for (const shift of shifts) {
      const startMin = parseTimeToMinutes(shift.start);
      const endMin = parseTimeToMinutes(shift.end);
      if (startMin !== null && endMin !== null) {
        if (currentMinutes >= startMin && currentMinutes <= endMin) {
          insideAnyShift = true;
          break;
        }
      }
    }

    if (!insideAnyShift) {
      return true; // Outside shifts
    }
    return false; // Within shifts
  }

  // Fallback to text parsing
  const textHours = shop.business_hours || "";
  if (textHours) {
    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(dayName);
    let activeForDay = false;
    if (textHours.toLowerCase().includes("mon-fri") && isWeekday) activeForDay = true;
    if (textHours.toLowerCase().includes("everyday") || textHours.toLowerCase().includes("24/7")) activeForDay = true;
    if (textHours.toLowerCase().includes(dayName.toLowerCase())) activeForDay = true;

    if (!activeForDay) return true;

    const match = textHours.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (match) {
      const [_, startStr, endStr] = match;
      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (currentMinutes < startMin || currentMinutes > endMin) {
        return true;
      }
    }
  }

  return false;
}

export default function WidgetPage() {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Web Audio chime synthesis helper
  const playAudioChime = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "accepted") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "ended") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(392.00, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "update") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880.00, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (e) {
      console.warn("[Sound] Synthesizer audio chime failed:", e);
    }
  };

  // HTML5 Browser Notification dispatch helper
  const sendBrowserNotification = (title, body) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body });
        } catch (e) {
          console.warn("[Notification] Direct Notification instantiation failed:", e);
        }
      }
    }
  };

  // Prompt for desktop browser notification permissions
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    // Load returning customer profile and history from local storage
    try {
      const storedName = localStorage.getItem("bo_customer_name") || "";
      const storedEmail = localStorage.getItem("bo_customer_email") || "";
      const storedPhone = localStorage.getItem("bo_customer_phone") || "";
      const storedLang = localStorage.getItem("bo_customer_language") || "en";

      const storedCalls = JSON.parse(localStorage.getItem("bo_previous_calls") || "[]");
      const storedProducts = JSON.parse(localStorage.getItem("bo_previous_products") || "[]");

      if (storedName) {
        setName(storedName);
        setHasRegisteredBefore(true);
      }
      if (storedEmail) setEmail(storedEmail);
      if (storedPhone) setPhone(storedPhone);
      setLanguage(storedLang);
      setPreviousCalls(storedCalls);
      setPreviousProducts(storedProducts);
    } catch (e) {
      console.warn("[LocalStorage] Failed to load returning customer profiles:", e);
    }

    // Monitor internet connectivity changes
    const handleOnline = () => {

      setIsOnline(true);
      toast.success("Internet connection restored!", { id: "network-status" });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Network disconnected. Please check your internet connection.", { id: "network-status", duration: 5000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Optimize media handshake: Query and cache permissions early to reduce call connection delay
    if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "camera" }).catch(() => { });
      navigator.permissions.query({ name: "microphone" }).catch(() => { });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Widget flow states: 'form' | 'calling' | 'connected' | 'offline' | 'callback-submitted'
  const [flowState, setFlowState] = useState("form");
  const [hasRegisteredBefore, setHasRegisteredBefore] = useState(false);

  // Caller identity form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Online agents count state
  const [onlineAgentsCount, setOnlineAgentsCount] = useState(0);

  // Online agents list state
  const [agentsList, setAgentsList] = useState([]);

  // Compute total online agents (including owner if shop is online)
  const totalOnlineCount = onlineAgentsCount + (shop?.is_online ? 1 : 0);
  const displayAgentsList = shop ? [
    {
      id: "owner-row",
      status: shop.is_online ? "Available" : "Offline",
      department: "Management",
      is_online: shop.is_online,
      profile_id: shop.owner_id,
      profiles: { full_name: shop.shop_name || shop.name || "Store Owner" }
    },
    ...agentsList.filter(a => a.id !== "owner-row")
  ] : agentsList;

  // Product detection states
  const [detectedProduct, setDetectedProduct] = useState(null);
  const [activeProductInquiry, setActiveProductInquiry] = useState(null);

  // Callback scheduling states
  const [bookedCallbackId, setBookedCallbackId] = useState(null);
  const [callbackTimezone, setCallbackTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTimeOnly, setCallbackTimeOnly] = useState("");

  // Returning customer profile and history states
  const [language, setLanguage] = useState("en");
  const [previousCalls, setPreviousCalls] = useState([]);
  const [previousProducts, setPreviousProducts] = useState([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Post-call feedback states
  const [postCallLogId, setPostCallLogId] = useState(null);
  const [answeringAgentName, setAnsweringAgentName] = useState("");
  const [finalDurationText, setFinalDurationText] = useState("");
  const [discussedProducts, setDiscussedProducts] = useState([]);
  const [customerRating, setCustomerRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Network connection state
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Queue position state
  const [queuePosition, setQueuePosition] = useState(1);

  // Offline callback form
  const [callbackTime, setCallbackTime] = useState("");

  // WebRTC Stream states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [iceState, setIceState] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [limitExceeded, setLimitExceeded] = useState(false);

  // Fullscreen and PiP states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);

  // Shared product states (Live consultations)
  const [pinnedProductCall, setPinnedProductCall] = useState(null);
  const [showProductDetailCall, setShowProductDetailCall] = useState(false);

  const peerRef = useRef(null);
  const containerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const currentCallLogIdRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // 1. Fetch Shop details & availability
  useEffect(() => {
    if (!shopId) return;

    async function loadShop() {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("id, name:shop_name, logo_url, widget_color, is_online, plan_name, business_hours, business_hours_config, owner_id, api_key")
          .eq("id", shopId)
          .single();

        if (error) throw error;
        setShop(data);
        window.BridgeOneShopId = shopId;
        window.BridgeOneShopApiKey = data.api_key || "";

        // Fetch call logs count for the current calendar month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { count: callCount } = await supabase
          .from("call_logs")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .gte("created_at", firstDay);

        const currentCalls = callCount || 0;
        const plan = data.plan_name || "free";

        // Query plans limit configuration from db
        const { data: planInfo } = await supabase
          .from("subscription_plans")
          .select("call_limit")
          .eq("id", plan)
          .maybeSingle();

        const limit = planInfo ? (planInfo.call_limit === -1 ? Infinity : planInfo.call_limit) : 10;

        const isClosed = checkIsOutsideBusinessHours(data);

        // Fetch active online agents
        const { count: onlineAgs } = await supabase
          .from("shop_agents")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("is_online", true);
        setOnlineAgentsCount(onlineAgs || 0);

        // Fetch all shop agents with profiles join
        const { data: teamAgs } = await supabase
          .from("shop_agents")
          .select(`
            id,
            status,
            department,
            is_online,
            profile_id,
            profiles:profile_id ( full_name, avatar_url )
          `)
          .eq("shop_id", shopId);
        if (teamAgs) {
          setAgentsList(teamAgs);
        }

        // Fetch all products for the shop to match referrer URLs
        const { data: prods } = await supabase
          .from("products")
          .select(`
            id,
            name,
            price,
            is_active,
            product_images (
              image_url
            )
          `)
          .eq("shop_id", shopId)
          .eq("is_active", true);

        if (prods) {
          // Detect current product based on parent referrer URL
          const referrer = document.referrer || "";

          // Try to find a product whose name/slug matches a segment of the referrer URL
          const matchedProd = prods.find(p => {
            const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return referrer.toLowerCase().includes(slug) || referrer.toLowerCase().includes(p.id);
          });

          if (matchedProd) {
            setDetectedProduct(matchedProd);
          } else if (prods.length > 0) {
            // Default recommendation fallback
            setDetectedProduct(prods[0]);
          }
        }

        if (currentCalls >= limit) {
          setLimitExceeded(true);
        } else if (!data.is_online || isClosed) {
          setFlowState("offline");
        }
      } catch (err) {
        console.error("[Widget] Failed to load shop:", err);
        toast.error("Error loading merchant widget");
      } finally {
        setLoading(false);
      }
    }

    loadShop();

    // Subscribe to shop status changes dynamically
    const shopChannel = supabase
      .channel(`widget-shop-${shopId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shops", filter: `id=eq.${shopId}` },
        (payload) => {
          const updatedShop = payload.new;
          setShop((prev) => ({ ...prev, ...updatedShop }));

          const isClosed = checkIsOutsideBusinessHours(updatedShop);
          if (updatedShop.is_online && !isClosed) {
            setFlowState((curr) => (curr === "offline" ? "form" : curr));
          } else {
            // Only force offline state if they aren't actively in a call
            setFlowState((curr) => (curr !== "calling" && curr !== "connected" ? "offline" : curr));
          }
        }
      )
      .subscribe();

    // Subscribe to agent presence changes dynamically
    const agentsChannel = supabase
      .channel(`widget-agents-${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_agents", filter: `shop_id=eq.${shopId}` },
        async () => {
          const { count } = await supabase
            .from("shop_agents")
            .select("id", { count: "exact", head: true })
            .eq("shop_id", shopId)
            .eq("is_online", true);
          setOnlineAgentsCount(count || 0);

          const { data: teamAgs } = await supabase
            .from("shop_agents")
            .select(`
              id,
              status,
              department,
              is_online,
              profile_id,
              profiles:profile_id ( full_name, avatar_url )
            `)
            .eq("shop_id", shopId);
          if (teamAgs) {
            setAgentsList(teamAgs);
          }
        }
      )
      .subscribe();

    // Listen to parent page postMessage events for viewed products
    const handleParentMessage = (event) => {
      if (event.data && event.data.type === "PRODUCT_VIEWED" && event.data.product) {
        console.log("[Widget] Parent product viewed:", event.data.product);
        setDetectedProduct(event.data.product);
      }
    };
    window.addEventListener("message", handleParentMessage);

    // Detect if Picture in Picture is supported
    if (typeof document !== "undefined" && document.pictureInPictureEnabled) {
      setPipSupported(true);
    }

    // Subscribe to live shop broadcasts for product pin signals
    console.log("[Widget] Subscribing to live:shopId channel for product pins...");
    const liveChannel = supabase.channel(`live:${shopId}`);

    liveChannel
      .on("broadcast", { event: "pin" }, ({ payload }) => {
        console.log("[Widget] Received pin broadcast:", payload);
        if (payload?.product) {
          setPinnedProductCall(payload.product);
          setShowProductDetailCall(true); // Open details automatically when pinned

          // Log product locally for returning customer history
          try {
            const existing = JSON.parse(localStorage.getItem("bo_previous_products") || "[]");
            const filtered = existing.filter(p => p.id !== payload.product.id);
            const updated = [payload.product, ...filtered].slice(0, 5);
            localStorage.setItem("bo_previous_products", JSON.stringify(updated));
            setPreviousProducts(updated);
          } catch (err) {
            console.warn(err);
          }
        } else {
          setPinnedProductCall(null);
          setShowProductDetailCall(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(shopChannel);
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(liveChannel);
      window.removeEventListener("message", handleParentMessage);
    };
  }, [shopId]);

  // Dispatch notifications when WebRTC Call starts connecting or gets accepted
  useEffect(() => {
    if (flowState === "connected") {
      playAudioChime("accepted");
      sendBrowserNotification("Call Connected!", `You are now live with a ${shop?.name || "merchant"} expert.`);
    }
  }, [flowState, shop]);

  // Track queue updates dynamically to send notifications
  const prevQueuePosRef = useRef(queuePosition);
  useEffect(() => {
    if (flowState === "calling" && queuePosition !== prevQueuePosRef.current) {
      playAudioChime("update");
      sendBrowserNotification("Queue Position Shift", `Your position is now #${queuePosition} in line.`);
      prevQueuePosRef.current = queuePosition;
    }
  }, [queuePosition, flowState]);

  // Track call ended triggers
  const prevFlowStateRef = useRef(flowState);
  useEffect(() => {
    if (prevFlowStateRef.current === "connected" && flowState !== "connected") {
      playAudioChime("ended");
      sendBrowserNotification("Call Terminated", "Your live video consultation session has ended.");
    }
    prevFlowStateRef.current = flowState;
  }, [flowState]);

  // Handle calling ringing timeout (45 seconds)
  const callingTimeoutRef = useRef(null);
  useEffect(() => {
    if (flowState === "calling") {
      callingTimeoutRef.current = setTimeout(() => {
        setFlowState("call-timeout");
        playAudioChime("ended");
      }, 45000);
    } else {
      clearTimeout(callingTimeoutRef.current);
    }
    return () => clearTimeout(callingTimeoutRef.current);
  }, [flowState]);

  // Queue position calculation logic
  useEffect(() => {
    if (flowState !== "calling" || !shopId) return;

    let active = true;
    let roomCreatedTime = null;
    const roomRecordId = peerRef.current?.roomId;

    async function fetchQueuePosition() {
      if (!active) return;
      try {
        if (!roomCreatedTime && roomRecordId) {
          const { data: currentRoom } = await supabase
            .from("video_rooms")
            .select("created_at")
            .eq("id", roomRecordId)
            .maybeSingle();
          if (currentRoom) {
            roomCreatedTime = currentRoom.created_at;
          }
        }

        // Query all rooms created before or at the same time as our room that are not yet answered
        let query = supabase
          .from("video_rooms")
          .select("id", { count: "exact" })
          .eq("shop_id", shopId)
          .is("answer", null);

        if (roomCreatedTime) {
          query = query.lte("created_at", roomCreatedTime);
        }

        const { count, error } = await query;
        if (!error && active) {
          setQueuePosition(count || 1);
        }
      } catch (err) {
        console.warn("Failed to fetch queue position:", err);
      }
    }

    fetchQueuePosition();

    // Poll every 3 seconds for safety, and subscribe to video_rooms updates
    const interval = setInterval(fetchQueuePosition, 3000);

    const queueChannel = supabase
      .channel(`widget-queue-${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_rooms", filter: `shop_id=eq.${shopId}` },
        () => {
          fetchQueuePosition();
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(queueChannel);
    };
  }, [flowState, shopId, peerRef.current?.roomId]);

  // 2. Attach video elements on state changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, flowState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, flowState]);

  // 3. Track call duration
  useEffect(() => {
    if (flowState === "connected") {
      callStartTimeRef.current = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(callTimerRef.current);
  }, [flowState]);

  // 4. Handle Starting Call
  async function handleStartCall(e, inquiryProduct = null) {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Direct routing to callback scheduler if no agents are available
    if (totalOnlineCount === 0) {
      const confirmCallback = window.confirm("All agents are currently offline. Would you like to schedule a callback appointment instead?");
      if (confirmCallback) {
        setFlowState("offline");
      }
      return;
    }

    const productToInquire = inquiryProduct || activeProductInquiry;

    // Cache customer profile in local storage
    try {
      localStorage.setItem("bo_customer_name", name.trim());
      localStorage.setItem("bo_customer_email", email.trim() || "");
      localStorage.setItem("bo_customer_phone", phone.trim() || "");
    } catch (err) {
      console.warn("[LocalStorage] Profile save skipped:", err);
    }

    setFlowState("calling");
    toast.loading("Accessing media devices...", { id: "widget-media" });

    let mediaStream = null;
    try {
      // Prompt for camera/mic
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaErr) {
        console.warn("[Widget] Webcam blocked, trying audio only:", mediaErr);
        toast.success("Starting audio-only consultation", { id: "widget-media" });
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      }
      setLocalStream(mediaStream);
      setCamEnabled(mediaStream.getVideoTracks().length > 0);
      toast.success("Devices ready", { id: "widget-media" });
    } catch (err) {
      console.error("[Widget] Media access denied:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Camera/microphone permissions were denied. Please unlock settings in your browser address bar.", { id: "widget-media", duration: 8000 });
      } else {
        toast.error("Could not access camera or microphone", { id: "widget-media" });
      }
      setFlowState("form");
      return;
    }

    try {
      // 1. Create a Call Log row first (defaults to status 'missed')
      let log, logErr;
      const { data: authSession } = await supabase.auth.getSession();
      if (!authSession.session) {
        const { data, error } = await supabase.functions.invoke("guest-gateway", {
          body: {
            action: "create_call_log",
            shopId,
            apiKey: shop?.api_key || window.BridgeOneShopApiKey || "",
            customerName: name.trim(),
            customerEmail: email.trim() || null,
            customerPhone: phone.trim() || null,
            status: "missed",
            duration: 0,
            productsShared: productToInquire ? [productToInquire.name] : null,
          }
        });
        log = Array.isArray(data) ? data[0] : data;
        logErr = error;
      } else {
        const res = await supabase
          .from("call_logs")
          .insert({
            shop_id: shopId,
            customer_name: name.trim(),
            customer_email: email.trim() || null,
            customer_phone: phone.trim() || null,
            status: "missed",
            products_shared: productToInquire ? [productToInquire.name] : null
          })
          .select();
        log = Array.isArray(res.data) ? res.data[0] : res.data;
        logErr = res.error;
      }

      if (logErr) throw logErr;
      currentCallLogIdRef.current = log.id;

      // 2. Setup Unique Room Code (Embedding log.id for the LivePage to parse)
      const roomCode = `call_${shopId}_${log.id}_${Math.random().toString(36).substring(2, 9)}`;

      // 3. Instantiate SellerPeer (Host of Room)
      const peer = new SellerPeer(
        shopId,
        shop?.owner_id, // Satisfy FK constraint by using the shop owner's valid profile ID
        mediaStream,
        // onRemoteStream callback
        (remStream) => {
          console.log("[Widget] Remote stream received");
          setRemoteStream(remStream);
          setFlowState("connected");
        },
        roomCode,
        // onConnectionStateChange callback
        (state) => {
          console.log("[Widget] ICE state:", state);
          setIceState(state);
          if (state === "failed") {
            toast.error("Call connection lost");
            handleHangUp();
          }
        }
      );

      peer.onRoomDeleted = () => {
        console.log("[Widget] Call terminated by seller");
        toast.info("Call ended by seller");
        handleHangUp();
      };

      peerRef.current = peer;
      await peer.start();

    } catch (err) {
      console.error("[Widget] Failed to initialize peer connection:", err);
      toast.error("Call failed to initialize");
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
      setFlowState("form");
    }
  }

  // 5. Handle Hanging Up Call
  async function handleHangUp() {
    // Stop local video tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    // Save final call duration & status in DB
    const logId = currentCallLogIdRef.current;
    if (logId) {
      const finalDuration = callStartTimeRef.current
        ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      // Log call locally for returning customer history
      try {
        const dateStr = new Date().toISOString();
        const durationStr = finalDuration > 0 ? `${Math.floor(finalDuration / 60)}m ${finalDuration % 60}s` : "0s";
        const statusStr = finalDuration > 0 ? "Completed" : "Missed";

        const existing = JSON.parse(localStorage.getItem("bo_previous_calls") || "[]");
        const updated = [{ date: dateStr, duration: durationStr, status: statusStr }, ...existing].slice(0, 5);
        localStorage.setItem("bo_previous_calls", JSON.stringify(updated));
        setPreviousCalls(updated);
      } catch (err) {
        console.warn("[LocalStorage] Call log save skipped:", err);
      }

      try {
        // Fetch detailed info first to get agent_id and products_shared
        const { data: callDetails } = await supabase
          .from("call_logs")
          .select("*")
          .eq("id", logId)
          .single();

        if (callDetails) {
          setPostCallLogId(logId);
          setDiscussedProducts(callDetails.products_shared || []);
          setFinalDurationText(finalDuration > 0 ? `${Math.floor(finalDuration / 60)}m ${finalDuration % 60}s` : "0s");

          if (callDetails.agent_id) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", callDetails.agent_id)
              .single();
            if (prof) {
              setAnsweringAgentName(prof.full_name);
            }
          }
        }

        const { data: authSession } = await supabase.auth.getSession();
        if (!authSession.session) {
          await supabase.functions.invoke("guest-gateway", {
            body: {
              action: "update_call_log",
              shopId,
              apiKey: shop?.api_key || window.BridgeOneShopApiKey || "",
              id: logId,
              duration: finalDuration,
              status: finalDuration > 0 ? "completed" : "missed"
            }
          });
        } else {
          await supabase
            .from("call_logs")
            .update({
              duration: finalDuration,
              status: finalDuration > 0 ? "completed" : "missed"
            })
            .eq("id", logId);
        }

        // Transition to post-call screen only if the call was successfully connected/completed!
        if (finalDuration > 0) {
          setFlowState("post-call");
          setFeedbackSubmitted(false);
          setCustomerRating(5);
          setFeedbackText("");
        } else {
          setFlowState(shop?.is_online ? "form" : "offline");
          window.parent.postMessage("close-widget", "*");
          resetFields();
        }
      } catch (err) {
        console.warn("[Widget] Failed to process call summary details:", err);
        setFlowState(shop?.is_online ? "form" : "offline");
        window.parent.postMessage("close-widget", "*");
        resetFields();
      }
      currentCallLogIdRef.current = null;
    } else {
      setFlowState(shop?.is_online ? "form" : "offline");
      window.parent.postMessage("close-widget", "*");
      resetFields();
    }

    // Destroy peer session
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  }

  function resetFields() {
    // Reset identity fields
    setName("");
    setEmail("");
    setPhone("");
    setCallbackTime("");
    setCallbackDate("");
    setCallbackTimeOnly("");
    setBookedCallbackId(null);
    setActiveProductInquiry(null);
  }

  // Handle call request with specific product inquiry
  async function handleStartCallWithProduct(product) {
    setActiveProductInquiry(product);
    await handleStartCall(null, product);
  }

  // Sync date + time inputs with single callbackTime state
  useEffect(() => {
    if (callbackDate && callbackTimeOnly) {
      setCallbackTime(`${callbackDate}T${callbackTimeOnly}`);
    }
  }, [callbackDate, callbackTimeOnly]);

  // Parse existing callbackTime for edit form
  useEffect(() => {
    if (callbackTime && callbackTime.includes("T")) {
      const [d, t] = callbackTime.split("T");
      setCallbackDate(d);
      setCallbackTimeOnly(t.substring(0, 5));
    }
  }, [flowState]);

  // 6. Handle Offline Callback Request
  async function handleScheduleCallback(e) {
    e.preventDefault();
    if (!name.trim() || !callbackDate || !callbackTimeOnly) {
      toast.error("Please select a date, time, and enter your name");
      return;
    }

    const scheduledISO = new Date(`${callbackDate}T${callbackTimeOnly}`).toISOString();

    // Cache customer profile in local storage
    try {
      localStorage.setItem("bo_customer_name", name.trim());
      localStorage.setItem("bo_customer_email", email.trim() || "");
      localStorage.setItem("bo_customer_phone", phone.trim() || "");
    } catch (err) {
      console.warn("[LocalStorage] Profile save skipped:", err);
    }

    try {
      if (bookedCallbackId) {
        // Edit existing callback
        const { error } = await supabase
          .from("callback_requests")
          .update({
            customer_name: name.trim(),
            customer_email: email.trim() || null,
            customer_phone: phone.trim() || null,
            scheduled_time: scheduledISO,
            notes: `Timezone: ${callbackTimezone}`
          })
          .eq("id", bookedCallbackId);

        if (error) throw error;
        toast.success("Callback request updated!");
        sendBrowserNotification("Appointment Rescheduled", `Your callback was updated for ${callbackDate} at ${callbackTimeOnly}.`);
        playAudioChime("accepted");
      } else {
        // Create new callback
        let data, error;
        const { data: authSession } = await supabase.auth.getSession();
        if (!authSession.session) {
          const { data: resData, error: resErr } = await supabase.functions.invoke("guest-gateway", {
            body: {
              action: "create_callback",
              shopId,
              apiKey: shop?.api_key || window.BridgeOneShopApiKey || "",
              customerName: name.trim(),
              customerEmail: email.trim() || null,
              customerPhone: phone.trim() || null,
              scheduledTime: scheduledISO,
            }
          });
          data = Array.isArray(resData) ? resData[0] : resData;
          error = resErr;
        } else {
          const res = await supabase
            .from("callback_requests")
            .insert({
              shop_id: shopId,
              customer_name: name.trim(),
              customer_email: email.trim() || null,
              customer_phone: phone.trim() || null,
              scheduled_time: scheduledISO,
              status: "pending",
              notes: `Timezone: ${callbackTimezone}`
            })
            .select();
          data = Array.isArray(res.data) ? res.data[0] : res.data;
          error = res.error;
        }

        if (error) throw error;
        setBookedCallbackId(data.id);
        toast.success("Callback scheduled successfully!");
        sendBrowserNotification("Callback Booked", `Confirmed for ${callbackDate} at ${callbackTimeOnly} (${callbackTimezone}).`);
        playAudioChime("accepted");
      }
      setFlowState("callback-submitted");
    } catch (err) {
      console.error("[Widget] Callback scheduling error:", err);
      toast.error("Failed to schedule callback. Please retry.");
    }
  }

  // Cancel scheduled callback
  async function handleCancelCallback() {
    if (!bookedCallbackId) return;
    if (!window.confirm("Are you sure you want to cancel this callback appointment?")) return;

    try {
      const { error } = await supabase
        .from("callback_requests")
        .update({ status: "cancelled" })
        .eq("id", bookedCallbackId);

      if (error) throw error;
      toast.success("Callback request cancelled");
      sendBrowserNotification("Callback Cancelled", "Your scheduled appointment has been cancelled.");
      playAudioChime("ended");
      setBookedCallbackId(null);
      setCallbackTime("");
      setCallbackDate("");
      setCallbackTimeOnly("");
      setFlowState("offline");
    } catch (err) {
      console.error("[Widget] Callback cancellation error:", err);
      toast.error("Failed to cancel callback. Please retry.");
    }
  }

  // Toggles full screen on video element container
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.warn("[Fullscreen] Failed to request:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  // Toggles picture-in-picture mode on the remote video track
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (remoteVideoRef.current) {
        await remoteVideoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("[PiP] Toggle error:", err);
    }
  };

  // 7. Toggle Mic/Cam controls
  function toggleMic() {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  }

  function toggleCamera() {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamEnabled(videoTrack.enabled);
      }
    }
  }

  // Switch call queue to offline callback schedule
  async function handleSwitchToCallback() {
    // Stop local video tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    // Cancel current call log
    const logId = currentCallLogIdRef.current;
    if (logId) {
      try {
        const { data: authSession } = await supabase.auth.getSession();
        if (!authSession.session) {
          await supabase.functions.invoke("guest-gateway", {
            body: {
              action: "update_call_log",
              shopId,
              apiKey: shop?.api_key || window.BridgeOneShopApiKey || "",
              id: logId,
              status: "missed"
            }
          });
        } else {
          await supabase
            .from("call_logs")
            .update({
              status: "missed"
            })
            .eq("id", logId);
        }
      } catch (err) {
        console.warn("[Widget] Failed to mark call missed:", err);
      }
      currentCallLogIdRef.current = null;
    }

    // Destroy peer session
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setFlowState("offline");
  }

  // Formatting helpers
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const primaryColor = shop?.widget_color || "#2563eb";

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        <span className="mt-3 text-xs uppercase tracking-widest font-bold">Loading...</span>
      </div>
    );
  }

  if (limitExceeded) {
    return (
      <div className="h-screen flex flex-col bg-slate-50 text-slate-100 overflow-hidden font-sans border border-slate-200 shadow-2xl relative select-none">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-white shadow-sm/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
              {shop?.logo_url ? <img src={shop.logo_url} alt="" className="h-full w-full object-cover" /> : <Video className="h-4.5 w-4.5 text-slate-500" />}
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">{shop?.name || "Live Consultation"}</h1>
            </div>
          </div>
          <button
            onClick={() => window.parent.postMessage("close-widget", "*")}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/60 shadow-sm hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5 bg-slate-50">
          <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center animate-bounce">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-extrabold text-slate-900">Call Limit Reached</h2>
            <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed mx-auto">
              This merchant has reached their monthly video consultation call limit. Please contact store support for assistance.
            </p>
          </div>
          <button
            onClick={() => window.parent.postMessage("close-widget", "*")}
            className="rounded-xl border border-slate-200 hover:border-slate-200 bg-white/60 shadow-sm hover:bg-slate-100 text-xs font-semibold px-6 py-2.5 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Close Widget
          </button>
        </main>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-slate-50 text-slate-100 overflow-hidden font-sans border border-slate-200 shadow-2xl relative select-none">

      {/* Keyboard, Screen Reader and Mobile Responsive Style Injections */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-spin, .animate-bounce, .animate-ping, .animate-pulse {
            animation: none !important;
            transition: none !important;
          }
        }
        /* Focus styles for keyboard accessibility */
        *:focus-visible {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
        /* Mobile Safe Area and Viewport Height overrides */
        .h-screen {
          height: 100vh !important;
          height: 100dvh !important;
        }
        header {
          padding-top: calc(1rem + env(safe-area-inset-top, 0px)) !important;
          padding-left: calc(1.25rem + env(safe-area-inset-left, 0px)) !important;
          padding-right: calc(1.25rem + env(safe-area-inset-right, 0px)) !important;
        }
        main {
          padding-left: calc(1.25rem + env(safe-area-inset-left, 0px)) !important;
          padding-right: calc(1.25rem + env(safe-area-inset-right, 0px)) !important;
          padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px)) !important;
        }
        /* Touch action optimizations */
        button, select, input {
          touch-action: manipulation;
        }
        /* Landscape Mode Mobile Optimization */
        @media (max-height: 520px) and (orientation: landscape) {
          .my-auto {
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          /* Adjust video room controls */
          .absolute.bottom-4 {
            bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px)) !important;
          }
          /* Minimize picture-in-picture element in landscape orientation */
          .top-16 {
            top: 3.5rem !important;
            height: 4.5rem !important;
          }
          /* Compress welcome greeting text size */
          h2 {
            font-size: 0.95rem !important;
          }
        }
      `}</style>

      {/* Network offline error bar */}
      {!isOnline && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-rose-600/90 text-white px-4 py-1.5 text-[9px] font-black tracking-widest text-center uppercase flex items-center justify-center gap-1.5 shrink-0 z-50"
        >
          <WifiOff className="h-3 w-3 animate-pulse" />
          <span>Offline · Reconnecting to server...</span>
        </div>
      )}

      {/* Widget Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-white shadow-sm/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
            {shop?.logo_url ? (
              <img src={shop.logo_url} alt={`${shop.name} Logo`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <Video className="h-4.5 w-4.5 text-slate-500" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">{shop?.name || "Live Consultation"}</h1>
            <div className="flex items-center gap-1.5 mt-0.5" aria-live="polite">
              <span className={`h-1.5 w-1.5 rounded-full ${shop?.is_online ? "bg-green-500" : "bg-slate-500"}`} />
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                {shop?.is_online ? "Online Now" : "Offline"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleHangUp}
          aria-label="Close widget window"
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/60 shadow-sm hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main Body Flow */}
      <main className="flex-1 overflow-y-auto p-5 flex flex-col relative min-h-0 bg-slate-50">

        {/* State A: Calling Form */}
        {flowState === "form" && (() => {
          const getGreeting = () => {
            const hr = new Date().getHours();
            if (hr >= 5 && hr < 12) return "Good Morning";
            if (hr >= 12 && hr < 17) return "Good Afternoon";
            return "Good Evening";
          };

          return (
            <form onSubmit={handleStartCall} className="my-auto space-y-5 flex flex-col justify-center">
              <div className="text-center space-y-2 mb-1">
                <span className="text-[10px] text-blue-500 uppercase tracking-widest font-black block">
                  {getGreeting()} · Welcome to {shop?.name || "Store"}
                </span>

                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {shop?.welcome_message || "Start a Live Consultation"}
                </h2>

                <div className="flex justify-center gap-2 mt-1">
                  {totalOnlineCount > 0 ? (
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                      ● Active Experts Online: {totalOnlineCount}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse">
                      ● Queue Busy / Standby Routing Active
                    </span>
                  )}
                </div>
              </div>

              {/* Status details indicators */}
              <div className="grid grid-cols-2 gap-2 text-[10px] leading-normal font-semibold">
                <div className="bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider block text-[8px]">Est. Wait Time</span>
                  <span className="font-bold text-slate-900 text-xs block">
                    {totalOnlineCount > 0 ? "< 2 minutes" : "< 5 minutes"}
                  </span>
                </div>

                <div className="bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 space-y-1 min-w-0">
                  <span className="text-slate-500 uppercase tracking-wider block text-[8px] truncate">Store hours status</span>
                  <span className="font-bold text-slate-900 text-xs block truncate text-green-400">
                    Open now
                  </span>
                </div>
              </div>

              {/* Detected Viewed Product Card */}
              {detectedProduct && (
                <div className="bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 space-y-3 text-left">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-lg bg-white shadow-sm border border-slate-200/50 overflow-hidden shrink-0 flex items-center justify-center">
                      {detectedProduct.product_images?.[0]?.image_url || detectedProduct.image_url ? (
                        <img src={detectedProduct.product_images?.[0]?.image_url || detectedProduct.image_url} alt={detectedProduct.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-slate-500 animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[8px] text-blue-400 uppercase tracking-wider font-bold block">Active Product Details</span>
                      <h3 className="text-[11px] font-bold text-slate-900 leading-tight truncate">
                        {detectedProduct.name}
                      </h3>
                      <span className="text-xs font-black text-blue-400 block leading-tight">
                        ${detectedProduct.price}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!name.trim()) {
                        toast.info("Please enter your name below to start!");
                        document.querySelector('input[placeholder="Your Name"]')?.focus();
                        return;
                      }
                      handleStartCallWithProduct(detectedProduct);
                    }}
                    className="w-full py-2 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Talk about this product</span>
                  </button>
                </div>
              )}

              {/* Roster Live Availability Grid */}
              {displayAgentsList && displayAgentsList.length > 0 && (
                <div className="bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-slate-500 uppercase tracking-wider block text-[8px] font-bold">Roster Availability</span>
                  <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                    {displayAgentsList.map((ag) => {
                      const name = ag.profiles?.full_name || "Agent";
                      const avatar = ag.profiles?.avatar_url;
                      const status = ag.status || "Offline";
                      const dept = ag.department || "Consultant";
                      const isOnline = ag.is_online;

                      let statusBadgeColor = "bg-slate-600";
                      let statusText = "Offline";

                      if (isOnline) {
                        if (status === "Available") {
                          statusBadgeColor = "bg-green-500";
                          statusText = "Available";
                        } else if (status === "Busy" || status === "In Call" || status === "Meeting") {
                          statusBadgeColor = "bg-rose-500 animate-pulse";
                          statusText = status;
                        } else {
                          statusBadgeColor = "bg-amber-500";
                          statusText = status; // Away, Break
                        }
                      }

                      return (
                        <div key={ag.id} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2">
                            <div className="h-6.5 w-6.5 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                              {avatar ? (
                                <img src={avatar} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-black text-slate-500">{name[0]}</span>
                              )}
                            </div>
                            <div className="text-left">
                              <span className="font-bold text-slate-900 block leading-tight">{name}</span>
                              <span className="text-slate-500 text-[8px] leading-tight block">{dept}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`h-1.5 w-1.5 rounded-full ${statusBadgeColor}`} />
                            <span className="text-[9px] text-slate-500 capitalize">{statusText}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!hasRegisteredBefore ? (
                <div className="space-y-3.5">
                  {/* Name */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    aria-label="Enter your name"
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white shadow-sm focus-visible:outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address (Optional)"
                    value={email}
                    aria-label="Enter your email address (optional)"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white shadow-sm focus-visible:outline-none transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Phone className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    aria-label="Enter your phone number (optional)"
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white shadow-sm focus-visible:outline-none transition-all"
                  />
                </div>

                {/* Preferred Language Selection */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <span className="text-[10px] font-bold">LA</span>
                  </span>
                  <select
                    value={language}
                    aria-label="Select preferred consultation language"
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      try { localStorage.setItem("bo_customer_language", e.target.value); } catch (err) { }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-8 py-3 text-xs text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="en">English (Preferred Language)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-555">
                    ▼
                  </span>
                </div>
              </div>
              ) : (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center space-y-1.5 shadow-sm">
                  <p className="text-xs text-slate-700 font-medium">
                    Welcome back, <span className="font-bold text-slate-900">{name}</span>!
                  </p>
                  <button
                    type="button"
                    onClick={() => setHasRegisteredBefore(false)}
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer focus-visible:outline-none"
                  >
                    Not you? Edit details
                  </button>
                </div>
              )}

              {/* Collapsible History Section */}
              {((previousCalls && previousCalls.length > 0) || (previousProducts && previousProducts.length > 0)) && (
                <div className="bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-left">
                  <button
                    type="button"
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                    aria-expanded={showHistoryPanel}
                    aria-label="Toggle returning customer activity history"
                    className="w-full flex justify-between items-center text-slate-500 text-[8px] font-bold uppercase tracking-wider cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
                  >
                    <span>View Your History ({previousCalls.length} calls · {previousProducts.length} items)</span>
                    <span>{showHistoryPanel ? "▲" : "▼"}</span>
                  </button>

                  {showHistoryPanel && (
                    <div className="space-y-3 pt-1.5 border-t border-slate-200/60 text-[10px]">
                      {/* Previous Calls list */}
                      {previousCalls.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Past Consultations</span>
                          {previousCalls.map((c, i) => (
                            <div key={i} className="flex justify-between text-slate-350">
                              <span>{new Date(c.date).toLocaleDateString()} - {c.status}</span>
                              <span>{c.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Previous Products list */}
                      {previousProducts.length > 0 && (
                        <div className="space-y-1.5 pt-1.5 border-t border-slate-200/40">
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Recent Shared Catalog</span>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {previousProducts.map((p, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setDetectedProduct(p);
                                  toast.success(`Inquiry set to: ${p.name}`);
                                }}
                                role="button"
                                aria-label={`Select shared product ${p.name}`}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2 shrink-0 w-24 space-y-1 text-center cursor-pointer hover:border-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all"
                              >
                                <span className="font-bold text-slate-900 block truncate leading-tight text-[9px]">{p.name}</span>
                                <span className="text-[9px] text-blue-400 block">${p.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  aria-label="Initiate live video consultation"
                  className="w-full rounded-xl py-3.5 text-xs font-bold text-slate-900 shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
                >
                  <Video className="h-4.5 w-4.5" />
                  <span>Start Video Consultation</span>
                </button>
                {hasRegisteredBefore && (
                  <button
                    type="button"
                    onClick={() => setFlowState("offline")}
                    className="w-full rounded-xl py-3.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                    <span>Leave a Message</span>
                  </button>
                )}
              </div>
            </form>
          );
        })()}

        {/* State B: Dialing/Calling Screen */}
        {flowState === "calling" && (
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-6 py-6" aria-live="polite">

            {/* Ringing animation */}
            <div className="relative flex items-center justify-center h-20 w-20 mx-auto">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500/10 opacity-75" />
              <div className="relative h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 animate-pulse">
                <Video className="h-6 w-6" />
              </div>
            </div>

            {/* Live Queue details */}
            <div className="space-y-4 max-w-[280px] mx-auto w-full">
              <div className="space-y-1.5" aria-live="polite">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Connecting Consultation...</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Connecting with the shop staff. Please hold on.
                </p>
              </div>

              {/* Real-time Queue Stats Card */}
              <div className="bg-white shadow-sm/40 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-left text-[11px]">
                <div className="flex justify-between items-center" aria-live="polite">
                  <span className="text-slate-500 font-semibold">Queue Position:</span>
                  <span className="text-white font-extrabold bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-md">
                    {queuePosition} of {queuePosition} waiting
                  </span>
                </div>
                <div className="flex justify-between items-center" aria-live="polite">
                  <span className="text-slate-500 font-semibold">Estimated Wait:</span>
                  <span className="text-slate-900 font-extrabold text-right">
                    ~{queuePosition * 2} min
                  </span>
                </div>
                <div className="flex justify-between items-center" aria-live="polite">
                  <span className="text-slate-500 font-semibold">Target Department:</span>
                  <span className="text-slate-900 font-extrabold truncate max-w-[120px]">
                    Sales & Support
                  </span>
                </div>
                <div className="flex justify-between items-center" aria-live="polite">
                  <span className="text-slate-500 font-semibold">Available Agents:</span>
                  <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {totalOnlineCount} active
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel / Switch actions */}
            <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto pt-2">
              <button
                onClick={handleSwitchToCallback}
                aria-label="Switch consultation request to offline callback appointment"
                className="w-full rounded-xl py-2.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Switch to Callback
              </button>

              <button
                onClick={handleHangUp}
                aria-label="Cancel consultation call and exit"
                className="w-full rounded-xl bg-white shadow-sm hover:bg-slate-100 border border-slate-200 text-xs font-bold py-2.5 text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}

        {/* State C: Active/Connected Video Call */}
        {flowState === "connected" && (() => {
          const isReconnecting = iceState === "disconnected" || iceState === "checking";
          const isGoodSignal = iceState === "connected" || iceState === "completed";

          const productImages = pinnedProductCall?.product_images?.map(img => img.image_url) ||
            [pinnedProductCall?.image_url].filter(Boolean);

          return (
            <div className="absolute inset-0 flex flex-col bg-slate-50">
              {/* Full-width Remote Video */}
              <div className="flex-1 relative bg-slate-50 flex items-center justify-center overflow-hidden min-h-0">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Awaiting expert stream...</p>
                  </div>
                )}

                {/* Network unstable/reconnecting screen overlay */}
                {isReconnecting && (
                  <div className="absolute inset-0 bg-slate-50/75 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Signal Unstable</h3>
                      <p className="text-[10px] text-slate-500 max-w-[200px]">Reconnecting WebRTC stream channels...</p>
                    </div>
                  </div>
                )}

                {/* Floating Top Control Indicators Overlay */}
                <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-start pointer-events-none">
                  {/* Call Timer Badge */}
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono font-bold tabular-nums text-slate-900 flex items-center gap-1.5 pointer-events-auto">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span>{formatDuration(callDuration)}</span>
                  </div>

                  {/* Telemetry/Quality Badges */}
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {/* HD Indicator */}
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black tracking-widest px-2 py-1 rounded-md uppercase">
                      HD 1080p
                    </span>

                    {/* Network quality signal */}
                    <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[9px] font-bold text-slate-900 flex items-center gap-1.5">
                      {isGoodSignal ? (
                        <>
                          <Wifi className="h-3 w-3 text-green-400" />
                          <span className="text-green-400 uppercase text-[8px]">Good</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 text-rose-400 animate-pulse" />
                          <span className="text-rose-400 uppercase text-[8px] animate-pulse">Poor</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Floating Shared Product Card Trigger */}
                {pinnedProductCall && !showProductDetailCall && (
                  <div
                    role="banner"
                    aria-live="polite"
                    className="absolute bottom-16 left-4 z-30 bg-black/85 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-left max-w-[190px] flex gap-2 shadow-2xl animate-bounce"
                  >
                    <div className="h-9 w-9 rounded-lg bg-slate-50 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {productImages[0] ? (
                        <img src={productImages[0]} alt={pinnedProductCall.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[7px] text-green-400 font-extrabold uppercase tracking-wider block">Recommended Live</span>
                      <h4 className="text-[9px] font-bold text-slate-900 truncate">{pinnedProductCall.name}</h4>
                      <button
                        onClick={() => setShowProductDetailCall(true)}
                        aria-label={`View details of shared product ${pinnedProductCall.name}`}
                        className="text-[8px] text-blue-400 font-black hover:underline flex items-center gap-0.5 pointer-events-auto cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      >
                        View Details &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Product Detail Overlay Modal inside call screen */}
                {pinnedProductCall && showProductDetailCall && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Product showcase detail modal for ${pinnedProductCall.name}`}
                    className="absolute inset-x-4 bottom-16 top-16 bg-slate-50/95 backdrop-blur-md rounded-2xl border border-white/15 p-4 z-40 flex flex-col overflow-y-auto text-left shadow-2xl text-slate-100"
                  >
                    <div className="flex justify-between items-start pb-2 border-b border-white/10">
                      <div>
                        <span className="text-[8px] text-green-400 uppercase tracking-widest font-black block">Live Showcase</span>
                        <h3 className="text-xs font-black text-slate-900 leading-tight">{pinnedProductCall.name}</h3>
                      </div>
                      <button
                        onClick={() => setShowProductDetailCall(false)}
                        aria-label="Close product details panel"
                        className="h-6 w-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Image gallery */}
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x" aria-label="Product image gallery">
                      {productImages.length > 0 ? (
                        productImages.map((img, i) => (
                          <div key={i} className="h-20 aspect-square rounded-xl bg-white shadow-sm border border-white/10 overflow-hidden shrink-0 snap-center flex items-center justify-center">
                            <img src={img} alt={`Gallery image ${i + 1} of ${pinnedProductCall.name}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <div className="h-20 w-full rounded-xl bg-white shadow-sm border border-white/10 flex items-center justify-center text-slate-600">
                          <Sparkles className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Pricing & Description */}
                    <div className="mt-3 space-y-2 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">Unit Price</span>
                        <span className="text-sm font-black text-blue-400">${pinnedProductCall.price}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Product Description</span>
                        <p className="text-[10px] text-slate-700 leading-relaxed max-h-[80px] overflow-y-auto pr-1">
                          {pinnedProductCall.description || "No description provided for this product."}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          toast.success("Product added to cart!");
                          window.parent.postMessage({ type: "ADD_TO_CART", product: pinnedProductCall }, "*");
                        }}
                        aria-label={`Add product ${pinnedProductCall.name} to checkout cart`}
                        className="py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-900 font-bold text-[10px] rounded-xl transition-all cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      >
                        Add to Cart
                      </button>

                      <button
                        onClick={() => {
                          toast.success("Opening checkout...");
                          window.open(`/checkout?product_id=${pinnedProductCall.id}&shop_id=${shopId}`, "_blank");
                        }}
                        aria-label={`Instantly checkout product ${pinnedProductCall.name}`}
                        className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-xl transition-all shadow-lg shadow-blue-600/10 cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                )}

                {/* PiP View (Local Stream) */}
                {localStream && (
                  <div className="absolute top-16 right-4 h-28 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white shadow-sm shadow-2xl z-20">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${camEnabled ? "opacity-100" : "opacity-0"}`}
                    />
                    {!camEnabled && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white shadow-sm text-slate-600 gap-1.5">
                        <VideoOff className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                )}

                {/* Call Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
                  {/* Toggle Mic */}
                  <button
                    onClick={toggleMic}
                    aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 border focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${micMuted
                        ? "bg-rose-500/25 text-rose-400 border-rose-500/30 hover:bg-rose-500/35"
                        : "bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
                      }`}
                  >
                    {micMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>

                  {/* Toggle Camera */}
                  <button
                    onClick={toggleCamera}
                    aria-label={camEnabled ? "Disable camera" : "Enable camera"}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 border focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${!camEnabled
                        ? "bg-rose-500/25 text-rose-400 border-rose-500/30 hover:bg-rose-500/35"
                        : "bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
                      }`}
                  >
                    {camEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                  </button>

                  {/* Picture-in-Picture Mode */}
                  {pipSupported && (
                    <button
                      onClick={togglePiP}
                      title="Toggle Picture in Picture"
                      aria-label="Toggle picture in picture mode"
                      className="flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 border bg-white/10 text-slate-900 border-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    >
                      <Tv className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Full Screen Mode */}
                  <button
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                    aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 border bg-white/10 text-slate-900 border-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  >
                    {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                  </button>

                  <div className="h-4 w-px bg-white/25 mx-0.5" />

                  {/* Hang Up */}
                  <button
                    onClick={handleHangUp}
                    aria-label="End consultation call"
                    className="flex h-11 px-3.5 items-center justify-center gap-1.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors text-white font-bold text-[10px] shadow-lg shadow-red-600/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    <span>End</span>
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* State D: Offline Callback Scheduler */}
        {flowState === "offline" && (
          <form onSubmit={handleScheduleCallback} className="my-auto space-y-5 flex flex-col justify-center">
            <div className="text-center space-y-1.5 mb-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-wide">Leave a Message</h2>
              <p className="text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                {shop?.business_hours_config?.holidays?.includes(new Date().toISOString().split('T')[0])
                  ? "We are currently closed for a public holiday."
                  : `We are currently closed. Operational hours (Timezone: ${shop?.business_hours_config?.timezone || "UTC"}): ${shop?.business_hours || "Mon-Fri: 09:00 - 18:00"}`}
              </p>
            </div>

            {/* Offline Roster indicators */}
            {displayAgentsList && displayAgentsList.length > 0 && (
              <div className="bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 space-y-2 text-left">
                <span className="text-slate-500 uppercase tracking-wider block text-[8px] font-bold">Roster Availability (All Offline)</span>
                <div className="space-y-2 max-h-[90px] overflow-y-auto pr-1">
                  {displayAgentsList.map((ag) => {
                    const name = ag.profiles?.full_name || "Agent";
                    const avatar = ag.profiles?.avatar_url;
                    const dept = ag.department || "Consultant";

                    return (
                      <div key={ag.id} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            {avatar ? (
                              <img src={avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-black text-slate-500">{name[0]}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{name}</span>
                            <span className="text-slate-500 text-[8px] leading-tight block">{dept}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                          <span className="text-[9px] text-slate-500 capitalize">Offline</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  aria-label="Enter your name for callback request"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white shadow-sm focus-visible:outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  aria-label="Enter your email address for callback updates"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white shadow-sm focus-visible:outline-none transition-all"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  aria-label="Enter your phone number for callback updates"
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white shadow-sm focus-visible:outline-none transition-all"
                />
              </div>               {/* Date */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Calendar className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="date"
                  value={callbackDate}
                  min={new Date().toISOString().split("T")[0]}
                  aria-label="Choose callback date"
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors"
                />
              </div>

              {/* Time */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Clock className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="time"
                  value={callbackTimeOnly}
                  aria-label="Choose callback time"
                  onChange={(e) => setCallbackTimeOnly(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors"
                />
              </div>

              {/* Time Zone Selection */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Building className="h-4.5 w-4.5" />
                </span>
                <select
                  required
                  value={callbackTimezone}
                  aria-label="Select callback timezone"
                  onChange={(e) => setCallbackTimezone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm pl-11 pr-8 py-3 text-xs text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value={Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}>
                    {Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"} (Local Zone)
                  </option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">EST (Eastern Standard Time)</option>
                  <option value="America/Los_Angeles">PST (Pacific Standard Time)</option>
                  <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                  <option value="Asia/Kolkata">IST (Indian Standard Time)</option>
                  <option value="Asia/Singapore">SGT (Singapore Time)</option>
                  <option value="Australia/Sydney">AEST (Australian Eastern Standard Time)</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-555">
                  ▼
                </span>
              </div>
            </div>

            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              aria-label={bookedCallbackId ? "Save updated callback changes" : "Confirm scheduled callback appointment"}
              className="w-full rounded-xl py-3.5 text-xs font-bold text-slate-900 shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
            >
              <Calendar className="h-4.5 w-4.5" />
              <span>{bookedCallbackId ? "Save Appointment Changes" : "Schedule Callback"}</span>
            </button>

            {bookedCallbackId && (
              <button
                type="button"
                onClick={() => setFlowState("callback-submitted")}
                aria-label="Back to confirmation sheet"
                className="w-full rounded-xl border border-slate-850 hover:bg-white/60 shadow-sm text-xs font-semibold py-2.5 text-slate-500 hover:text-slate-900 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Back to Confirmation
              </button>
            )}
          </form>
        )}

        {/* State E: Callback Scheduled Confirmation/Details Page */}
        {flowState === "callback-submitted" && (
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 p-4" aria-live="polite">
            <div className="h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center animate-bounce">
              <Calendar className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-extrabold text-slate-900">Callback Scheduled!</h2>
              <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed mx-auto">
                Your consultation has been registered. An expert will call you back at:
              </p>
            </div>

            {/* Booked appointment details box */}
            <div className="w-full bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 text-left text-[11px] space-y-1.5 font-semibold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-900">{callbackDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="text-slate-900">{callbackTimeOnly}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Zone:</span>
                <span className="text-slate-900 truncate max-w-[130px]">{callbackTimezone}</span>
              </div>
            </div>

            {/* Appointment controls */}
            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={() => setFlowState("offline")}
                aria-label="Edit your scheduled callback details"
                className="w-full rounded-xl py-2.5 bg-blue-600/10 border border-blue-500/25 hover:bg-blue-600/20 text-blue-400 text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Edit Appointment
              </button>

              <button
                onClick={handleCancelCallback}
                aria-label="Cancel this scheduled callback request"
                className="w-full rounded-xl py-2.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                Cancel Appointment
              </button>

              <div className="h-px bg-white shadow-sm my-1" />

              <button
                onClick={handleHangUp}
                aria-label="Close scheduling panel"
                className="w-full rounded-xl bg-white shadow-sm hover:bg-slate-100 border border-slate-200 text-xs font-bold py-2.5 text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Close Widget
              </button>
            </div>
          </div>
        )}

        {/* State F: Ringing/Calling Timeout Screen */}
        {flowState === "call-timeout" && (
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 p-4 bg-slate-50" aria-live="polite">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse">
              <Clock className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-extrabold text-slate-900">All Agents Are Busy</h2>
              <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed mx-auto">
                Our team is currently answering other calls. You can keep waiting, or schedule a callback.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={() => {
                  setFlowState("calling");
                  handleStartCall(null);
                }}
                aria-label="Retry consultation call and keep waiting"
                className="w-full rounded-xl py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Keep Waiting
              </button>

              <button
                onClick={handleSwitchToCallback}
                aria-label="Switch call to callback scheduling form"
                className="w-full rounded-xl py-2.5 bg-white/10 border border-white/10 hover:bg-white/15 text-slate-900 text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Switch to Callback
              </button>

              <div className="h-px bg-white shadow-sm my-1" />

              <button
                onClick={handleHangUp}
                aria-label="Cancel consultation and hang up"
                className="w-full rounded-xl bg-white shadow-sm hover:bg-slate-100 border border-slate-200 text-xs font-bold py-2.5 text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Cancel Call
              </button>
            </div>
          </div>
        )}

        {/* State G: Post-Call Summary and Feedback Form */}
        {flowState === "post-call" && (
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 p-4 bg-slate-50 text-slate-100" aria-live="polite">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center animate-bounce">
              <Star className="h-5 w-5 fill-blue-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-extrabold text-slate-900">Consultation Summary</h2>
              <p className="text-[11px] text-slate-500">Thank you for your valuable time!</p>
            </div>

            {/* Call Info details */}
            <div className="w-full bg-white shadow-sm/35 border border-slate-200 rounded-xl p-3.5 text-left text-[11px] space-y-1.5 font-semibold text-slate-350">
              <div className="flex justify-between">
                <span className="text-slate-500">Expert Agent:</span>
                <span className="text-slate-900">{answeringAgentName || "Our Store Specialist"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Call Duration:</span>
                <span className="text-slate-900">{finalDurationText || "0s"}</span>
              </div>
              {discussedProducts && discussedProducts.length > 0 && (
                <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500">Products Discussed:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {discussedProducts.map((p, idx) => (
                      <span key={idx} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Star Rating and Comment Form */}
            {!feedbackSubmitted ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!postCallLogId) return;
                  try {
                    // Fetch existing notes first to avoid overwriting
                    const { data: callLog } = await supabase
                      .from("call_logs")
                      .select("notes")
                      .eq("id", postCallLogId)
                      .single();

                    const agentNotes = callLog?.notes || "";
                    const updatedNotes = feedbackText.trim()
                      ? `${agentNotes}\n\n[Customer Feedback]: ${feedbackText.trim()}`
                      : agentNotes;

                    const { data: authSession } = await supabase.auth.getSession();
                    if (!authSession.session) {
                      await supabase.functions.invoke("guest-gateway", {
                        body: {
                          action: "update_call_log",
                          shopId,
                          apiKey: shop?.api_key || window.BridgeOneShopApiKey || "",
                          id: postCallLogId,
                          notes: updatedNotes,
                          csatScore: customerRating,
                          callRating: customerRating
                        }
                      });
                    } else {
                      await supabase
                        .from("call_logs")
                        .update({
                          csat_score: customerRating,
                          call_rating: customerRating,
                          notes: updatedNotes
                        })
                        .eq("id", postCallLogId);
                    }

                    setFeedbackSubmitted(true);
                    toast.success("Feedback submitted!");
                  } catch (err) {
                    console.warn("Failed to save feedback:", err);
                    toast.error("Failed to submit feedback.");
                    setFeedbackSubmitted(true);
                  }
                }}
                className="w-full space-y-3.5 pt-2"
              >
                <div className="space-y-1.5">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Rate Your Experience</span>
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCustomerRating(star)}
                        aria-label={`Rate ${star} Stars`}
                        className="text-slate-500 hover:text-amber-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
                      >
                        <Star className={`h-6 w-6 ${customerRating >= star ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    aria-label="Write your feedback comments"
                    placeholder="Tell us how we did (optional)..."
                    className="w-full rounded-xl border border-slate-200 bg-white/60 shadow-sm p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="w-full rounded-xl py-3 text-xs font-bold text-slate-900 shadow-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="space-y-3 pt-2 w-full">
                <p className="text-xs text-green-400 font-bold">✓ Feedback recorded. Thank you!</p>
                <button
                  onClick={() => {
                    setFlowState(shop?.is_online ? "form" : "offline");
                    window.parent.postMessage("close-widget", "*");
                    resetFields();
                  }}
                  className="w-full rounded-xl bg-white shadow-sm hover:bg-slate-100 border border-slate-200 text-xs font-bold py-3 text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                >
                  Close & Return
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
