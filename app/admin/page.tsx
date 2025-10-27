'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  message: string;
  date: string;
  status: 'Verildi' | 'Bekliyor';
}

export default function AdminPanel() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpenOrders, setSearchOpenOrders] = useState(false);
  const [searchTermOrders, setSearchTermOrders] = useState('');
  const [searchOpenProducts, setSearchOpenProducts] = useState(false);
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [messagesCurrentPage, setMessagesCurrentPage] = useState(1);
  const [messagesPerPage] = useState(10);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [reply, setReply] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  const [isDeleteMessageModalOpen, setIsDeleteMessageModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'asc',
  });

  useEffect(() => {
    async function getMessages() {
      const { data, error } = await supabase.from("mesajlar").select("*");
      if (error) console.error(error);
      if (data) {
        setMessages(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone,
            serviceType: item.hizmet,
            message: item.mesaj,
            date: item.tarih?.slice(0, 10),
            status: item.cevap === "Verildi" ? "Verildi" : "Bekliyor",
          }))
        );
      }
    }
    getMessages();
  }, []);

  useEffect(() => {
    async function getOrders() {
      const { data, error } = await supabase.from("siparisler").select("id, customerName, address, productName, size, color, eventDate, orderDate, status, price, phone, email, shippingCode");

      if (error) {
        console.error("Siparişler alınamadı:", error.message);
      } else if (data) {
        setOrders(
          data.map((item) => ({
            id: item.id,
            customerName: item.customerName,
            productName: item.productName,
            size: item.size,
            color: item.color,
            eventDate: item.eventDate,
            orderDate: item.orderDate,
            status: item.status,
            phone: item.phone || "",
            email: item.email || "",
            address: item.address,
            price: item.price,
            shippingCode: item.shippingCode || "",
          }))
        );
      }
    }

    getOrders();
  }, []);


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

  const [uploadError, setUploadError] = useState('');
  //Sipariş Listesi
  const [orders, setOrders] = useState<any[]>([]);
  //Yeni Ürün Ekle
  const [newProduct, setNewProduct] = useState({
    title: '',
    collection: '',
    price: '',
    description: '',
    category: '',
    size: [] as string[],
    colors: [] as string[],
    features: [] as string[],
    imagePreviews: [] as string[], // public URL’ler
    images: [] as string[],        // dosya adları
  });

  const [allProducts, setAllProducts] = useState<any[]>([]);


  // 1️⃣ Filtreleme
  const filteredProducts = allProducts.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.collection.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTermProducts.toLowerCase())
  );

  // 2️⃣ Sıralama
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

  // 3️⃣ Sayfalama (slicing)
  const totalProductsPages = Math.ceil(sortedProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Orders slice (arama + sayfalama)
  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
      order.phone.toLowerCase().includes(searchTermOrders.toLowerCase())
  );

  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = ordersCurrentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  //message slice(arama + sayfalama)
  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastMessage = messagesCurrentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = filteredMessages.slice(indexOfFirstMessage, indexOfLastMessage);
  const totalMessagesPages = Math.ceil(filteredMessages.length / messagesPerPage);


  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const showNavBackground = isClient && scrollY > 100;

  // Mevcut handleProductSubmit fonksiyonu
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    const bucket = "urunler";
    const uploadedNames: string[] = [];

    // 1️⃣ Fotoğrafları yükle
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
        uploadedNames.push(item); // varsa daha önce yüklenmiş isim
      }
    }

    // 2️⃣ Ürünü veritabanına ekle
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
        images: uploadedNames, // ✅ sadece dosya adlarını kaydediyoruz
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

    // 3️⃣ Formu sıfırla
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
  };


  const handleInputChange = (e) => {
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
      images: [...prev.images, ...newFiles], // geçici olarak File objeleri tut
    }));
  };


  // --- ÜRÜN DÜZENLEME FOTOĞRAF YÜKLEME ---
  const handleEditImageUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    const currentCount = editingProduct.images?.length || 0;

    if (currentCount + fileArray.length > 5) {
      toast.error("En fazla 5 fotoğraf yükleyebilirsiniz");
      return;
    }

    // Sadece tarayıcıda önizleme oluştur
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));

    setEditingProduct((prev: any) => ({
      ...prev,
      // Henüz upload etmeden File objelerini tutuyoruz
      images: [...(prev.images || []), ...fileArray],
      imagePreviews: [...(prev.imagePreviews || []), ...newPreviews],
    }));
  };


  // --- ÜRÜN DÜZENLEME FOTOĞRAF GEÇİCİ SİLME ---
  const handleEditImageRemove = (index: number) => {
    setEditingProduct((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_: any, i: number) => i !== index),
    }));
  };




  const confirmDeleteMessage = (id: number) => {
    setDeleteMessageId(id);
    setIsDeleteMessageModalOpen(true);
  };

  // Supabase'den gerçekten sil
  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("mesajlar")
      .delete()
      .eq("id", deleteMessageId);

    setIsDeleting(false);

    if (error) {
      console.error("Mesaj silinirken hata oluştu:", error.message);
      alert("Mesaj silinemedi: " + error.message);
      return;
    }

    // Başarılıysa state'i güncelle
    setMessages((prev) => prev.filter((m) => m.id !== deleteMessageId));
    setIsDeleteMessageModalOpen(false);
    setDeleteMessageId(null);
  };
  const removeImage = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
      images: prev.images.filter((_, i) => i !== index),
    }));
    setUploadError('');
  };

  // silme butonuna basıldığında modal aç
  const confirmDeleteProduct = (id: number) => {
    setDeleteProductId(id);
    setIsDeleteModalOpen(true);
  };

  // gerçekten sil
  // gerçekten sil
  const handleDeleteProduct = async () => {
    if (deleteProductId === null) return;

    // 1️⃣ Ürünü bul (fotoğraf isimlerini almak için)
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

    // 2️⃣ Eğer fotoğraf varsa Buckets'tan sil
    if (productData?.images && Array.isArray(productData.images) && productData.images.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("urunler")
        .remove(productData.images);

      if (storageError) {
        console.warn("Bazı fotoğraflar silinemedi:", storageError.message);
        toast.warning("Bazı fotoğraflar Buckets'tan silinemedi ⚠️");
      }
    }

    // 3️⃣ Veritabanından sil
    const { error } = await supabase
      .from("urunler")
      .delete()
      .eq("id", deleteProductId);

    if (error) {
      console.error("Ürün silinemedi:", error.message);
      toast.error("Ürün silinirken bir hata oluştu! ❌");
      return;
    }

    // 4️⃣ Frontend state'i güncelle
    setAllProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
    setIsDeleteModalOpen(false);
    setDeleteProductId(null);
    toast.success("Ürün ve fotoğrafları başarıyla silindi! ✅");
  };


  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = Array.from(newProduct.imagePreviews);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setNewProduct((prev) => ({ ...prev, imagePreviews: reordered }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hazırlanıyor':
        return 'bg-blue-100 text-blue-700';
      case 'Kargoya Verildi':
        return 'bg-orange-100 text-orange-700';
      case 'Teslim Edildi':
        return 'bg-green-100 text-green-700';
      case 'İptal Edildi':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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


  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const handleOrdersPageChange = (pageNumber) => {
    setOrdersCurrentPage(pageNumber);
  };

  const handleMessagesPageChange = (pageNumber) => {
    setMessagesCurrentPage(pageNumber);
  };


  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

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
  const getOrdersPaginationNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, ordersCurrentPage - delta); i <= Math.min(totalOrdersPages - 1, ordersCurrentPage + delta); i++) {
      range.push(i);
    }

    if (ordersCurrentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (ordersCurrentPage + delta < totalOrdersPages - 1) {
      rangeWithDots.push('...', totalOrdersPages);
    } else if (totalOrdersPages > 1) {
      rangeWithDots.push(totalOrdersPages);
    }

    return rangeWithDots;
  };

  const getMessagesPaginationNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, messagesCurrentPage - delta); i <= Math.min(totalMessagesPages - 1, messagesCurrentPage + delta); i++) {
      range.push(i);
    }

    if (messagesCurrentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (messagesCurrentPage + delta < totalMessagesPages - 1) {
      rangeWithDots.push('...', totalMessagesPages);
    } else if (totalMessagesPages > 1) {
      rangeWithDots.push(totalMessagesPages);
    }

    return rangeWithDots;
  };


  const handleEditProduct = (product) => {
    const bucket = "urunler";

    // Sadece string olan path'lerle işlem yap
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



  // 🔥 GÜNCELLENMİŞ GÜNCELLE BUTONU
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const bucket = "urunler";

    // 1️⃣ Eski ürün verisini al (silinmesi gerekenleri tespit etmek için)
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

    // 2️⃣ Yeni veya mevcut fotoğrafları işleyelim
    for (const img of editingProduct.images) {
      if (img instanceof File) {
        // 🚫 Türkçe karakter kontrolü
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

    // 3️⃣ Artık kullanılmayan eski dosyaları bul
    const removedImages = oldImages.filter((img: string) => !uploadedNames.includes(img));

    // 4️⃣ Veriyi güncelle
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

    // 5️⃣ Artık kullanılmayan görselleri Supabase Storage'tan sil
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

    // 6️⃣ UI güncelle
    setAllProducts((prev) =>
      prev.map((product) =>
        product.id === editingProduct.id ? { ...editingProduct, images: uploadedNames } : product
      )
    );

    setEditingProduct(null);
    toast.success("Ürün başarıyla güncellendi! ✅");
  };



  const handleEditInputChange = (field, value) => {
    setEditingProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditOrder = (order) => {
    setEditingOrder({
      ...order,
      originalStatus: order.status,
      shippingCode: order.shippingCode || "",
    });
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    // Güncellenecek veriyi hazırla
    const updateData = {
      status: editingOrder.status,
    };

    // Eğer sipariş kargoya verildiyse kargo kodunu da ekle
    if (editingOrder.status === "Kargoya Verildi") {
      updateData.shippingCode =
        editingOrder.shippingCode !== undefined
          ? editingOrder.shippingCode
          : null;
    }

    console.log("🟩 Supabase'e gönderilen:", updateData);

    // Supabase UPDATE işlemi
    const { data, error } = await supabase
      .from("siparisler")
      .update(updateData)
      .eq("id", editingOrder.id)
      .select();

    if (error) {
      console.error("Sipariş güncellenemedi:", error.message);
      alert("Bir hata oluştu: " + error.message);
      return;
    }

    // 📨 Eğer statü Kargoya Verildi ise e-posta gönder API'sini çağır
    if (editingOrder.status === "Kargoya Verildi" && editingOrder.shippingCode) {
      try {
        console.log("📦 Kargo maili gönderiliyor...");

        await fetch("/api/send-shipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: editingOrder.id,
            customerEmail: editingOrder.email, // müşteri maili sipariş tablosunda olmalı
            trackingCode: editingOrder.shippingCode,
          }),
        });


        console.log("✅ Kargo maili gönderildi.");
      } catch (err) {
        console.error("Mail gönderim hatası:", err);
      }
    }

    // Frontend listesini güncelle
    setOrders((prev) =>
      prev.map((order) =>
        order.id === editingOrder.id ? { ...order, ...updateData } : order
      )
    );

    // Modalı kapat
    setEditingOrder(null);
    toast.success("Sipariş başarıyla güncellendi ✅");
  };


  const handleOrderInputChange = (field, value) => {
    setEditingOrder((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'
        }`}
    >
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${showNavBackground
          ? isDarkMode
            ? 'bg-gray-900 shadow-lg'
            : 'bg-white shadow-lg'
          : isDarkMode
            ? 'bg-gray-900'
            : 'bg-white'
          }`}
      >
        <div className="flex flex-col items-center px-4 md:px-8 py-4 md:py-5">
          {/* Üst Satır: Tema Butonu - Başlık - Home */}
          <div className="flex justify-between items-center w-full mb-2">
            {/* Tema Butonu */}
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
                }`}
            >
              <i
                className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'
                  } text-lg`}
              ></i>
            </button>

            {/* Orta: Başlık */}
            <div className="flex-1 text-center">
              <h1
                className={`text-xl font-light tracking-[0.3em] font-serif italic transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                  }`}
              >
                MERYEM BALKAN
              </h1>
              <p
                className={`text-xs tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
              >
                YÖNETİCİ PANELİ
              </p>
            </div>

            {/* Ana Sayfa Butonu */}
            <Link
              href="/"
              className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
                }`}
            >
              <i className="ri-home-line text-lg"></i>
            </Link>
          </div>

          {/* Alt Satır: Sekmeler */}
          <div className="flex justify-center space-x-4 sm:space-x-6 md:space-x-8 text-xs sm:text-sm font-medium tracking-wide overflow-x-auto w-full md:w-auto mt-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`cursor-pointer transition-colors font-light pb-2 ${activeTab === 'orders'
                ? `border-b-2 ${isDarkMode
                  ? 'border-white text-white'
                  : 'border-black text-black'
                }`
                : `${isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
                }`
                }`}
            >
              SİPARİŞLER
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`cursor-pointer transition-colors font-light pb-2 ${activeTab === 'products'
                ? `border-b-2 ${isDarkMode
                  ? 'border-white text-white'
                  : 'border-black text-black'
                }`
                : `${isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
                }`
                }`}
            >
              ÜRÜN YÖNETİMİ
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`cursor-pointer transition-colors font-light pb-2 ${activeTab === 'messages'
                ? `border-b-2 ${isDarkMode
                  ? 'border-white text-white'
                  : 'border-black text-black'
                }`
                : `${isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
                }`
                }`}
            >
              MESAJLAR
            </button>
          </div>
        </div>
      </nav>


      <main
        className={`pt-32 pb-16 px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}
      >
        <div className="max-w-7xl mx-auto">
          {activeTab === 'orders' && (
            <div>
              {/* ÜST KISIM */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mt-8">
                <h2
                  className={`text-2xl font-light tracking-wide ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  SİPARİŞ YÖNETİMİ
                </h2>

                <div className="flex flex-wrap items-center gap-2 mt-2 w-full sm:w-auto">
                  {/* Arama Butonu */}
                  <button
                    onClick={() => {
                      if (searchOpenOrders) setSearchTermOrders('');
                      setSearchOpenOrders(!searchOpenOrders);
                    }}
                    className={`p-2 rounded-full transition-colors ${isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                  >
                    <i className="ri-search-line"></i>
                  </button>

                  {/* Arama Input */}
                  {searchOpenOrders && (
                    <input
                      type="text"
                      value={searchTermOrders}
                      onChange={(e) => setSearchTermOrders(e.target.value)}
                      placeholder="Siparişlerde ara..."
                      className={`px-3 py-2 rounded transition-colors ${isDarkMode
                        ? 'bg-gray-700 text-white border border-gray-600'
                        : 'bg-gray-100 text-black border border-gray-300'
                        }`}
                    />
                  )}

                  <div
                    className={`px-4 py-2 rounded-full text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
                      }`}
                  >
                    Toplam: {filteredOrders.length} Sipariş
                  </div>
                </div>
              </div>

              {/* 🧱 Masaüstü Tablo */}
              <div className="overflow-x-auto hidden sm:block">
                <table
                  className={`w-full border-collapse ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                >
                  <thead>
                    <tr
                      className={`border-b ${isDarkMode
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                      {['SİPARİŞ NO', 'MÜŞTERİ', 'DURUM', 'ETKİNLİK TARİHİ', 'FİYAT', 'İŞLEM'].map(
                        (header) => (
                          <th
                            key={header}
                            className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                              }`}
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {currentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`border-b transition-colors ${isDarkMode
                          ? 'border-gray-700 hover:bg-gray-700'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {/* SİPARİŞ NO */}
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          #{order.id.toString().padStart(4, '0')}
                        </td>

                        {/* MÜŞTERİ */}
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p
                              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                            >
                              {order.phone}
                            </p>
                          </div>
                        </td>

                        {/* DURUM */}
                        <td className="p-3 sm:p-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        {/* ETKİNLİK TARİHİ */}
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          {order.eventDate}
                        </td>

                        {/* FİYAT */}
                        <td
                          className={`p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          {order.price}
                        </td>

                        {/* İŞLEMLER */}
                        <td className="p-3 sm:p-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEditOrder(order)}
                              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isDarkMode
                                ? 'hover:bg-gray-600 text-gray-300 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-600 hover:text-black'
                                }`}
                              title="Siparişi Düzenle"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>

                            <button
                              onClick={() => setViewingOrder(order)}
                              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isDarkMode
                                ? 'hover:bg-gray-600 text-gray-300 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-600 hover:text-black'
                                }`}
                              title="Detayları Gör"
                            >
                              <i className="ri-file-list-line text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 📱 Mobil Kart Görünümü */}
              <div className="sm:hidden space-y-4">
                {currentOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
                      }`}
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold">
                        Sipariş #{order.id.toString().padStart(4, '0')}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="text-sm mb-1">
                      <span className="font-medium">Müşteri:</span> {order.customerName}
                      <br />
                      <a
                        href={`tel:${order.phone}`}
                        className="text-indigo-500 hover:underline"
                      >
                        {order.phone}
                      </a>
                    </div>

                    <p className="text-sm mb-1">
                      <span className="font-medium">Etkinlik Tarihi:</span>{' '}
                      {order.eventDate}
                    </p>

                    <p className="text-sm mb-1">
                      <span className="font-medium">Fiyat:</span> {order.price}
                    </p>

                    <div className="flex justify-end mt-3 space-x-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="px-3 py-1 text-xs rounded bg-indigo-500 text-white hover:bg-indigo-600"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
                      >
                        Detay
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🔢 SAYFALAMA */}
              {totalOrdersPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  {/* ◀️ Geri Butonu */}
                  <button
                    onClick={() => handleOrdersPageChange(ordersCurrentPage - 1)}
                    disabled={ordersCurrentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${ordersCurrentPage === 1
                      ? isDarkMode
                        ? 'bg-gray-800 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                      : isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>

                  {/* Sayfa Numaraları */}
                  {getOrdersPaginationNumbers().map((number, index) => (
                    <span key={index}>
                      {number === '...' ? (
                        <span
                          className={`px-3 py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOrdersPageChange(number as number)}
                          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${ordersCurrentPage === number
                            ? isDarkMode
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-white hover:bg-gray-600'
                              : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                          {number}
                        </button>
                      )}
                    </span>
                  ))}

                  {/* ▶️ İleri Butonu */}
                  <button
                    onClick={() => handleOrdersPageChange(ordersCurrentPage + 1)}
                    disabled={ordersCurrentPage === totalOrdersPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${ordersCurrentPage === totalOrdersPages
                      ? isDarkMode
                        ? 'bg-gray-800 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                      : isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              {/* Üst Kısım */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 mt-8">
                <h2
                  className={`text-2xl font-light tracking-wide ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  ÜRÜN YÖNETİMİ
                </h2>

                {/* Üst Butonlar + Arama */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                  {/* Yeni Ürün Ekle */}
                  <button
                    onClick={() => setIsAddProductModalOpen(true)}
                    className={`w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${isDarkMode
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-800'
                      }`}
                  >
                    <i className="ri-add-line mr-2"></i> YENİ ÜRÜN EKLE
                  </button>

                  {/* Arama Butonu + Input + Sayaç */}
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <button
                      onClick={() => {
                        if (searchOpenProducts) setSearchTermProducts('');
                        setSearchOpenProducts(!searchOpenProducts);
                      }}
                      className={`p-2 rounded-full transition-colors ${isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                        }`}
                    >
                      <i className="ri-search-line"></i>
                    </button>

                    {searchOpenProducts && (
                      <input
                        type="text"
                        value={searchTermProducts}
                        onChange={(e) => setSearchTermProducts(e.target.value)}
                        placeholder="Ürünlerde ara..."
                        className={`px-3 py-2 rounded transition-colors w-full sm:w-auto ${isDarkMode
                          ? 'bg-gray-700 text-white border border-gray-600'
                          : 'bg-gray-100 text-black border border-gray-300'
                          }`}
                      />
                    )}

                    <div
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
                        }`}
                    >
                      Toplam: {filteredProducts.length} Ürün
                    </div>
                  </div>
                </div>
              </div>

              {/* Kartlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {/* Toplam Ürün */}
                <div
                  className={`p-5 sm:p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 text-blue-600 mb-4 mx-auto">
                    <i className="ri-shirt-line text-xl sm:text-2xl"></i>
                  </div>
                  <h3
                    className={`text-lg sm:text-xl font-medium text-center mb-2 ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Toplam Ürün
                  </h3>
                  <p
                    className={`text-2xl sm:text-3xl font-light text-center ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    {allProducts.length}
                  </p>
                </div>

                {/* Yayındaki Ürünler */}
                <div
                  className={`p-5 sm:p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 text-green-600 mb-4 mx-auto">
                    <i className="ri-check-line text-xl sm:text-2xl"></i>
                  </div>
                  <h3
                    className={`text-lg sm:text-xl font-medium text-center mb-2 ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Yayındaki Ürünler
                  </h3>
                  <p
                    className={`text-2xl sm:text-3xl font-light text-center ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    {allProducts.filter((p) => p.status === 'Yayında').length}
                  </p>
                </div>
              </div>

              {/* Ürün Tablosu */}
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                  <h3
                    className={`text-lg sm:text-xl font-medium ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    TÜM ÜRÜNLER
                  </h3>
                  <div
                    className={`text-sm text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                  >
                    {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, allProducts.length)} /{' '}
                    {allProducts.length} ürün
                  </div>
                </div>

                {/* 💻 Masaüstü Tablo */}
                <div className="overflow-x-auto hidden sm:block">
                  <table
                    className={`w-full border-collapse ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                  >
                    <thead>
                      <tr
                        className={`border-b ${isDarkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <th className="text-left p-3 sm:p-4 text-sm font-medium">ÜRÜN ADI</th>
                        <th className="text-left p-3 sm:p-4 text-sm font-medium hidden md:table-cell">
                          KOLEKSİYON
                        </th>
                        <th className="text-left p-3 sm:p-4 text-sm font-medium">FİYAT</th>
                        <th className="text-left p-3 sm:p-4 text-sm font-medium">DURUM</th>
                        <th className="text-center p-3 sm:p-4 text-sm font-medium">İŞLEMLER</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentProducts.map((product) => (
                        <tr
                          key={product.id}
                          className={`border-b transition-colors ${isDarkMode
                            ? 'border-gray-700 hover:bg-gray-700'
                            : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <td className={`p-3 sm:p-4 text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                ID: #{product.id}
                              </p>
                            </div>
                          </td>
                          <td
                            className={`p-3 sm:p-4 text-sm hidden md:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}
                          >
                            {product.collection}
                          </td>
                          <td
                            className={`p-3 sm:p-4 font-medium ${isDarkMode ? 'text-white' : 'text-black'
                              }`}
                          >
                            {product.price} TL
                          </td>
                          <td className="p-3 sm:p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getProductStatusColor(
                                product.status
                              )}`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isDarkMode
                                  ? 'hover:bg-blue-600 text-gray-300 hover:text-white'
                                  : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                                  }`}
                                title="Ürünü Düzenle"
                              >
                                <i className="ri-edit-line text-sm"></i>
                              </button>
                              <button
                                onClick={() => confirmDeleteProduct(product.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-800"
                                title="Ürünü Sil"
                              >
                                <i className="ri-delete-bin-line text-sm"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 📱 Mobil Kart Görünümü */}
                <div className="sm:hidden space-y-4">
                  {currentProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
                        }`}
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-semibold text-base">{product.title}</h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getProductStatusColor(
                            product.status
                          )}`}
                        >
                          {product.status}
                        </span>
                      </div>
                      <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ID: #{product.id}
                      </p>
                      <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Koleksiyon:</span> {product.collection}
                      </p>
                      <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Fiyat:</span> {product.price} TL
                      </p>

                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-3 py-1 text-xs rounded bg-indigo-500 text-white hover:bg-indigo-600"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => confirmDeleteProduct(product.id)}
                          className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 🔢 Sayfalama */}
                {totalProductsPages > 1 && (
                  <div className="flex justify-center items-center mt-8 space-x-2">
                    {/* Geri Butonu */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${currentPage === 1
                        ? isDarkMode
                          ? 'bg-gray-800 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                        : isDarkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>

                    {/* Sayfa Numaraları */}
                    {getPaginationNumbers().map((number, index) => (
                      <span key={index}>
                        {number === '...' ? (
                          <span
                            className={`px-3 py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePageChange(number as number)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${currentPage === number
                              ? isDarkMode
                                ? 'bg-white text-black'
                                : 'bg-black text-white'
                              : isDarkMode
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                              }`}
                          >
                            {number}
                          </button>
                        )}
                      </span>
                    ))}

                    {/* İleri Butonu */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalProductsPages}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${currentPage === totalProductsPages
                        ? isDarkMode
                          ? 'bg-gray-800 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                        : isDarkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div>
              <div className="flex justify-between items-center mb-8 mt-8">
                <h2
                  className={`text-2xl font-light tracking-wide ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  MESAJLAR
                </h2>

                <div className="flex items-center space-x-2">
                  {/* Arama Butonu */}
                  <button
                    onClick={() => {
                      if (searchOpen) {
                        setSearchTerm('');
                      }
                      setSearchOpen(!searchOpen);
                    }}
                    className={`p-2 rounded-full transition-colors ${isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                  >
                    <i className="ri-search-line"></i>
                  </button>

                  {/* Arama Inputu */}
                  {searchOpen && (
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ara..."
                      className={`px-3 py-2 rounded transition-colors ${isDarkMode
                        ? 'bg-gray-700 text-white border border-gray-600'
                        : 'bg-gray-100 text-black border border-gray-300'
                        }`}
                    />
                  )}

                  <div
                    className={`px-4 py-2 rounded-full text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
                      }`}
                  >
                    Toplam: {filteredMessages.length} Mesaj
                  </div>
                </div>
              </div>

              {/* 🧱 Masaüstü Tablo */}
              <div className="overflow-x-auto hidden sm:block">
                <table
                  className={`w-full border-collapse ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                >
                  <thead>
                    <tr
                      className={`border-b ${isDarkMode
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                      <th className="text-left p-3">GÖNDEREN</th>
                      <th className="text-left p-3 hidden md:table-cell">İLETİŞİM</th>
                      <th className="text-left p-3 hidden lg:table-cell">HİZMET TÜRÜ</th>
                      <th className="text-left p-3">MESAJ</th>
                      <th className="text-left p-3 hidden sm:table-cell">TARİH</th>
                      <th className="text-left p-3">CEVAP</th>
                      <th className="text-center p-3">İŞLEM</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentMessages.map((msg) => (
                      <tr
                        key={msg.id}
                        className={`border-b transition-colors ${isDarkMode
                          ? 'border-gray-700 hover:bg-gray-700'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <td className="p-3">{msg.name}</td>

                        {/* İLETİŞİM sütunu */}
                        <td className="p-3 hidden md:table-cell">
                          <div className="flex flex-col space-y-1">
                            <a
                              href={`mailto:${msg.email}`}
                              className="text-sm text-indigo-500 hover:underline"
                            >
                              {msg.email}
                            </a>
                            <a
                              href={`tel:${msg.phone}`}
                              className="text-sm text-indigo-500 hover:underline"
                            >
                              {msg.phone}
                            </a>
                          </div>
                        </td>

                        <td className="p-3 hidden lg:table-cell">{msg.serviceType}</td>
                        <td className="p-3">{msg.message}</td>
                        <td className="p-3 hidden sm:table-cell">{msg.date}</td>

                        {/* DURUM */}
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${msg.status === 'Verildi'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                              }`}
                          >
                            {msg.status}
                          </span>
                        </td>

                        {/* İŞLEM */}
                        <td className="p-3 text-center flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="px-3 py-1 text-xs rounded bg-indigo-500 text-white hover:bg-indigo-600"
                          >
                            Görüntüle
                          </button>

                          <button
                            onClick={() => confirmDeleteMessage(msg.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-800"
                            title="Mesajı Sil"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 📱 Mobil Kart Görünümü */}
              <div className="sm:hidden space-y-4">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
                      }`}
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold">{msg.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${msg.status === 'Verildi'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {msg.status}
                      </span>
                    </div>

                    <div className="text-sm mb-2">
                      <span className="font-medium">İletişim:</span>
                      <div className="flex flex-col">
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-indigo-500 hover:underline"
                        >
                          {msg.email}
                        </a>
                        <a
                          href={`tel:${msg.phone}`}
                          className="text-indigo-500 hover:underline"
                        >
                          {msg.phone}
                        </a>
                      </div>
                    </div>

                    <p className="text-sm mb-1">
                      <span className="font-medium">Hizmet Türü:</span> {msg.serviceType}
                    </p>

                    <p className="text-sm mb-1">
                      <span className="font-medium">Mesaj:</span> {msg.message}
                    </p>

                    <p className="text-xs text-gray-500">{msg.date}</p>

                    <div className="flex justify-end mt-3 space-x-2">
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="px-3 py-1 text-xs rounded bg-indigo-500 text-white hover:bg-indigo-600"
                      >
                        Görüntüle
                      </button>
                      <button
                        onClick={() => confirmDeleteMessage(msg.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-800"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🔢 Sayfalama */}
              {totalMessagesPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <button
                    onClick={() => handleMessagesPageChange(messagesCurrentPage - 1)}
                    disabled={messagesCurrentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${messagesCurrentPage === 1
                      ? isDarkMode
                        ? 'bg-gray-800 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                      : isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>

                  {getMessagesPaginationNumbers().map((number, index) => (
                    <span key={index}>
                      {number === '...' ? (
                        <span
                          className={`px-3 py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMessagesPageChange(number as number)}
                          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${messagesCurrentPage === number
                            ? isDarkMode
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-white hover:bg-gray-600'
                              : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                          {number}
                        </button>
                      )}
                    </span>
                  ))}

                  <button
                    onClick={() => handleMessagesPageChange(messagesCurrentPage + 1)}
                    disabled={messagesCurrentPage === totalMessagesPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${messagesCurrentPage === totalMessagesPages
                      ? isDarkMode
                        ? 'bg-gray-800 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                      : isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
          >
            <div
              className={`p-6 border-b transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
            >
              <div className="flex justify-between items-center">
                <h3
                  className={`text-xl font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Yeni Ürün Ekle
                </h3>
                <button
                  onClick={() => {
                    setIsAddProductModalOpen(false);
                    // Modal kapandığında formu sıfırla
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
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'
                    }`}
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            <form id="add-product-form" onSubmit={handleProductSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="title"
                    className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newProduct.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white' : 'bg-white border-gray-300 text-black focus:border-black'
                      }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Kategori *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border focus:outline-none text-sm pr-8 transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white' : 'bg-white border-gray-300 text-black focus:border-black'
                      }`}
                  >
                    <option value="Kategori">Kategori Seçiniz</option>
                    <option value="Abiye">Abiye</option>
                    <option value="Gelinlik">Gelinlik</option>
                    <option value="Nisanlik">Nişanlık</option>
                    <option value="Kinalik">Kınalık</option>
                    <option value="After-Party">After Party</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Fiyat *
                  </label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    placeholder="15.000TL"
                    required
                    className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white' : 'bg-white border-gray-300 text-black focus:border-black'
                      }`}
                  />
                </div>

                {/* Bedenler - Düzenleme modalında */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Bedenler
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        newProduct.size.includes('36-40')
                          ? removeSize('36-40')
                          : addSize('36-40')
                      }
                      className={`px-4 py-2 text-sm rounded border cursor-pointer whitespace-nowrap transition-colors ${newProduct.size.includes('36-40')
                        ? isDarkMode
                          ? 'bg-white text-black border-white'
                          : 'bg-black text-white border-black'
                        : isDarkMode
                          ? 'border-gray-600 text-white hover:border-white'
                          : 'border-gray-300 text-black hover:border-black'
                        }`}
                    >
                      36-40
                    </button>
                  </div>
                </div>


                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Renkler
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      id="color"
                      placeholder="Renk ekle (örn. Kırmızı)"
                      className={`w-full px-4 py-2 border rounded text-sm transition-colors ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-white'
                        : 'bg-white border-gray-300 text-black focus:border-black'
                        }`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !newProduct.colors.includes(value)) {
                            setNewProduct((prev) => ({
                              ...prev,
                              colors: [...prev.colors, value],
                            }));
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Eklenen renkler listesi */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newProduct.colors.map((color, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800 flex items-center"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() =>
                            setNewProduct((prev) => ({
                              ...prev,
                              colors: prev.colors.filter((c) => c !== color),
                            }))
                          }
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              <div>
                {/* Açıklama Başlığı */}
                <label
                  htmlFor="description"
                  className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Açıklama Başlığı
                </label>

                <input
                  type="text"
                  id="description"
                  name="description"
                  value={newProduct.description || ''}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Örn: Zarif siyah gece elbisesi."
                  className={`w-full px-4 py-3 mb-4 border focus:outline-none text-sm transition-colors ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-white'
                    : 'bg-white border-gray-300 text-black focus:border-black'
                    }`}
                />

                {/* Açıklama */}
                <label
                  htmlFor="feat"
                  className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Açıklama *
                </label>

                <textarea
                  id="features"
                  name="features"
                  value={newProduct.features}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  required
                  placeholder="Örn: Kumaş Özellikleri, Ürün Detayları vb."
                  className={`w-full px-4 py-3 border focus:outline-none text-sm resize-vertical transition-colors ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-white'
                    : 'bg-white border-gray-300 text-black focus:border-black'
                    }`}
                ></textarea>

                <div
                  className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                >
                  {newProduct.features.length}/500 karakter
                </div>
              </div>



              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Ürün Fotoğrafları (En fazla 5 adet)
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    id="product-images"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        addImage(e.target.files);
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => document.getElementById('product-images')?.click()}
                    disabled={newProduct.imagePreviews.length >= 5}
                    className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${newProduct.imagePreviews.length >= 5
                      ? isDarkMode
                        ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                        : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
                      }`}
                  >
                    <i className="ri-image-add-line text-2xl mb-2"></i>
                    <span className="text-sm">
                      {newProduct.imagePreviews.length >= 5 ? 'Maksimum Limit Aşıldı' : 'Fotoğraf Seç'}
                    </span>
                    <span className="text-xs mt-1">
                      {newProduct.imagePreviews.length}/5 fotoğraf
                    </span>
                  </button>

                  {uploadError && (
                    <div
                      className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-lg border border-red-200"
                    >
                      <i className="ri-error-warning-line mr-1"></i>
                      {uploadError}
                    </div>
                  )}

                  {newProduct.imagePreviews.length > 0 && (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="images" direction="horizontal">
                        {(provided) => (
                          <div
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {newProduct.imagePreviews.map((preview, index) => (
                              <Draggable key={index} draggableId={index.toString()} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="relative group"
                                  >
                                    <img
                                      src={preview}
                                      alt={`Önizleme ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg border transition-transform group-hover:scale-105 cursor-pointer"
                                      onClick={() => setSelectedImage(preview)} // tam ekran için
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 shadow-md bg-red-600 text-white hover:bg-red-700"
                                    >
                                      <i className="ri-close-line text-xs"></i>
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}

                  {newProduct.imagePreviews.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span
                        className={`transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                      >
                        Toplam {newProduct.imagePreviews.length} fotoğraf seçildi
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewProduct((prev) => ({ ...prev, imagePreviews: [], images: [] }));
                          setUploadError('');
                          const input = document.getElementById('product-images') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className={`text-sm underline cursor-pointer transition-colors ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                          }`}
                      >
                        Tümünü Temizle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-4 tracking-wide font-medium transition-colors whitespace-nowrap rounded-full ${isDarkMode
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
                  }`}
              >
                ÜRÜNÜ EKLE
              </button>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className={`rounded-lg max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto transition-colors ${isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
          >
            {/* Üst Başlık */}
            <div
              className={`p-4 sm:p-6 border-b transition-colors ${isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <div className="flex justify-between items-center">
                <h3
                  className={`text-lg sm:text-xl font-medium transition-colors ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Ürün Düzenle
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${isDarkMode
                    ? "hover:bg-gray-700 text-white"
                    : "hover:bg-gray-100 text-black"
                    }`}
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* İçerik */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 text-sm sm:text-base">
              {/* Ürün Adı */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => handleEditInputChange("title", e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-black"
                    }`}
                />
              </div>

              {/* Koleksiyon */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Koleksiyon
                </label>
                <select
                  value={editingProduct.category || "Kategori"}
                  onChange={(e) =>
                    handleEditInputChange("category", e.target.value)
                  }
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded text-sm transition-colors ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white focus:border-white"
                    : "bg-white border-gray-300 text-black focus:border-black"
                    }`}
                >
                  <option value="Kategori">Kategori Seçiniz</option>
                  <option value="Abiye">Abiye</option>
                  <option value="Gelinlik">Gelinlik</option>
                  <option value="Nisanlik">Nişanlık</option>
                  <option value="Kinalik">Kınalık</option>
                  <option value="After-Party">After Party</option>
                </select>
              </div>

              {/* Fiyat */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Fiyat
                </label>
                <input
                  type="text"
                  value={editingProduct.price}
                  onChange={(e) => handleEditInputChange("price", e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-black"
                    }`}
                />
              </div>

              {/* Renkler */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Renkler
                </label>
                <input
                  type="text"
                  placeholder="Renk ekle (örn. Kırmızı) ve Enter’a bas"
                  className={`w-full px-3 sm:px-4 py-2 border rounded text-sm ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-black"
                    }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !(editingProduct.colors || []).includes(val)) {
                        handleEditInputChange("colors", [
                          ...(editingProduct.colors || []),
                          val,
                        ]);
                      }
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                {editingProduct.colors?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editingProduct.colors.map((color: string, i: number) => (
                      <span
                        key={`${color}-${i}`}
                        className="px-3 py-1 rounded-full text-xs sm:text-sm bg-gray-200 text-gray-800 flex items-center"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() =>
                            handleEditInputChange(
                              "colors",
                              editingProduct.colors.filter(
                                (c: string) => c !== color
                              )
                            )
                          }
                          className="ml-2 text-red-500 hover:text-red-700"
                          title="Sil"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Açıklama */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Açıklama Başlığı
                </label>
                <input
                  type="text"
                  value={editingProduct.description}
                  onChange={(e) =>
                    handleEditInputChange("description", e.target.value)
                  }
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-black"
                    }`}
                />
                <label
                  className={`block text-sm font-medium mt-4 mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Açıklama
                </label>
                <textarea
                  value={editingProduct.features || ""}
                  onChange={(e) =>
                    handleEditInputChange("features", e.target.value)
                  }
                  rows={3}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded resize-vertical ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-black"
                    }`}
                ></textarea>
              </div>

              {/* Ürün Fotoğrafları */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Ürün Fotoğrafları (En fazla 5 adet)
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    id="edit-product-images"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleEditImageUpload(e.target.files);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("edit-product-images")?.click()
                    }
                    disabled={editingProduct.images?.length >= 5}
                    className={`w-full h-28 sm:h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors text-sm ${editingProduct.images?.length >= 5
                      ? isDarkMode
                        ? "border-gray-700 text-gray-600 cursor-not-allowed"
                        : "border-gray-200 text-gray-400 cursor-not-allowed"
                      : isDarkMode
                        ? "border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300"
                        : "border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600"
                      }`}
                  >
                    <i className="ri-image-add-line text-2xl mb-1"></i>
                    <span>
                      {editingProduct.images?.length >= 5
                        ? "Maksimum Limit Aşıldı"
                        : "Fotoğraf Seç"}
                    </span>
                    <span className="text-xs mt-1">
                      {editingProduct.images?.length || 0}/5 fotoğraf
                    </span>
                  </button>

                  {/* Drag & Drop Önizlemeler */}
                  {editingProduct.images?.length > 0 && (
                    <DragDropContext
                      onDragEnd={(result) => {
                        if (!result.destination) return;

                        // Hem dosya adlarını hem public URL’leri sıralayalım
                        const reorderedImages = Array.from(editingProduct.images);
                        const reorderedPreviews = Array.from(editingProduct.imagePreviews || []);

                        const [movedImage] = reorderedImages.splice(result.source.index, 1);
                        const [movedPreview] = reorderedPreviews.splice(result.source.index, 1);

                        reorderedImages.splice(result.destination.index, 0, movedImage);
                        reorderedPreviews.splice(result.destination.index, 0, movedPreview);

                        setEditingProduct({
                          ...editingProduct,
                          images: reorderedImages,
                          imagePreviews: reorderedPreviews,
                        });
                      }}
                    >
                      <Droppable droppableId="images" direction="horizontal">
                        {(provided) => (
                          <div
                            className="flex gap-3 overflow-x-auto"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {editingProduct.imagePreviews?.map((preview, index) => (
                              <Draggable key={preview} draggableId={preview} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="relative group flex-shrink-0"
                                  >
                                    <img
                                      src={preview}
                                      alt={`Önizleme ${index + 1}`}
                                      className="w-24 h-24 object-cover rounded-lg border transition-transform group-hover:scale-105"
                                    />
                                    {/* Silme butonu */}
                                    <button
                                      type="button"
                                      onClick={() => handleEditImageRemove(index)}
                                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 shadow-md ${isDarkMode
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                      title="Fotoğrafı Sil"
                                    >
                                      <i className="ri-close-line text-xs"></i>
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}


                  {/* Tümünü Temizle */}
                  {editingProduct.images?.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span
                        className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                      >
                        Toplam {editingProduct.images.length} fotoğraf seçildi
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditInputChange('images', [])}
                        className={`text-sm underline cursor-pointer ${isDarkMode
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-red-500 hover:text-red-600'
                          }`}
                      >
                        Tümünü Temizle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Durum */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"
                    }`}
                >
                  Durum
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <span
                    onClick={() => handleEditInputChange("status", "Yayında")}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium text-center cursor-pointer ${editingProduct.status === "Yayında"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    <i className="ri-check-line mr-1"></i> Yayında
                  </span>
                  <span
                    onClick={() =>
                      handleEditInputChange("status", "Yayında Değil")
                    }
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium text-center cursor-pointer ${editingProduct.status === "Yayında Değil"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    <i className="ri-close-line mr-1"></i> Yayında Değil
                  </span>
                </div>
              </div>

              {/* Alt Butonlar */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setEditingProduct(null)}
                  className={`flex-1 py-2.5 sm:py-3 px-4 rounded-full border font-medium ${isDarkMode
                    ? "border-gray-600 text-white hover:bg-gray-700"
                    : "border-gray-300 text-black hover:bg-gray-50"
                    }`}
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className={`flex-1 py-2.5 sm:py-3 px-4 rounded-full font-medium ${isDarkMode
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-black text-white hover:bg-gray-800"
                    }`}
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* SİPARİŞLER DETAYLAR MODALI */}
      {viewingOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingOrder(null);
          }}
        >
          <div
            className={`rounded-lg w-full max-w-lg p-6 shadow-lg transition-colors ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
              }`}
          >
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-medium">Sipariş Detayları</h3>
              <button
                onClick={() => setViewingOrder(null)}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode
                  ? 'hover:bg-gray-700 text-white'
                  : 'hover:bg-gray-100 text-black'
                  }`}
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="space-y-2 text-sm sm:text-base">
              <p><strong>Sipariş No:</strong> #{viewingOrder.id.toString().padStart(4, '0')}</p>
              <p><strong>Müşteri:</strong> {viewingOrder.customerName}</p>
              <p><strong>Telefon:</strong> {viewingOrder.phone || "—"}</p>
              <p><strong>E-posta:</strong> {viewingOrder.email || "—"}</p>
              <p><strong>Adres:</strong> {viewingOrder.address}</p>
              <p><strong>Ürün:</strong> {viewingOrder.productName}</p>
              <p><strong>Detaylar:</strong> Beden: {viewingOrder.size}, Renk: {viewingOrder.color}</p>
              <p><strong>Etkinlik Tarihi:</strong> {viewingOrder.eventDate}</p>
              <p><strong>Durum:</strong> {viewingOrder.status}</p>
              <p><strong>Fiyat:</strong> {viewingOrder.price}</p>
              <p><strong>Kargo Kodu:</strong> {viewingOrder.shippingCode || '—'}</p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => alert('Fatura oluşturuldu!')}
                className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors ${isDarkMode
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
                  }`}
              >
                <i className="ri-printer-line mr-2"></i> Fatura Oluştur
              </button>

              <button
                onClick={() => setViewingOrder(null)}
                className={`flex-1 py-3 px-4 rounded-full border font-medium transition-colors ${isDarkMode
                  ? 'border-gray-600 text-white hover:bg-gray-700'
                  : 'border-gray-300 text-black hover:bg-gray-50'
                  }`}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}


      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className={`rounded-lg max-w-md w-full transition-colors overflow-y-auto max-h-[90vh] ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
          >
            {/* Üst Başlık */}
            <div
              className={`p-4 sm:p-6 border-b transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
            >
              <div className="flex justify-between items-center">
                <h3
                  className={`text-lg sm:text-xl font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Sipariş Durumu Güncelle
                </h3>
                <button
                  onClick={() => setEditingOrder(null)}
                  className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${isDarkMode
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-100 text-black'
                    }`}
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* İçerik */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Sipariş Bilgileri */}
              <div
                className={`p-3 sm:p-4 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
              >
                <h4
                  className={`font-medium mb-2 sm:mb-3 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Sipariş Bilgileri
                </h4>
                <div
                  className={`text-sm space-y-1 sm:space-y-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                >
                  <p>
                    <strong>Müşteri:</strong> {editingOrder.customerName}
                  </p>
                  <p>
                    <strong>Ürün:</strong> {editingOrder.productName}
                  </p>
                  <p>
                    <strong>Telefon:</strong> {editingOrder.phone}
                  </p>
                  <p>
                    <strong>E-posta:</strong> {editingOrder.email}
                  </p>
                  <p>
                    <strong>Sipariş No:</strong> #
                    {editingOrder.id.toString().padStart(4, '0')}
                  </p>
                  <p>
                    <strong>Detaylar:</strong> Beden: {editingOrder.size}, Renk:{' '}
                    {editingOrder.color}
                  </p>
                  <p>
                    <strong>Etkinlik Tarihi:</strong> {editingOrder.eventDate}
                  </p>
                </div>
              </div>

              {/* Durum Seçimi */}
              <div>
                <label
                  className={`block text-sm font-medium mb-3 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Sipariş Durumu
                </label>
                <div className="space-y-2">
                  {[
                    'Hazırlanıyor',
                    'Kargoya Verildi',
                    'Teslim Edildi',
                    'İptal Edildi',
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleOrderInputChange('status', status)}
                      className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer text-left ${editingOrder.status === status
                        ? 'border-black bg-black text-white'
                        : isDarkMode
                          ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-gray-700'
                          : 'border-gray-300 text-black hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{status}</span>
                        {editingOrder.status === status && (
                          <i className="ri-check-line text-lg"></i>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kargo Kodu Alanı */}
              {editingOrder.status === 'Kargoya Verildi' && (
                <div className="mt-3 sm:mt-4">
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Kargo Kodu
                  </label>
                  <input
                    type="text"
                    value={editingOrder.shippingCode || ''}
                    onChange={(e) =>
                      handleOrderInputChange('shippingCode', e.target.value)
                    }
                    placeholder="Örn: YURTICI12345"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm sm:text-base ${isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600 focus:border-gray-400'
                      : 'bg-gray-50 text-black border-gray-300 focus:border-gray-500'
                      }`}
                  />
                </div>
              )}

              {/* Alt Butonlar */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setEditingOrder(null)}
                  className={`flex-1 py-2.5 sm:py-3 px-4 rounded-full border font-medium transition-colors ${isDarkMode
                    ? 'border-gray-600 text-white hover:bg-gray-700'
                    : 'border-gray-300 text-black hover:bg-gray-50'
                    }`}
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateOrder}
                  className={`flex-1 py-2.5 sm:py-3 px-4 rounded-full font-medium transition-colors ${isDarkMode
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <img src={selectedImage} alt="Tam ekran" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-5 right-5 text-white text-2xl bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ürünü Sil
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteMessageModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center">
            <h2 className="text-lg font-semibold mb-3">Mesajı Sil</h2>
            <p className="text-gray-600 mb-5">
              Bu mesajı kalıcı olarak silmek istediğine emin misin?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleDeleteMessage}
                disabled={isDeleting}
                className={`px-4 py-2 rounded text-white ${isDeleting
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {isDeleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => setIsDeleteMessageModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-lg w-full rounded-lg p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold">Mesaj Detayı</h3>
              <button onClick={() => setSelectedMessage(null)} className="text-xl">&times;</button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p><strong>Gönderen:</strong> {selectedMessage.name}</p>
              <p><strong>Email:</strong> {selectedMessage.email}</p>
              <p><strong>Telefon:</strong> {selectedMessage.phone}</p>
              <p><strong>Hizmet Türü:</strong> {selectedMessage.serviceType}</p>
              <p><strong>Tarih:</strong> {selectedMessage.date}</p>
              <p><strong>Mesaj:</strong> {selectedMessage.message}</p>
            </div>

            <textarea
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Cevabınızı yazın..."
              className={`w-full p-3 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
            ></textarea>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!reply.trim()) {
                    alert('Lütfen bir cevap yazın!');
                    return;
                  }

                  try {
                    // Mail gönder
                    const mailResponse = await fetch('/api/send-reply', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: selectedMessage.email,
                        customerName: selectedMessage.name,
                        replyMessage: reply,
                        originalMessage: selectedMessage.message,
                        serviceType: selectedMessage.serviceType,
                      }),
                    });

                    const mailResult = await mailResponse.json();

                    if (mailResult.success) {
                      // Supabase'de durumu güncelle
                      const updateResult = await supabase
                        .from('mesajlar')
                        .update({ cevap: 'Verildi' })
                        .eq('id', selectedMessage.id)
                        .select();

                      console.log('Supabase güncelleme sonucu:', updateResult);

                      if (updateResult.error) {
                        console.error('Supabase güncelleme hatası:', updateResult.error);
                        alert('Mail gönderildi ancak durum güncellenemedi! Hata: ' + updateResult.error.message);
                      } else {
                        // State'i güncelle
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === selectedMessage.id ? { ...m, status: 'Verildi' } : m
                          )
                        );

                        toast.success("Yanıt başarıyla gönderildi! ✅");
                        setReply('');
                        setSelectedMessage(null);
                      }
                    } else {
                      throw new Error(mailResult.error || 'Mail gönderilemedi');
                    }
                  } catch (err) {
                    console.error('Hata:', err);
                    alert('Mail gönderilirken bir hata oluştu: ' + err.message);
                  }
                }}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
              >
                Yanıtla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
