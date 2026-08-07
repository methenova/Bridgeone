import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "@/context/AuthContext";
import { getNextOnboardingStep } from "@/features/onboarding/services/onboarding.service";

/**
 * Reusable Centralized Route Guard for BridgeOne
 *
 * Evaluates every protected dashboard page:
 * 1. Is user authenticated? -> If not, redirect to /login
 * 2. Is email verified? -> If not, redirect to /verify-email
 * 3. Is onboarding completed? -> If false, redirect to last onboarding step
 * 4. Otherwise -> Allow dashboard route access
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuthContext();
  const location = useLocation();

  const [targetStep, setTargetStep] = useState(null);
  const [checkingStep, setCheckingStep] = useState(true);

  // Prevent duplicate access-denied toasts on rapid re-renders
  const lastDeniedPathRef = useRef(null);

  // Email verification check
  const isEmailVerified = Boolean(user?.email_confirmed_at);
  const isVerifyEmailRoute = location.pathname === "/verify-email";

  // Onboarding completion check
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  const onboardingCompleted = profile?.onboarding_completed === true || isAdmin;
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");

  useEffect(() => {
    let isMounted = true;

    async function evaluateOnboardingStep() {
      if (!user || !isEmailVerified || onboardingCompleted) {
        if (isMounted) setCheckingStep(false);
        return;
      }

      try {
        setCheckingStep(true);
        const nextStep = await getNextOnboardingStep(user, profile);
        if (isMounted) {
          setTargetStep(nextStep);
        }
      } catch (err) {
        console.warn("Route Guard onboarding step evaluation warning:", err);
        if (isMounted) setTargetStep("/onboarding/profile");
      } finally {
        if (isMounted) setCheckingStep(false);
      }
    }

    evaluateOnboardingStep();

    return () => {
      isMounted = false;
    };
  }, [user, profile, isEmailVerified, onboardingCompleted, location.pathname]);

  // 1. Loading state spinner
  if (loading || (user && isEmailVerified && !onboardingCompleted && checkingStep)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />
      </div>
    );
  }

  // 2. Is user authenticated? If not, redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Is email verified? If not, redirect to /verify-email
  if (!isEmailVerified && !isVerifyEmailRoute) {
    return <Navigate to="/verify-email" replace />;
  }

  // 4. Is onboarding completed? If false, redirect to last incomplete onboarding step
  if (!onboardingCompleted) {
    const requiredStep = targetStep || "/onboarding/profile";
    if (location.pathname !== requiredStep) {
      return <Navigate to={requiredStep} replace />;
    }
    return children;
  }

  // 5. If onboarding IS completed, block manual access back to onboarding routes
  if (onboardingCompleted && isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  // 6. Role validation check
  // admin and super_admin bypass all seller/agent allowedRoles restrictions —
  // they have platform-wide access and use their own route set under /dashboard.
  if (allowedRoles && profile?.role && !isAdmin && !allowedRoles.includes(profile.role)) {
    // Show Access Denied toast (debounced to prevent rapid re-render spam)
    if (lastDeniedPathRef.current !== location.pathname) {
      lastDeniedPathRef.current = location.pathname;
      const roleName = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
      const requiredNames = allowedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ");
      toast.error(
        `Access Denied — Your "${roleName}" role does not have permission to access this page. Required: ${requiredNames}.`,
        { id: `access-denied-${location.pathname}`, duration: 5000 }
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Reset denied path tracker when access is granted
  lastDeniedPathRef.current = null;

  // 7. Otherwise, allow dashboard page access
  return children;
}