"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  X,
  Check,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  PackageOpen,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";

import {
  useListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/services/products.api";
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
} from "@/services/categories.api";
import {
  useListSubcategoriesQuery,
  useCreateSubcategoryMutation,
} from "@/services/subcategories.api";
import {
  useListManufacturersQuery,
  useCreateManufacturerMutation,
} from "@/services/manufacturers.api";

import UploadImages, { type UploadItem } from "@/components/UploadImages";
import ColorVariantUploader, { type ColorVariantItem } from "@/components/ColorVariantUploader";

// ---------- Types (compatible with your app/types) ----------
type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  buyingPrice: number;
  stock: number;
  image?: string;
  images?: string[];
  compareAtPrice?: number;
  isDiscounted?: boolean;
  status: "ACTIVE" | "DRAFT" | "HIDDEN";
  categorySlug?: string;
  subcategorySlug?: string;
  tagSlugs?: string[];
  brand?: string;
  description?: string;
};

const n = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : Number(v ?? fallback);

type HttpError = { status: number; data?: { code?: string; message?: string } };
const isHttpError = (e: unknown): e is HttpError =>
  typeof e === "object" &&
  !!e &&
  typeof (e as { status?: unknown }).status === "number";

const isValidImageUrl = (url?: string) => {
  if (!url) return false;
  try {
    const u = new URL(
      url,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
    return (
      u.protocol === "http:" || u.protocol === "https:" || url.startsWith("/")
    );
  } catch {
    return false;
  }
};

const discountPct = (price: number, compareAt?: number) => {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
};

// ---------- Tiny confirm modal ----------
function ConfirmDialog({
  open,
  title,
  subtitle,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-pink-100">
        <div className="px-5 pt-5">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle ? (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex gap-3 p-5">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-xl border border-pink-200 text-gray-700 font-medium hover:bg-pink-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // filters/search
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "",
  );
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // modal + edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Quick add modals
  const [quickAddModal, setQuickAddModal] = useState<
    "brand" | "category" | "subcategory" | null
  >(null);
  const [quickAddForm, setQuickAddForm] = useState({ name: "", slug: "" });
  const [quickAddImages, setQuickAddImages] = useState<UploadItem[]>([]);

  // form state (aligned with backend DTO)
  const [form, setForm] = useState({
    title: "",
    slug: "",
    price: 0,
    buyingPrice: 0,
    discountPrice: 0,
    stock: 0,
    categorySlug: "",
    subcategorySlug: "",
    brand: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "DRAFT" | "HIDDEN",
    tags: "",
  });
  const [images, setImages] = useState<UploadItem[]>([]);
  const [colorVariants, setColorVariants] = useState<ColorVariantItem[]>([]);

  // RTK Query
  const {
    data: productsData,
    isLoading,
    error,
    isFetching,
  } = useListProductsQuery({
    page: currentPage,
    q: searchQuery,
    category: categoryFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: categoriesData } = useListCategoriesQuery();
  const { data: brandsData } = useListManufacturersQuery();

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const [createBrand] = useCreateManufacturerMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [createSubcategory] = useCreateSubcategoryMutation();

  // Normalize list results defensively
  const products: Product[] = (productsData?.data?.items ??
    productsData?.data ??
    productsData?.items ??
    productsData ??
    []) as Product[];

const pagination = productsData?.data
    ? {
        total: productsData.data.total || 0,
        page: productsData.data.page || 1,
        pages: productsData.data.pages || 1,
        limit: productsData.data.limit || 12,
      }
    : null;
  const categories = (categoriesData?.data ?? categoriesData ?? []) as Array<{
    _id: string;
    slug: string;
    title?: string;
    name?: string;
  }>;

  const brands = (brandsData?.data ?? brandsData ?? []) as Array<{
    _id: string;
    slug: string;
    name: string;
  }>;

  const selectedCategoryId = categories.find(
    (c) => c.slug === form.categorySlug,
  )?._id;
  const filterCategoryId = categories.find(
    (c) => c.slug === categoryFilter,
  )?._id;
  const { data: subcategoriesData } = useListSubcategoriesQuery(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined,
  );
  const { data: filterSubcategoriesData } = useListSubcategoriesQuery(
    filterCategoryId ? { categoryId: filterCategoryId } : undefined,
  );

  const subcategories = (subcategoriesData?.data ??
    subcategoriesData ??
    []) as Array<{
    _id: string;
    slug: string;
    name: string;
  }>;

  const filterSubcategories = (filterSubcategoriesData?.data ??
    filterSubcategoriesData ??
    []) as Array<{
    _id: string;
    slug: string;
    name: string;
  }>;

  // Client-side filter by subcategory
  const filteredProducts = subcategoryFilter
    ? products.filter((p) => p.subcategorySlug === subcategoryFilter)
    : products;

  const resolveImgSrc = (url: string) => {
    if (!url) return "";
    // In dev, swap production domain → localhost:5000
    if (process.env.NODE_ENV === "development") {
      return url.replace(
        /https:\/\/api\.rajibelectronics\.com/g,
        "http://localhost:5000"
      );
    }
    return url;
  };

  // Build DTOs (backend schema aligned)
  const buildCreateDTO = (f: typeof form) => {
    const hasDiscount = f.discountPrice > 0 && f.discountPrice < f.price;
    const tagSlugs = f.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: f.title,
      slug: f.slug,
      price: hasDiscount ? f.discountPrice : f.price,
      buyingPrice: f.buyingPrice,
      compareAtPrice: hasDiscount ? f.price : undefined,
      isDiscounted: hasDiscount,
      stock: f.stock,
      images: images.map((i) => i.url),
      colorVariants: colorVariants.length > 0 ? colorVariants : undefined,
      status: f.status,
      categorySlug: f.categorySlug || undefined,
      subcategorySlug: f.subcategorySlug || undefined,
      brand: f.brand || undefined,
      description: f.description || undefined,
      tagSlugs,
    };
  };

  const buildUpdateDTO = (f: typeof form) => buildCreateDTO(f);

  // CRUD actions
  const createNew = async () => {
    try {
      const body = buildCreateDTO(form);
      await createProduct(body).unwrap();
      toast.success("Product created successfully!");
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (isHttpError(err) && err.data?.code) {
        toast.error(err.data.code);
      } else {
        toast.error("Failed to save product");
      }
    }
  };

  const updateExisting = async (id: string) => {
    try {
      const body = buildUpdateDTO(form);
      await updateProduct({ id, ...body }).unwrap();
      toast.success("Product updated successfully!");
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err: unknown) {
      if (isHttpError(err) && err.data?.code) {
        toast.error(err.data.code);
      } else {
        toast.error("Failed to update product");
      }
    }
  };

  const requestDelete = (id: string) => setConfirmId(id);

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteProduct(confirmId).unwrap();
      toast.success("Product deleted!");
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmId(null);
    }
  };

  // UI helpers
  const openCreate = () => {
    setEditingProduct(null);
    setForm({
      title: "",
      slug: "",
      price: 0,
      buyingPrice: 0,
      discountPrice: 0,
      stock: 0,
      categorySlug: "",
      subcategorySlug: "",
      brand: "",
      description: "",
      status: "ACTIVE",
      tags: "",
    });
    setImages([]);
    setColorVariants([]);
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    const priceNum = n(p.price);
    const compareNum =
      p.compareAtPrice != null ? n(p.compareAtPrice) : undefined;
    const hasCompare = typeof compareNum === "number" && compareNum > priceNum;

    setEditingProduct(p);
    setForm({
      title: p.title,
      slug: p.slug,
      price: hasCompare ? compareNum! : priceNum,
      buyingPrice: n(p.buyingPrice),
      discountPrice: hasCompare ? priceNum : 0,
      stock: n(p.stock),
      categorySlug: p.categorySlug ?? "",
      subcategorySlug: p.subcategorySlug ?? "",
      brand: p.brand ?? "",
      description: p.description ?? "",
      status: p.status,
      tags: Array.isArray(p.tagSlugs) ? p.tagSlugs.join(",") : "",
    });
    setImages(
      (p.images ?? []).map((url) => ({
        url,
        filePath: url.includes("/upload/")
          ? url.split("/upload/")[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "")
          : "",
      }))
    );
    setColorVariants(
      ((p as { colorVariants?: { colorName: string; colorHex?: string; image: string; imageId?: string }[] }).colorVariants ?? []).map((cv) => ({
        colorName: cv.colorName,
        colorHex: cv.colorHex ?? "#000000",
        image: cv.image,
        imageId: cv.imageId ?? "",
      }))
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImages([]);
    setColorVariants([]);
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.name.trim()) return;

    try {
      if (quickAddModal === "brand") {
        await createBrand({
          name: quickAddForm.name,
          slug: quickAddForm.slug,
          image: quickAddImages[0]?.url,
          status: "ACTIVE",
        }).unwrap();
        setForm({ ...form, brand: quickAddForm.slug });
        toast.success("Brand created!");
      } else if (quickAddModal === "category") {
        await createCategory({
          name: quickAddForm.name,
          slug: quickAddForm.slug,
          images: quickAddImages.map((img) => img.url),
          status: "ACTIVE",
        }).unwrap();
        setForm({ ...form, categorySlug: quickAddForm.slug });
        toast.success("Category created!");
      } else if (quickAddModal === "subcategory") {
        if (!form.categorySlug) {
          toast.error("Select a category first");
          return;
        }
        const categoryId = categories.find(
          (c) => c.slug === form.categorySlug,
        )?._id;
        if (!categoryId) return;
        await createSubcategory({
          name: quickAddForm.name,
          slug: quickAddForm.slug,
          categoryId,
          images: quickAddImages.map((img) => img.url),
          status: "ACTIVE",
        }).unwrap();
        setForm({ ...form, subcategorySlug: quickAddForm.slug });
        toast.success("Subcategory created!");
      }
      setQuickAddModal(null);
      setQuickAddForm({ name: "", slug: "" });
      setQuickAddImages([]);
    } catch {
      toast.error("Failed to create");
    }
  };

  // Skeleton card
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-40 sm:h-48 lg:h-56 bg-gradient-to-br from-pink-100 to-purple-100" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-4 bg-pink-100 rounded w-3/4" />
        <div className="h-3 bg-pink-100 rounded w-1/3" />
        <div className="flex gap-2 pt-3">
          <div className="h-8 bg-pink-100 rounded flex-1" />
          <div className="h-8 bg-pink-100 rounded flex-1" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 mt-16">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-teal-800 p-1 text-gray-700 hover:bg-pink-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389]  to-[#167389] mb-2 flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#167389]" />
              <span className="leading-tight">Products Management</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">
              Create, update & manage your products
            </p>
          </div>

          {/* Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-pink-100 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-200 transition"
                />
              </div>

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubcategoryFilter("");
                  setCurrentPage(1);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition lg:w-48"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.title || cat.name || cat.slug}
                  </option>
                ))}
              </select>

              {/* Subcategory filter */}
              <select
                value={subcategoryFilter}
                onChange={(e) => {
                  setSubcategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!categoryFilter}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition lg:w-48 disabled:bg-gray-100"
              >
                <option value="">All Subcategories</option>
                {filterSubcategories.map((sub) => (
                  <option key={sub._id} value={sub.slug}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
              />

              {/* Add */}
              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-gradient-to-r from-[#167389] to-[#167389] text-white font-semibold hover:from-cyan-300 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300 transition shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* States */}
          {isLoading || isFetching ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm lg:text-base text-red-700">
                Failed to load products. Please try again.
              </p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map((p) => {
                const pct = discountPct(
                  n(p.price),
                  p.compareAtPrice != null ? n(p.compareAtPrice) : undefined,
                );
                const rawImg =
                  (Array.isArray(p.images) && p.images.length > 0
                    ? p.images[0]
                    : p.image) || "";
                const imgSrc = resolveImgSrc(rawImg);

                const showImage = isValidImageUrl(imgSrc);

                return (
                  <div
                    key={p._id}
                    className="bg-white rounded-2xl shadow-sm border border-pink-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300 overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative h-40 sm:h-48 lg:h-56 bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100 overflow-hidden">
                      {showImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-pink-300" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 right-2 flex justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          {pct > 0 && (
                            <span className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                              -{pct}%
                            </span>
                          )}
                          <span className="bg-blue-600/70 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                            Stock: {n(p.stock)}
                          </span>
                        </div>
                        {p.status === "ACTIVE" ? (
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md h-fit">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md h-fit">
                            {p.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2 sm:p-3">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                        {p.title}
                      </h3>

                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                            ৳{n(p.price)}
                          </span>
                          {p.compareAtPrice != null &&
                            n(p.compareAtPrice) > n(p.price) && (
                              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                ৳{n(p.compareAtPrice)}
                              </span>
                            )}
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/products/${p._id}/inventory`)
                          }
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition text-[10px] sm:text-xs"
                        >
                          <PackageOpen className="w-3 h-3" />
                          Manage Stock
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-1.5">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => requestDelete(p._id)}
                          disabled={isDeleting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 disabled:opacity-50 transition text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-pink-100 p-8 sm:p-12 text-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {searchQuery || categoryFilter
                  ? "Try adjusting your filters"
                  : "Add your first product to get started"}
              </p>
              {!searchQuery && !categoryFilter && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold hover:from-pink-700 hover:to-purple-700 transition shadow-md text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add First Product
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-3 sm:px-4 lg:px-8 mt-6">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-pink-200 text-gray-700 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Prev
                </button>

                <div className="flex gap-0.5 sm:gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-pink-200 text-gray-700 hover:bg-pink-50 transition"
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                    </>
                  )}

                  {/* Current page range */}
                  {Array.from(
                    {
                      length: Math.min(
                        window.innerWidth < 640 ? 3 : 5,
                        pagination.pages,
                      ),
                    },
                    (_, i) => {
                      const start = Math.max(
                        1,
                        currentPage -
                          Math.floor((window.innerWidth < 640 ? 3 : 5) / 2),
                      );
                      const page = start + i;
                      if (page > pagination.pages) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition ${
                            currentPage === page
                              ? "bg-[#167389] text-white"
                              : "border border-pink-200 text-gray-700 hover:bg-pink-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    },
                  ).filter(Boolean)}

                  {/* Last page */}
                  {currentPage < pagination.pages - 2 && (
                    <>
                      {currentPage < pagination.pages - 3 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(pagination.pages)}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-pink-200 text-gray-700 hover:bg-pink-50 transition"
                      >
                        {pagination.pages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-pink-200 text-gray-700 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  Page {currentPage} of {pagination.pages}
                </span>
                <input
                  type="number"
                  min="1"
                  max={pagination.pages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= pagination.pages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-xs sm:text-sm border border-pink-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-pink-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Create / Update Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-pink-100">
              <div className="sticky top-0 bg-white border-b border-pink-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl z-10">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 sm:p-2 hover:bg-pink-50 rounded-lg sm:rounded-xl transition"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (editingProduct) await updateExisting(editingProduct._id);
                  else await createNew();
                }}
                className="p-4 sm:p-6 space-y-5"
              >
                {/* Row 1: Title + Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter product name"
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) =>
                        setForm({ ...form, slug: e.target.value.trim() })
                      }
                      placeholder="auto-generated-slug"
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition font-mono text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Row 2: Category + Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Category *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={form.categorySlug}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            categorySlug: e.target.value,
                            subcategorySlug: "",
                          })
                        }
                        required
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.slug}>
                            {cat.title || cat.name || cat.slug}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setQuickAddModal("category")}
                        className="px-3 py-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition"
                        title="Add new category"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Subcategory (Optional)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={form.subcategorySlug}
                        onChange={(e) =>
                          setForm({ ...form, subcategorySlug: e.target.value })
                        }
                        disabled={!form.categorySlug}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition disabled:bg-gray-100"
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map((sub) => (
                          <option key={sub._id} value={sub.slug}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setQuickAddModal("subcategory")}
                        disabled={!form.categorySlug}
                        className="px-3 py-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add new subcategory"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Brand + Buying Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Brand
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={form.brand}
                        onChange={(e) =>
                          setForm({ ...form, brand: e.target.value })
                        }
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                      >
                        <option value="">Select Brand (Optional)</option>
                        {brands.map((brand) => (
                          <option key={brand._id} value={brand.slug}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setQuickAddModal("brand")}
                        className="px-3 py-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition"
                        title="Add new brand"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Buying Price (৳) *
                    </label>
                    <input
                      type="number"
                      value={form.buyingPrice}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          buyingPrice: Number(e.target.value),
                        })
                      }
                      placeholder="Cost price"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                    />
                  </div>
                </div>

                {/* Row: Selling Price + Discount Price + Stock */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Normal Selling Price (৳) *
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: Number(e.target.value) })
                      }
                      placeholder="100"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Discounted Sell Price (৳)
                    </label>
                    <input
                      type="number"
                      value={form.discountPrice}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discountPrice: Number(e.target.value),
                        })
                      }
                      placeholder="80"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Stock Amount*
                    </label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: Number(e.target.value) })
                      }
                      placeholder="100"
                      required
                      min="0"
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={4}
                    placeholder="Write product details, usage, benefits..."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition resize-none"
                  />
                </div>

                {/* Images (multiple) */}
                <UploadImages
                  label="Product Images (Up to 5)"
                  hint="640 × 480 px · 4:3"
                  value={images}
                  onChange={setImages}
                  max={5}
                />

                {/* Color Variants */}
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <ColorVariantUploader
                    value={colorVariants}
                    onChange={setColorVariants}
                  />
                </div>

                {/* Row: Visibility + Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Visibility
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value as
                            | "ACTIVE"
                            | "DRAFT"
                            | "HIDDEN",
                        })
                      }
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) =>
                        setForm({ ...form, tags: e.target.value })
                      }
                      placeholder="e.g, Network, Sounds"
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-pink-200 text-gray-700 font-semibold hover:bg-pink-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-gradient-to-r from-[#167389] to-[#167389] text-white font-semibold hover:from-cyan-300 hover:to-cyan-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition shadow-md"
                  >
                    {isCreating || isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        {editingProduct ? "Update Product" : "Create Product"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!confirmId}
        title="Delete this product?"
        subtitle="This action cannot be undone."
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />

      {/* Quick Add Modal */}
      {quickAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-pink-200 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-pink-100">
              <h3 className="text-lg font-bold text-gray-900">
                Add New{" "}
                {quickAddModal === "brand"
                  ? "Brand"
                  : quickAddModal === "category"
                    ? "Category"
                    : "Subcategory"}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={quickAddForm.name}
                  onChange={(e) =>
                    setQuickAddForm({
                      name: e.target.value,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, ""),
                    })
                  }
                  placeholder="Enter name"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Slug *
                </label>
                <input
                  type="text"
                  value={quickAddForm.slug}
                  onChange={(e) =>
                    setQuickAddForm({ ...quickAddForm, slug: e.target.value })
                  }
                  placeholder="auto-generated-slug"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition font-mono text-sm"
                />
              </div>
              <div>
                <UploadImages
                  label={quickAddModal === "brand" ? "Brand Logo" : "Images"}
                  value={quickAddImages}
                  onChange={setQuickAddImages}
                  max={quickAddModal === "brand" ? 1 : 3}
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-pink-100">
              <button
                onClick={() => {
                  setQuickAddModal(null);
                  setQuickAddForm({ name: "", slug: "" });
                  setQuickAddImages([]);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAdd}
                disabled={!quickAddForm.name.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#167389] to-[#167389] text-white font-semibold hover:from-cyan-300 hover:to-cyan-700 disabled:opacity-50 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
