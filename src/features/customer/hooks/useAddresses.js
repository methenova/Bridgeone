import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/services/marketplace/address.service";

import { useAuthContext } from "@/context/AuthContext";

const addressKeys = {
  all: ["addresses"],
  list: (userId) => [...addressKeys.all, userId],
};

export function useAddresses() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: addressKeys.list(user?.id),
    queryFn: () => getAddresses(user.id),
    enabled: !!user,
  });
}

export function useCreateAddress() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createAddress(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list(user?.id) });
      toast.success("Address saved!");
    },
    onError: (error) => toast.error(error.message || "Failed to save address"),
  });
}

export function useUpdateAddress() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list(user?.id) });
      toast.success("Address updated!");
    },
    onError: (error) => toast.error(error.message || "Failed to update address"),
  });
}

export function useDeleteAddress() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list(user?.id) });
      toast.success("Address removed");
    },
    onError: (error) => toast.error(error.message || "Failed to delete address"),
  });
}

export function useSetDefaultAddress() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId) => setDefaultAddress(addressId, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list(user?.id) });
    },
    onError: (error) => toast.error(error.message || "Failed to set default address"),
  });
}
