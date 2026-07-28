import { useAuthContext } from "@/context/AuthContext";

export default function useSellerShop() {
  const { currentShop, loadingWorkspace, reloadWorkspace } = useAuthContext();

  return {
    shop: currentShop,
    loading: loadingWorkspace,
    reloadShop: reloadWorkspace,
    hasShop: !!currentShop,
  };
}