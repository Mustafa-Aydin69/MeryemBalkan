'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [searchOpenProducts, setSearchOpenProducts] = useState(false);
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

  // Fetch products
  useEffect(() => {
    async function getProducts() {
      const { data, error } = await supabase.from("urunler").select("*");

      if (error) {
        console.error("Ürünler alınamadı:", error.message);
      } else if (data) {
        setAllProducts(
          data.map((item) => ({
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
          }))
        );
      }
    }
    getProducts();
  }, []);

  // Filtering
  const filteredProducts = allProducts.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.collection.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTermProducts.toLowerCase())
  );

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

  // Product submit handler
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    const bucket = "urunler";
    const uploadedNames: string[] = [];

    for (const item of newProduct.images) {
      if (item instanceof File) {
        const uniqueName = `${Date.now()}_${item.name}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(uniqueName, item);

        if (uploadError) {
          console.error("Fotoğraf yüklenemedi:", uploadError.message);
          setUploadError(`Fotoğraf yüklenemedi: ${uploadError.message}`);
          continue;
        }

        uploadedNames.push(uniqueName);
      } else if (typeof item === "string") {
        uploadedNames.push(item);
      }
    }

    const { error: insertError } = await supabase.from("urunler").insert([
      {
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
      },
    ]);

    if (insertError) {
      console.error("Ürün eklenemedi:", insertError.message);
      toast.error("Ürün eklenemedi! ❌");
      return;
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
    const { data } = await supabase.from("urunler").select("*");
    if (data) {
      setAllProducts(
        data.map((item) => ({
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
        }))
      );
    }
  };

  // Edit product handlers
  const handleEditProduct = (product: Product) => {
    const bucket = "urunler";

    const imagePreviews =
      (product.images || [])
        .filter((img) => typeof img === "string" && img.trim() !== "")
        .map(
          (img) => supabase.storage.from(bucket).getPublicUrl(img).data.publicUrl
        );

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

  const handleEditImageRemove = (index: number) => {
    setEditingProduct((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const bucket = "urunler";

    const { data: oldData, error: fetchError } = await supabase
      .from("urunler")
      .select("images")
      .eq("id", editingProduct.id)
      .single();

    if (fetchError) {
      console.error("Eski ürün alınamadı:", fetchError.message);
      toast.error("Ürün bilgisi alınamadı.");
      return;
    }

    const oldImages = oldData?.images || [];
    const uploadedNames: string[] = [];

    for (const img of editingProduct.images) {
      if (img instanceof File) {
        const turkishPattern = /[ıİğĞüÜşŞöÖçÇ]/;
        if (turkishPattern.test(img.name)) {
          toast.error("Dosya adında Türkçe karakter bulunuyor. Lütfen İngilizce karakterler kullanın.");
          continue;
        }

        const uniqueName = `${Date.now()}_${img.name}`;
        const { error } = await supabase.storage.from(bucket).upload(uniqueName, img);
        if (error) {
          console.error("Fotoğraf yüklenemedi:", error.message);
          continue;
        }
        uploadedNames.push(uniqueName);
      } else {
        uploadedNames.push(img);
      }
    }

    const removedImages = oldImages.filter((img: string) => !uploadedNames.includes(img));

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

    const { error: updateError } = await supabase
      .from("urunler")
      .update(updateData)
      .eq("id", editingProduct.id);

    if (updateError) {
      console.error("Ürün güncellenemedi:", updateError.message);
      toast.error("Ürün güncellenirken bir hata oluştu! ❌");
      return;
    }

    if (removedImages.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove(removedImages);

      if (deleteError) {
        console.error("Storage silme hatası:", deleteError.message);
        toast.error("Bazı fotoğraflar storage'tan silinemedi.");
      } else {
        console.log("Silinen gereksiz dosyalar:", removedImages);
      }
    }

    setAllProducts((prev) =>
      prev.map((product) =>
        product.id === editingProduct.id ? { ...editingProduct, images: uploadedNames } : product
      )
    );

    setEditingProduct(null);
    toast.success("Ürün başarıyla güncellendi! ✅");
  };

  // Delete product handlers
  const confirmDeleteProduct = (id: number) => {
    setDeleteProductId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (deleteProductId === null) return;

    const { data: productData, error: fetchError } = await supabase
      .from("urunler")
      .select("images")
      .eq("id", deleteProductId)
      .single();

    if (fetchError) {
      console.error("Ürün bilgisi alınamadı:", fetchError.message);
      toast.error("Ürün bilgisi alınamadı! ❌");
      return;
    }

    if (productData?.images && Array.isArray(productData.images) && productData.images.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("urunler")
        .remove(productData.images);

      if (storageError) {
        console.warn("Bazı fotoğraflar silinemedi:", storageError.message);
        toast.warning("Bazı fotoğraflar Buckets'tan silinemedi ⚠️");
      }
    }

    const { error } = await supabase
      .from("urunler")
      .delete()
      .eq("id", deleteProductId);

    if (error) {
      console.error("Ürün silinemedi:", error.message);
      toast.error("Ürün silinirken bir hata oluştu! ❌");
      return;
    }

    setAllProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
    setIsDeleteModalOpen(false);
    setDeleteProductId(null);
    toast.success("Ürün ve fotoğrafları başarıyla silindi! ✅");
  };

  return {
    allProducts,
    filteredProducts,
    sortedProducts,
    currentProducts,
    searchTermProducts,
    setSearchTermProducts,
    searchOpenProducts,
    setSearchOpenProducts,
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
    handleEditInputChange,
    handleEditImageUpload,
    handleEditImageRemove,
    handleUpdateProduct,
    // Delete product
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deleteProductId,
    confirmDeleteProduct,
    handleDeleteProduct,
  };
}

