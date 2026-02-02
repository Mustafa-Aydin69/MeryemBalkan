'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import {
  getCache,
  setCache,
  hasCache,
  updateCacheItem,
  removeFromCache,
  replaceCache,
  type CacheKey,
} from '../lib/adminCache';

const CACHE_KEY: CacheKey = 'products';

// Cloudflare R2 URL helper
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};

export interface Product {
  id: number;
  title: string;
  collection: string;
  category: string;
  price: string;
  status: string;
  createdDate: string;
  year: number;
  features: string[];
  size: string[];
  colors: string[];
  images: string[];
  description: string;
}

export interface NewProduct {
  title: string;
  collection: string;
  price: string;
  description: string;
  category: string;
  size: string[];
  colors: string[];
  features: string[] | string;
  imagePreviews: string[];
  images: (string | File)[];
}

// Transform raw data to Product format
function transformProductData(item: any): Product {
  return {
    id: item.id,
    title: item.title,
    collection: item.collection,
    category: item.category,
    price: item.price,
    status: item.status,
    createdDate: item.createdDate,
    year: item.year,
    features: item.features || [],
    size: item.size || [],
    colors: item.colors || [],
    images: item.images || [],
    description: item.description || '',
  };
}

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [searchOpenProducts, setSearchOpenProducts] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Yayında' | 'Yayında Değil'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'asc',
  });

  const [newProduct, setNewProduct] = useState<NewProduct>({
    title: '',
    collection: '',
    price: '',
    description: '',
    category: '',
    size: [],
    colors: [],
    features: [],
    imagePreviews: [],
    images: [],
  });

  // Toplu yayın durumu değiştirme state'leri
  type BulkStatusAction = 'Yayına Al' | 'Yayından Kaldır' | null;
  const [isBulkStatusActionModalOpen, setIsBulkStatusActionModalOpen] = useState(false);
  const [bulkStatusAction, setBulkStatusAction] = useState<BulkStatusAction>(null);
  const [isBulkStatusProductModalOpen, setIsBulkStatusProductModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isBulkStatusConfirmModalOpen, setIsBulkStatusConfirmModalOpen] = useState(false);
  const [isProcessingBulkStatus, setIsProcessingBulkStatus] = useState(false);

  // Fetch products with caching - API route üzerinden
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && hasCache(CACHE_KEY)) {
      const cachedData = getCache<Product>(CACHE_KEY);
      if (cachedData) {
        setAllProducts(cachedData);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/urunler', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Ürünler alınamadı');
      }

      const { data } = await response.json();

      if (data) {
        const transformedProducts = data.map(transformProductData);
        setAllProducts(transformedProducts);
        setCache(CACHE_KEY, transformedProducts);
      }
    } catch (error: any) {
      console.error("Ürünler alınamadı:", error.message);
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch - uses cache if available
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTermProducts]);

  // Filtering
  const filteredProducts = allProducts.filter((product) => {
    // Status filter
    if (statusFilter !== 'all' && product.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    const searchMatch =
      product.title.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.collection.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTermProducts.toLowerCase());
    
    return searchMatch;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const { key, direction } = sortConfig;

    if (key === 'id') {
      return direction === 'asc' ? a.id - b.id : b.id - a.id;
    }

    if (key === 'price') {
      const priceA = parseFloat(a.price.toString().replace(/\./g, '').replace(',', '.'));
      const priceB = parseFloat(b.price.toString().replace(/\./g, '').replace(',', '.'));
      return direction === 'asc' ? priceA - priceB : priceB - priceA;
    }

    if (key === 'status') {
      const statusA = a.status === 'Yayında' ? 1 : 0;
      const statusB = b.status === 'Yayında' ? 1 : 0;
      return direction === 'asc' ? statusA - statusB : statusB - statusA;
    }

    return 0;
  });

  // Pagination
  const totalProductsPages = Math.ceil(sortedProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getPaginationNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalProductsPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalProductsPages - 1) {
      rangeWithDots.push('...', totalProductsPages);
    } else if (totalProductsPages > 1) {
      rangeWithDots.push(totalProductsPages);
    }

    return rangeWithDots;
  };

  const getProductStatusColor = (status: string) => {
    switch (status) {
      case 'Yayında':
        return 'bg-green-100 text-green-700';
      case 'Yayında Değil':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Input change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const addSize = (size: string) => {
    if (!newProduct.size.includes(size)) {
      setNewProduct((prev) => ({ ...prev, size: [...prev.size, size] }));
    }
  };

  const removeSize = (size: string) => {
    setNewProduct((prev) => ({ ...prev, size: prev.size.filter((s) => s !== size) }));
  };

  const addImage = (files: FileList) => {
    const fileArray = Array.from(files);
    const currentCount = newProduct.imagePreviews.length;

    if (currentCount + fileArray.length > 5) {
      setUploadError('En fazla 5 fotoğraf yükleyebilirsiniz');
      return;
    }

    setUploadError('');

    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    const newFiles = fileArray;

    setNewProduct((prev) => ({
      ...prev,
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
      images: [...prev.images, ...newFiles],
    }));
  };

  const removeImage = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
      images: prev.images.filter((_, i) => i !== index),
    }));
    setUploadError('');
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = Array.from(newProduct.imagePreviews);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setNewProduct((prev) => ({ ...prev, imagePreviews: reordered }));
  };

  // Upload file to storage via API
  async function uploadFileViaAPI(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'urunler');
      formData.append('fileName', `${Date.now()}_${file.name}`);

      const response = await fetch('/api/admin/storage', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Dosya yüklenemedi');
      }

      const result = await response.json();
      return result.fileName;
    } catch (error: any) {
      console.error('Dosya yükleme hatası:', error);
      return null;
    }
  }

  // Product submit handler
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    const uploadedNames: string[] = [];

    for (const item of newProduct.images) {
      if (item instanceof File) {
        const fileName = await uploadFileViaAPI(item);
        if (fileName) {
          uploadedNames.push(fileName);
        } else {
          setUploadError('Bazı fotoğraflar yüklenemedi');
        }
      } else if (typeof item === "string") {
        uploadedNames.push(item);
      }
    }

    try {
      const response = await fetch('/api/admin/urunler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newProduct.title,
          collection: newProduct.category + " Koleksiyonu",
          category: newProduct.category,
          price: newProduct.price,
          size: newProduct.size,
          colors: newProduct.colors,
          features: [newProduct.features],
          description: newProduct.description,
          images: uploadedNames,
          year: new Date().getFullYear(),
          createdDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Ürün eklenemedi');
      }

      toast.success("Ürün başarıyla eklendi! ✅");

      setNewProduct({
        title: "",
        collection: "",
        category: "",
        price: "",
        size: [],
        colors: [],
        features: [],
        description: "",
        images: [],
        imagePreviews: [],
      });
      setUploadError("");
      setIsAddProductModalOpen(false);
      
      // Refresh products
      fetchProducts(true);
    } catch (error: any) {
      console.error("Ürün eklenemedi:", error.message);
      toast.error("Ürün eklenemedi! ❌");
    }
  };

  // Edit product handlers
  const handleEditProduct = (product: Product) => {
    // Önceki pending silinecek resimleri temizle
    setPendingRemovedImages([]);
    
    const imagePreviews =
      (product.images || [])
        .filter((img) => typeof img === "string" && img.trim() !== "")
        .map((img) => {
          if (img.startsWith('http')) return img;
          return getR2BaseUrl() + img;
        });

    setEditingProduct({
      ...product,
      description: product.description ?? "",
      images: product.images ?? [],
      colors: product.colors ?? [],
      size: product.size ?? [],
      features: product.features ?? [],
      year: product.year ?? new Date().getFullYear(),
      originalStatus: product.status,
      imagePreviews,
    });
  };

  const handleEditInputChange = (field: string, value: any) => {
    setEditingProduct((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditImageUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    const currentCount = editingProduct.images?.length || 0;

    if (currentCount + fileArray.length > 5) {
      toast.error("En fazla 5 fotoğraf yükleyebilirsiniz");
      return;
    }

    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));

    setEditingProduct((prev: any) => ({
      ...prev,
      images: [...(prev.images || []), ...fileArray],
      imagePreviews: [...(prev.imagePreviews || []), ...newPreviews],
    }));
  };

  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [pendingRemovedImages, setPendingRemovedImages] = useState<string[]>([]);

  // Çarpıya basınca sadece frontend'den kaldır (güncelle'ye basınca asıl silme yapılır)
  const handleEditImageRemove = (index: number) => {
    if (!editingProduct) return;

    const imageToRemove = editingProduct.images[index];

    // Eğer yeni eklenen bir dosya ise (File objesi), sadece local state'ten sil
    if (imageToRemove instanceof File) {
      setEditingProduct((prev: any) => ({
        ...prev,
        images: prev.images.filter((_: any, i: number) => i !== index),
        imagePreviews: prev.imagePreviews.filter((_: any, i: number) => i !== index),
      }));
      return;
    }

    // Mevcut resim ise (string path), pending listesine ekle ve UI'dan kaldır
    setPendingRemovedImages((prev) => [...prev, imageToRemove]);
    
    setEditingProduct((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setIsDeletingImage(true);

    // 1. Önce silinecek resimleri R2'den sil (pendingRemovedImages)
    if (pendingRemovedImages.length > 0) {
      for (const imagePath of pendingRemovedImages) {
        try {
          const response = await fetch('/api/admin/delete-product-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productId: editingProduct.id,
              imagePath: imagePath,
            }),
          });

          if (!response.ok) {
            const result = await response.json();
            console.error('Resim silme hatası:', result.error);
            toast.error(`Resim silinemedi: ${imagePath}`);
            setIsDeletingImage(false);
            return; // Silme başarısızsa güncellemeyi durdur
          }
        } catch (error: any) {
          console.error('Resim silme hatası:', error);
          toast.error(`Resim silinemedi: ${error.message}`);
          setIsDeletingImage(false);
          return;
        }
      }
    }

    // 2. Yeni resimleri yükle
    const uploadedNames: string[] = [];

    for (const img of editingProduct.images) {
      if (img instanceof File) {
        const turkishPattern = /[ıİğĞüÜşŞöÖçÇ]/;
        if (turkishPattern.test(img.name)) {
          toast.error("Dosya adında Türkçe karakter bulunuyor. Lütfen İngilizce karakterler kullanın.");
          continue;
        }

        const fileName = await uploadFileViaAPI(img);
        if (fileName) {
          uploadedNames.push(fileName);
        }
      } else {
        uploadedNames.push(img);
      }
    }

    // 3. DB'yi güncelle

    const updateData = {
      title: editingProduct.title,
      collection: editingProduct.category + " Koleksiyonu",
      category: editingProduct.category,
      price: editingProduct.price,
      status: editingProduct.status,
      year: editingProduct.year || new Date().getFullYear(),
      features: editingProduct.features || [],
      size: editingProduct.size || [],
      colors: editingProduct.colors || [],
      images: uploadedNames,
      description: editingProduct.description || "",
    };

    try {
      const response = await fetch('/api/admin/urunler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingProduct.id,
          updates: updateData,
        }),
      });

      if (!response.ok) {
        throw new Error('Ürün güncellenemedi');
      }

      const updatedProduct = { ...editingProduct, images: uploadedNames };
      
      setAllProducts((prev) =>
        prev.map((product) =>
          product.id === editingProduct.id ? updatedProduct : product
        )
      );

      // Update cache
      updateCacheItem<Product>(CACHE_KEY, editingProduct.id, () => updatedProduct);

      // Temizlik
      setEditingProduct(null);
      setPendingRemovedImages([]);
      toast.success("Ürün başarıyla güncellendi! ✅");
    } catch (error: any) {
      console.error("Ürün güncellenemedi:", error.message);
      toast.error("Ürün güncellenirken bir hata oluştu! ❌");
    } finally {
      setIsDeletingImage(false);
    }
  };

  // Delete product handlers
  const confirmDeleteProduct = (id: number) => {
    setDeleteProductId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (deleteProductId === null) return;

    try {
      const response = await fetch(`/api/admin/urunler?id=${deleteProductId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Ürün silinemedi');
      }

      setAllProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
      removeFromCache(CACHE_KEY, deleteProductId);
      
      setIsDeleteModalOpen(false);
      setDeleteProductId(null);
      toast.success("Ürün ve fotoğrafları başarıyla silindi! ✅");
    } catch (error: any) {
      console.error("Ürün silinemedi:", error.message);
      toast.error("Ürün silinirken bir hata oluştu! ❌");
    }
  };

  // Force refresh function (for manual refresh)
  const refreshProducts = () => fetchProducts(true);

  // Modal iptal edildiğinde temizlik yap
  const cancelEditProduct = () => {
    setEditingProduct(null);
    setPendingRemovedImages([]);
  };

  // ============== TOPLU ÜRÜN EKLEME FONKSİYONLARI ==============

  // Toplu yayın durumu değiştirme fonksiyonları
  
  // Yayında ve Yayında Değil sayıları
  const publishedCount = allProducts.filter(p => p.status === 'Yayında').length;
  const unpublishedCount = allProducts.filter(p => p.status !== 'Yayında').length;

  // Aksiyon seçildiğinde (Yayına Al veya Yayından Kaldır)
  const handleBulkStatusActionSelect = (action: 'Yayına Al' | 'Yayından Kaldır') => {
    setBulkStatusAction(action);
    setIsBulkStatusActionModalOpen(false);
    setSelectedProductIds([]);
    setIsBulkStatusProductModalOpen(true);
  };

  // Ürün seçimini toggle et
  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Tümünü seç/kaldır
  const toggleSelectAll = (filteredIds: number[]) => {
    if (selectedProductIds.length === filteredIds.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredIds);
    }
  };

  // Aksiyona göre filtrelenmiş ürünleri getir
  const getFilteredProductsForBulkStatus = () => {
    if (bulkStatusAction === 'Yayına Al') {
      return allProducts.filter((p) => p.status !== 'Yayında');
    } else if (bulkStatusAction === 'Yayından Kaldır') {
      return allProducts.filter((p) => p.status === 'Yayında');
    }
    return [];
  };

  // Onay modalını aç
  const openBulkStatusConfirmModal = () => {
    if (selectedProductIds.length === 0) {
      toast.error('En az bir ürün seçmelisiniz');
      return;
    }
    setIsBulkStatusProductModalOpen(false);
    setIsBulkStatusConfirmModalOpen(true);
  };

  // Toplu durum değişikliğini uygula
  const executeBulkStatusChange = async () => {
    if (selectedProductIds.length === 0 || !bulkStatusAction) {
      return;
    }

    setIsProcessingBulkStatus(true);

    try {
      const newStatus = bulkStatusAction === 'Yayına Al' ? 'Yayında' : 'Yayında Değil';

      const response = await fetch('/api/admin/urunler/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          urunIds: selectedProductIds,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Durum güncellenemedi');
      }

      const result = await response.json();
      
      toast.success(`${result.updatedCount || selectedProductIds.length} ürün başarıyla güncellendi!`);

      // Ürünleri yenile
      fetchProducts(true);

      // Modalları kapat ve state'leri sıfırla
      closeBulkStatusModals();
    } catch (error) {
      console.error('Toplu durum değişikliği hatası:', error);
      toast.error('Ürünler güncellenirken bir hata oluştu');
    } finally {
      setIsProcessingBulkStatus(false);
    }
  };

  // Tüm bulk status modallarını kapat ve state'leri sıfırla
  const closeBulkStatusModals = () => {
    setIsBulkStatusActionModalOpen(false);
    setIsBulkStatusProductModalOpen(false);
    setIsBulkStatusConfirmModalOpen(false);
    setBulkStatusAction(null);
    setSelectedProductIds([]);
  };

  return {
    allProducts,
    filteredProducts,
    sortedProducts,
    currentProducts,
    loading,
    searchTermProducts,
    setSearchTermProducts,
    searchOpenProducts,
    setSearchOpenProducts,
    statusFilter,
    setStatusFilter,
    currentPage,
    totalProductsPages,
    indexOfFirstProduct,
    indexOfLastProduct,
    handlePageChange,
    getPaginationNumbers,
    getProductStatusColor,
    sortConfig,
    setSortConfig,
    // New product
    newProduct,
    setNewProduct,
    isAddProductModalOpen,
    setIsAddProductModalOpen,
    uploadError,
    setUploadError,
    handleInputChange,
    addSize,
    removeSize,
    addImage,
    removeImage,
    handleDragEnd,
    handleProductSubmit,
    // Edit product
    editingProduct,
    setEditingProduct,
    handleEditProduct,
    cancelEditProduct,
    handleEditInputChange,
    handleEditImageUpload,
    handleEditImageRemove,
    isDeletingImage,
    handleUpdateProduct,
    // Delete product
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deleteProductId,
    confirmDeleteProduct,
    handleDeleteProduct,
    refreshProducts,
    // Bulk status change
    isBulkStatusActionModalOpen,
    setIsBulkStatusActionModalOpen,
    bulkStatusAction,
    isBulkStatusProductModalOpen,
    setIsBulkStatusProductModalOpen,
    selectedProductIds,
    isBulkStatusConfirmModalOpen,
    setIsBulkStatusConfirmModalOpen,
    isProcessingBulkStatus,
    handleBulkStatusActionSelect,
    toggleProductSelection,
    toggleSelectAll,
    getFilteredProductsForBulkStatus,
    openBulkStatusConfirmModal,
    executeBulkStatusChange,
    closeBulkStatusModals,
    publishedCount,
    unpublishedCount,
  };
}
