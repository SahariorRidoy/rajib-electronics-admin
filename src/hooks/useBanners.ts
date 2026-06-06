import { useState } from "react";
import { getUploadSignature, uploadToCloudinary } from "@/services/uploads";
import { useGetBannersQuery, useCreateBannerMutation, useUpdateBannerMutation, useDeleteBannerMutation } from "@/services/banners.api";
import type { CreateBannerRequest, UpdateBannerRequest } from "@/types/banner";

export const useBanners = () => {
  const { data: banners = [], isLoading, refetch } = useGetBannersQuery();
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [uploading, setUploading] = useState(false);

  const createBannerWithImage = async (
    bannerData: Omit<CreateBannerRequest, 'image'>,
    imageFile: File
  ) => {
    setUploading(true);
    try {
      const signature = await getUploadSignature();
      const uploadResult = await uploadToCloudinary(imageFile, signature);
      
      await createBanner({
        ...bannerData,
        image: uploadResult.secure_url
      }).unwrap();
      
      await refetch();
    } finally {
      setUploading(false);
    }
  };

  const updateBannerWithImage = async (
    id: string,
    bannerData: Omit<UpdateBannerRequest, 'image'>,
    imageFile?: File
  ) => {
    setUploading(true);
    try {
      let updateData: UpdateBannerRequest = bannerData;
      
      if (imageFile) {
        const signature = await getUploadSignature();
        const uploadResult = await uploadToCloudinary(imageFile, signature);
        updateData = { ...bannerData, image: uploadResult.secure_url };
      }
      
      await updateBanner({ id, ...updateData }).unwrap();
      await refetch();
    } finally {
      setUploading(false);
    }
  };

  const deleteBannerById = async (id: string) => {
    await deleteBanner(id).unwrap();
    await refetch();
  };

  return {
    banners,
    loading: isLoading,
    uploading,
    createBannerWithImage,
    updateBannerWithImage,
    deleteBannerById,
    refetch
  };
};