'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";


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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      name: 'Ali Vural',
      email: 'ali@example.com',
      phone: '+90 532 111 22 33',
      serviceType: 'Abiye Elbise',
      message: 'Merhaba, ürün hakkında bilgi almak istiyorum.',
      date: '2024-03-01',
      status: 'Bekliyor',
    },
    {
      id: 2,
      name: 'Ayşe Yıldız',
      email: 'ayse@example.com',
      phone: '+90 534 444 55 66',
      serviceType: 'Gelinlik',
      message: 'Siparişim ne zaman kargoya verilir?',
      date: '2024-03-02',
      status: 'Verildi',
    },
  ]);
  const [newProduct, setNewProduct] = useState({
    title: '',
    collection: '',
    price: '',
    description: '',
    category: '',
    sizes: [] as string[],
    colors: [] as string[],
    features: [] as string[],
    imagePreviews: [] as string[],
  });
  const [uploadError, setUploadError] = useState('');
  const [orders, setOrders] = useState([
    {
      id: 1,
      customerName: 'Ayşe Demir',
      productName: 'Siyah Gece Elbisesi',
      size: '38',
      color: 'Siyah',
      eventDate: '2024-03-15',
      orderDate: '2024-02-10',
      status: 'Hazırlanıyor',
      phone: '+90 532 123 45 67',
      email: 'ayse.demir@email.com',
      address: 'Bağdat Cad. No:123 Kadıköy/İstanbul',
      price: '18.000TL',
    },
    {
      id: 2,
      customerName: 'Elif Yılmaz',
      productName: 'Pudra Nişan Elbisesi',
      size: '40',
      color: 'Pudra',
      eventDate: '2024-03-20',
      orderDate: '2024-02-12',
      status: 'Kargoya Verildi',
      phone: '+90 535 987 65 43',
      email: 'elif.yilmaz@email.com',
      address: 'Atatürk Bulvarı No:456 Çankaya/Ankara',
      price: '25.000TL',
    },
    {
      id: 3,
      customerName: 'Zeynep Kaya',
      productName: 'Modern Gelinlik',
      size: '36',
      color: 'Beyaz',
      eventDate: '2024-04-05',
      orderDate: '2024-02-14',
      status: 'Hazırlanıyor',
      phone: '+90 538 456 78 90',
      email: 'zeynep.kaya@email.com',
      address: 'Kordon Boyu No:789 Alsancak/İzmir',
      price: '50.000TL',
    },
    {
      id: 4,
      customerName: 'Merve Özkan',
      productName: 'Kırmızı Kına Elbisesi',
      size: '42',
      color: 'Kırmızı',
      eventDate: '2024-03-25',
      orderDate: '2024-02-16',
      status: 'Teslim Edildi',
      phone: '+90 542 321 65 87',
      email: 'merve.ozkan@email.com',
      address: 'Cumhuriyet Mah. No:321 Muratpaşa/Antalya',
      price: '15.000TL',
    },
  ]);

  const [allProducts, setAllProducts] = useState([
    {
      id: 1,
      title: 'Siyah Gece Elbisesi',
      collection: 'Abiye Koleksiyonu',
      category: 'abiye',
      price: '18.000TL',
      status: 'Yayında',
      createdDate: '2024-02-01',
    },
    {
      id: 2,
      title: 'Pudra Nişan Elbisesi',
      collection: 'Nişanlık Koleksiyonu',
      category: 'nisanlik',
      price: '25.000TL',
      status: 'Yayında',
      createdDate: '2024-02-03',
    },
    {
      id: 3,
      title: 'Modern Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      category: 'gelinlik',
      price: '50.000TL',
      status: 'Yayında',
      createdDate: '2024-02-05',
    },
    {
      id: 4,
      title: 'Kırmızı Kına Elbisesi',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '15.000TL',
      status: 'Yayında',
      createdDate: '2024-02-07',
    },
    {
      id: 5,
      title: 'Beyaz A-line Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      category: 'gelinlik',
      price: '65.000TL',
      status: 'Yayında',
      createdDate: '2024-02-10',
    },
    {
      id: 6,
      title: 'Lacivert Abiye Elbise',
      collection: 'Abiye Koleksiyonu',
      category: 'abiye',
      price: '22.000TL',
      status: 'Yayında',
      createdDate: '2024-02-12',
    },
    {
      id: 7,
      title: 'Pembe Nişan Elbisesi',
      collection: 'Nişanlık Koleksiyonu',
      category: 'nisanlik',
      price: '28.000TL',
      status: 'Yayında',
      createdDate: '2024-02-14',
    },
    {
      id: 8,
      title: 'Altın Rengi Abiye',
      collection: 'Abiye Koleksiyonu',
      category: 'abiye',
      price: '35.000TL',
      status: 'Yayında',
      createdDate: '2024-02-16',
    },
    {
      id: 9,
      title: 'Prenses Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      category: 'gelinlik',
      price: '75.000TL',
      status: 'Yayında Değil',
      createdDate: '2024-02-18',
    },
    {
      id: 10,
      title: 'Mavi Kına Elbisesi',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '18.000TL',
      status: 'Yayında',
      createdDate: '2024-02-20',
    },
    {
      id: 11,
      title: 'Bordo Abiye Elbise',
      collection: 'Abiye Koleksiyonu',
      category: 'abiye',
      price: '32.000TL',
      status: 'Yayında',
      createdDate: '2024-02-22',
    },
    {
      id: 12,
      title: 'Mint Yeşili Nişan Elbisesi',
      collection: 'Nişanlık Koleksiyonu',
      category: 'nisanlik',
      price: '26.000TL',
      status: 'Yayında',
      createdDate: '2024-02-24',
    },
    {
      id: 13,
      title: 'Vintage Gelinlik',
      collection: 'Gelinlik Koleksiyonu',
      category: 'gelinlik',
      price: '45.000TL',
      status: 'Yayında Değil',
      createdDate: '2024-02-26',
    },
    {
      id: 14,
      title: 'Somon Rengi Abiye',
      collection: 'Abiye Koleksiyonu',
      category: 'abiye',
      price: '29.000TL',
      status: 'Yayında',
      createdDate: '2024-02-28',
    },
    {
      id: 15,
      title: 'Yeşil Kına Elbisesi',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '17.000TL',
      status: 'Yayında',
      createdDate: '2024-03-01',
    },
    {
      id: 16,
      title: 'Bordo İşlemeli Kınalık',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '18.000TL',
      status: 'Yayında',
      createdDate: '2024-03-02',
    },
    {
      id: 17,
      title: 'Pembe Dantel Kınalık',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '16.500TL',
      status: 'Yayında',
      createdDate: '2024-03-03',
    },
    {
      id: 18,
      title: 'Yeşil Altın Detaylı Kınalık',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '17.000TL',
      status: 'Yayında',
      createdDate: '2024-03-04',
    },
    {
      id: 19,
      title: 'Mor Kadife Kınalık',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '19.500TL',
      status: 'Yayında',
      createdDate: '2024-03-05',
    },
    {
      id: 20,
      title: 'Lacivert Brokar Kınalık',
      collection: 'Kınalık Koleksiyonu',
      category: 'kinalik',
      price: '20.000TL',
      status: 'Yayında',
      createdDate: '2024-03-06',
    },
    {
      id: 21,
      title: 'Altın Payetli Mini Elbise',
      collection: 'After Party Koleksiyonu',
      category: 'after-party',
      price: '12.000TL',
      status: 'Yayında',
      createdDate: '2024-03-07',
    },
    {
      id: 22,
      title: 'Gümüş Metalik Elbise',
      collection: 'After Party Koleksiyonu',
      category: 'after-party',
      price: '14.000TL',
      status: 'Yayında',
      createdDate: '2024-03-08',
    },
    {
      id: 23,
      title: 'Siyah Taşlı Kokteyl Elbisesi',
      collection: 'After Party Koleksiyonu',
      category: 'after-party',
      price: '16.000TL',
      status: 'Yayında',
      createdDate: '2024-03-09',
    },
    {
      id: 24,
      title: 'Rose Gold Midi Elbise',
      collection: 'After Party Koleksiyonu',
      category: 'after-party',
      price: '13.500TL',
      status: 'Yayında',
      createdDate: '2024-03-10',
    },
    {
      id: 25,
      title: 'Mavi İncili After Party Elbise',
      collection: 'After Party Koleksiyonu',
      category: 'after-party',
      price: '15.500TL',
      status: 'Yayında',
      createdDate: '2024-03-11',
    },
    {
      id: 26,
      title: 'Bronz Asimetrik Elbise',
      collection: 'After Party Koleksiyonu',
      category: 'after-party',
      price: '17.500TL',
      status: 'Yayında Değil',
      createdDate: '2024-03-12',
    },
  ]);

  // Products slice (arama + sayfalama)
  const filteredProducts = allProducts.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.collection.toLowerCase().includes(searchTermProducts.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTermProducts.toLowerCase())
  );
  const totalProductsPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

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

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Yeni ürün objesi oluştur
    const newId = allProducts.length > 0 ? allProducts[allProducts.length - 1].id + 1 : 1;

    const productToAdd = {
      id: newId,
      title: newProduct.title,
      collection: newProduct.category + " Koleksiyonu",
      category: newProduct.category,
      price: newProduct.price + " TL",
      status: 'Yayında Değil', // varsayılan olarak yayında
      createdDate: new Date().toISOString().split('T')[0],
      colors: newProduct.colors,
      sizes: newProduct.sizes,
      features: newProduct.features,
      images: newProduct.imagePreviews,
    };

    // Listeye ekle
    setAllProducts((prev) => [...prev, productToAdd]);

    // Formu sıfırla
    setIsAddProductModalOpen(false);
    setNewProduct({
      title: '',
      collection: '',
      price: '',
      description: '',
      category: 'abiye',
      sizes: [],
      colors: [],
      features: [],
      imagePreviews: [],
    });
    setUploadError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const addSize = (size) => {
    if (!newProduct.sizes.includes(size)) {
      setNewProduct((prev) => ({ ...prev, sizes: [...prev.sizes, size] }));
    }
  };

  const removeSize = (size) => {
    setNewProduct((prev) => ({ ...prev, sizes: prev.sizes.filter((s) => s !== size) }));
  };

  const addColor = (color) => {
    if (color && !newProduct.colors.includes(color)) {
      setNewProduct((prev) => ({ ...prev, colors: [...prev.colors, color] }));
    }
  };

  const removeColor = (color) => {
    setNewProduct((prev) => ({ ...prev, colors: prev.colors.filter((c) => c !== color) }));
  };

  const addFeature = (feature) => {
    if (feature && !newProduct.features.includes(feature)) {
      setNewProduct((prev) => ({ ...prev, features: [...prev.features, feature] }));
    }
  };

  const removeFeature = (feature) => {
    setNewProduct((prev) => ({ ...prev, features: prev.features.filter((f) => f !== feature) }));
  };

  const addImage = (files: FileList) => {
    const fileArray = Array.from(files);
    const currentImageCount = newProduct.imagePreviews.length;

    if (currentImageCount + fileArray.length > 10) {
      setUploadError('En fazla 10 fotoğraf yükleyebilirsiniz');
      return;
    }

    setUploadError('');
    fileArray.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setNewProduct((prev) => ({
            ...prev,
            imagePreviews: [...prev.imagePreviews, event.target?.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
    setUploadError('');
  };
  // silme butonuna basıldığında modal aç
  const confirmDeleteProduct = (id: number) => {
    setDeleteProductId(id);
    setIsDeleteModalOpen(true);
  };

  // gerçekten sil
  const handleDeleteProduct = () => {
    if (deleteProductId !== null) {
      setAllProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
      setIsDeleteModalOpen(false);
      setDeleteProductId(null);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = Array.from(newProduct.imagePreviews);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setNewProduct((prev) => ({ ...prev, imagePreviews: reordered }));
  };

  const getStatusColor = (status) => {
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
    setEditingProduct({
      ...product,
      originalStatus: product.status,
    });
  };

  const handleUpdateProduct = () => {
    setAllProducts((prev) =>
      prev.map((product) => (product.id === editingProduct.id ? editingProduct : product)),
    );
    setEditingProduct(null);
  };

  const handleEditInputChange = (field, value) => {
    setEditingProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditOrder = (order) => {
    setEditingOrder({
      ...order,
      originalStatus: order.status,
    });
  };

  const handleUpdateOrder = () => {
    setOrders((prev) =>
      prev.map((order) => (order.id === editingOrder.id ? editingOrder : order)),
    );
    setEditingOrder(null);
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
        <div className="flex flex-col items-center px-8 py-6">
          <div className="flex justify-between items-center w-full mb-4">
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'
                }`}
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-lg`}></i>
            </button>

            <div className="text-center">
              <h1
                className={`text-xl font-light tracking-[0.3em] font-serif transition-colors italic ${isDarkMode ? 'text-white' : 'text-black'
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

            <Link
              href="/"
              className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'
                }`}
            >
              <i className="ri-home-line text-lg"></i>
            </Link>
          </div>

          <div className="flex space-x-8 text-sm font-medium tracking-wide">
            <button
              onClick={() => setActiveTab('orders')}
              className={`cursor-pointer transition-colors font-light pb-2 ${activeTab === 'orders'
                ? `border-b-2 ${isDarkMode ? 'border-white text-white' : 'border-black text-black'
                }`
                : `${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                }`}
            >
              SİPARİŞLER
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`cursor-pointer transition-colors font-light pb-2 ${activeTab === 'products'
                ? `border-b-2 ${isDarkMode ? 'border-white text-white' : 'border-black text-black'
                }`
                : `${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                }`}
            >
              ÜRÜN YÖNETİMİ
            </button>
            {/* MESAJLAR */}
            <button
              onClick={() => setActiveTab('messages')}
              className={`cursor-pointer transition-colors font-light pb-2 ${activeTab === 'messages'
                ? `border-b-2 ${isDarkMode ? 'border-white text-white' : 'border-black text-black'
                }`
                : `${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
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
              <div className="flex justify-between items-start mb-8 mt-8">
                <h2
                  className={`text-2xl font-light tracking-wide ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  SİPARİŞ YÖNETİMİ
                </h2>

                <div className="flex items-center space-x-2 mt-2">
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


              <div className="overflow-x-auto">
                <table
                  className={`w-full border-collapse ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                >
                  <thead>
                    <tr
                      className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        SİPARİŞ NO
                      </th>
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        MÜŞTERİ
                      </th>
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        ADRES
                      </th>
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm hidden md:table-cell ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        ÜRÜN
                      </th>
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm hidden xl:table-cell ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        DETAYLAR
                      </th>
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm hidden xl:table-cell ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        ETKİNLİK TARİHİ
                      </th>
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        DURUM
                      </th>
                      <th
                        className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        FİYAT
                      </th>
                      <th
                        className={`text-center p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                          }`}
                      >
                        İŞLEM
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`border-b transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          #{order.id.toString().padStart(4, '0')}
                        </td>
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
                            <p
                              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                } hidden sm:block`}
                            >
                              {order.email}
                            </p>
                          </div>
                        </td>
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          <p className="text-xs">{order.address}</p>
                        </td>
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          <p className="font-medium">{order.productName}</p>
                          <p
                            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}
                          >
                            Sipariş: {order.orderDate}
                          </p>
                        </td>
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm hidden xl:table-cell ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          <p className="text-xs">Beden: {order.size}</p>
                          <p className="text-xs">Renk: {order.color}</p>
                        </td>
                        <td
                          className={`p-3 sm:p-4 text-xs sm:text-sm hidden xl:table-cell ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          {order.eventDate}
                        </td>
                        <td className="p-3 sm:p-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td
                          className={`p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          {order.price}
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex justify-center">
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalOrdersPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <button
                    onClick={() => handleOrdersPageChange(ordersCurrentPage - 1)}
                    disabled={ordersCurrentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${ordersCurrentPage === 1
                      ? isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                      : isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>

                  {getOrdersPaginationNumbers().map((number, index) => (
                    <span key={index}>
                      {number === '...' ? (
                        <span className={`px-3 py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>...</span>
                      ) : (
                        <button
                          onClick={() => handleOrdersPageChange(number as number)}
                          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${ordersCurrentPage === number
                            ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                            : isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600'
                              : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                          {number}
                        </button>
                      )}
                    </span>
                  ))}

                  <button
                    onClick={() => handleOrdersPageChange(ordersCurrentPage + 1)}
                    disabled={ordersCurrentPage === totalOrdersPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${ordersCurrentPage === totalOrdersPages
                      ? isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                      : isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600'
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
              <div className="flex justify-between items-center mb-8 mt-8">
                <h2
                  className={`text-2xl font-light tracking-wide ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  ÜRÜN YÖNETİMİ
                </h2>
                <button
                  onClick={() => setIsAddProductModalOpen(true)}
                  className={`px-6 py-3 rounded-full font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                  <i className="ri-add-line mr-2"></i>
                  YENİ ÜRÜN EKLE
                </button>
                <div className="flex items-center space-x-2">
                  {/* Arama Butonu */}
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

                  {/* Arama Input */}
                  {searchOpenProducts && (
                    <input
                      type="text"
                      value={searchTermProducts}
                      onChange={(e) => setSearchTermProducts(e.target.value)}
                      placeholder="Ürünlerde ara..."
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
                    Toplam: {filteredProducts.length} Ürün
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-12`}>
                <div
                  className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 mx-auto">
                    <i className="ri-shirt-line text-2xl"></i>
                  </div>
                  <h3
                    className={`text-xl font-medium text-center mb-2 ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Toplam Ürün
                  </h3>
                  <p
                    className={`text-3xl font-light text-center ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    {allProducts.length}
                  </p>
                </div>

                <div
                  className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4 mx-auto">
                    <i className="ri-check-line text-2xl"></i>
                  </div>
                  <h3
                    className={`text-xl font-medium text-center mb-2 ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Yayındaki Ürünler
                  </h3>
                  <p
                    className={`text-3xl font-light text-center ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    {allProducts.filter((p) => p.status === 'Yayında').length}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3
                    className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    TÜM ÜRÜNLER
                  </h3>
                  <div
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                  >
                    {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, allProducts.length)} /
                    {allProducts.length} ürün
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table
                    className={`w-full border-collapse ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                  >
                    <thead>
                      <tr
                        className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <th
                          className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          ÜRÜN ADI
                        </th>
                        <th
                          className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm hidden md:table-cell ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          KOLEKSİYON
                        </th>
                        <th
                          className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          FİYAT
                        </th>
                        <th
                          className={`text-left p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          DURUM
                        </th>
                        <th
                          className={`text-center p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                            }`}
                        >
                          İŞLEMLER
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map((product) => (
                        <tr
                          key={product.id}
                          className={`border-b transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <td
                            className={`p-3 sm:p-4 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                              }`}
                          >
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p
                                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}
                              >
                                ID: #{product.id}
                              </p>
                              <p
                                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  } md:hidden`}
                              >
                                {product.collection}
                              </p>
                            </div>
                          </td>
                          <td
                            className={`p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}
                          >
                            {product.collection}
                          </td>
                          <td
                            className={`p-3 sm:p-4 font-medium text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-black'
                              }`}
                          >
                            {product.price + " TL"}
                          </td>
                          <td className="p-3 sm:p-4">
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getProductStatusColor(
                                product.status,
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

                {totalProductsPages > 1 && (
                  <div className="flex justify-center items-center mt-8 space-x-2">
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

              <div className="overflow-x-auto">
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
                      <th className="text-left p-3 hidden md:table-cell">EMAIL</th>
                      <th className="text-left p-3 hidden md:table-cell">TELEFON</th>
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
                        <td className="p-3 hidden md:table-cell">{msg.email}</td>
                        <td className="p-3 hidden md:table-cell">{msg.phone}</td>
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
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="px-3 py-1 text-xs rounded bg-indigo-500 text-white hover:bg-indigo-600"
                          >
                            Görüntüle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalMessagesPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <button
                    onClick={() =>
                      handleMessagesPageChange(messagesCurrentPage - 1)
                    }
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
                    onClick={() =>
                      handleMessagesPageChange(messagesCurrentPage + 1)
                    }
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
            className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'
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
                  onClick={() => setIsAddProductModalOpen(false)}
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
                    <option value="After Party">After Party</option>
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

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                      }`}
                  >
                    Bedenler
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        newProduct.sizes.includes('36-40') ? removeSize('36-40') : addSize('36-40')
                      }
                      className={`px-4 py-2 text-sm rounded border cursor-pointer whitespace-nowrap transition-colors ${newProduct.sizes.includes('36-40')
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
                <label
                  htmlFor="description"
                  className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Açıklama *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  required
                  className={`w-full px-4 py-3 border focus:outline-none text-sm resize-vertical transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white' : 'bg-white border-gray-300 text-black focus:border-black'
                    }`}
                ></textarea>
                <div
                  className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                >
                  {newProduct.description.length}/500 karakter
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
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
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
                          setNewProduct((prev) => ({ ...prev, imagePreviews: [] }));
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
                ÜRÜN EKLE
              </button>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'
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
                  Ürün Düzenle
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${isDarkMode
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-100 text-black'
                    }`}
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Ürün Adı */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => handleEditInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>

              {/* Koleksiyon */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Koleksiyon
                </label>
                <input
                  type="text"
                  value={editingProduct.collection}
                  onChange={(e) => handleEditInputChange('collection', e.target.value)}
                  className={`w-full px-4 py-3 border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>

              {/* Fiyat */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Fiyat
                </label>
                <input
                  type="text"
                  value={editingProduct.price}
                  onChange={(e) => handleEditInputChange('price', e.target.value)}
                  className={`w-full px-4 py-3 border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Açıklama
                </label>
                <textarea
                  value={editingProduct.description || ""}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-3 border text-sm resize-vertical ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                ></textarea>
              </div>

              {/* Ürün Fotoğrafları */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  Ürün Fotoğrafları (En fazla 5 adet)
                </label>
                <div className="space-y-4">
                  {/* Gizli input */}
                  <input
                    type="file"
                    id="edit-product-images"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleEditInputChange('images', [
                          ...(editingProduct.images || []),
                          ...Array.from(e.target.files).map((file) =>
                            URL.createObjectURL(file)
                          ),
                        ]);
                      }
                    }}
                  />

                  {/* Fotoğraf Seç butonu */}
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById('edit-product-images')?.click()
                    }
                    disabled={editingProduct.images?.length >= 5}
                    className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${editingProduct.images?.length >= 5
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
                      {editingProduct.images?.length >= 5
                        ? 'Maksimum Limit Aşıldı'
                        : 'Fotoğraf Seç'}
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
                        const reordered = Array.from(editingProduct.images);
                        const [moved] = reordered.splice(result.source.index, 1);
                        reordered.splice(result.destination.index, 0, moved);
                        handleEditInputChange('images', reordered);
                      }}
                    >
                      <Droppable droppableId="images" direction="horizontal">
                        {(provided) => (
                          <div
                            className="flex gap-3 overflow-x-auto"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {editingProduct.images.map((preview, index) => (
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
                                      onClick={() =>
                                        handleEditInputChange(
                                          'images',
                                          editingProduct.images.filter((_, i) => i !== index)
                                        )
                                      }
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
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Durum
                </label>
                <div className="flex gap-3">
                  <span
                    onClick={() => handleEditInputChange('status', 'Yayında')}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium text-center cursor-pointer ${editingProduct.status === 'Yayında'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    <i className="ri-check-line mr-1"></i> Yayında
                  </span>
                  <span
                    onClick={() => handleEditInputChange('status', 'Yayında Değil')}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium text-center cursor-pointer ${editingProduct.status === 'Yayında Değil'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    <i className="ri-close-line mr-1"></i> Yayında Değil
                  </span>
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingProduct(null)}
                  className={`flex-1 py-3 px-4 rounded-full border font-medium ${isDarkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-black'
                    }`}
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className={`flex-1 py-3 px-4 rounded-full font-medium ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                    }`}
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-lg max-w-md w-full transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'
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
                  Sipariş Durumu Güncelle
                </h3>
                <button
                  onClick={() => setEditingOrder(null)}
                  className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'
                    }`}
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Sipariş Bilgileri
                </h4>
                <div className={`text-sm space-y-1 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>
                    <strong>Müşteri:</strong> {editingOrder.customerName}
                  </p>
                  <p>
                    <strong>Ürün:</strong> {editingOrder.productName}
                  </p>
                  <p>
                    <strong>Sipariş No:</strong> #{editingOrder.id.toString().padStart(4, '0')}
                  </p>
                </div>
              </div>

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
                      className={`w-full py-3 px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap text-left ${editingOrder.status === status
                        ? 'border-black bg-black text-white'
                        : isDarkMode
                          ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-gray-700'
                          : 'border-gray-300 text-black hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{status}</span>
                        {editingOrder.status === status && <i className="ri-check-line text-lg"></i>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingOrder(null)}
                  className={`flex-1 py-3 px-4 rounded-full border font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-gray-300 text-black hover:bg-gray-50'
                    }`}
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateOrder}
                  className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
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
                onClick={() => {
                  // ilgili mesajı güncelle
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === selectedMessage?.id ? { ...m, status: 'Verildi' } : m
                    )
                  );

                  console.log("Yanıt gönderildi:", reply);
                  setReply('');
                  setSelectedMessage(null); // modalı kapat
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
