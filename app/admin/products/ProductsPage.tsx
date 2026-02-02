'use client';

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useProducts } from './useProducts';
import ProductsTable from './ProductsTable';

// Cloudflare R2 URL helper
const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://cdn.meryembalkan.com.tr";
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "urunler";
  return `${base.replace(/\/$/, "")}/${bucket.replace(/^\//, "")}/`;
};

export default function ProductsPage() {
  const {
    allProducts,
    filteredProducts,
    currentProducts,
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
    isDeletingImage,
    handleUpdateProduct,
    cancelEditProduct,
    // Delete product
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    confirmDeleteProduct,
    handleDeleteProduct,
    // Refresh
    refreshProducts,
    loading,
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
  } = useProducts();

  // Video dosyası mı kontrol et
  const isVideoFile = (fileName: string) => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  return (
    <div>
      {/* Üst Kısım */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 mt-8">
        <h2 className="text-2xl font-light tracking-wide text-white">
          ÜRÜN YÖNETİMİ
        </h2>

        {/* Üst Butonlar + Arama */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Verileri Yenile Butonu */}
          <button
            onClick={refreshProducts}
            disabled={loading}
            className="p-2.5 rounded-full font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
            title="Verileri Yenile"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
          </button>

          {/* Yeni Ürün Ekle */}
          <button
            onClick={() => setIsAddProductModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-colors whitespace-nowrap bg-white text-black hover:bg-gray-100"
          >
            <i className="ri-add-line mr-2"></i> YENİ ÜRÜN EKLE
          </button>

          {/* Toplu Yayın Değiştir */}
          <button
            onClick={() => setIsBulkStatusActionModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-colors whitespace-nowrap bg-gray-700 text-white hover:bg-gray-600"
          >
            <i className="ri-exchange-line mr-2"></i> TOPLU YAYIN DEĞİŞTİR
          </button>

          {/* Arama Butonu + Input + Sayaç */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              onClick={() => {
                if (searchOpenProducts) setSearchTermProducts('');
                setSearchOpenProducts(!searchOpenProducts);
              }}
              className="p-2 rounded-full transition-colors bg-gray-700 text-white hover:bg-gray-600"
            >
              <i className="ri-search-line"></i>
            </button>

            {searchOpenProducts && (
              <input
                type="text"
                value={searchTermProducts}
                onChange={(e) => setSearchTermProducts(e.target.value)}
                placeholder="Ürünlerde ara..."
                className="px-3 py-2 rounded transition-colors w-full sm:w-auto bg-gray-700 text-white border border-gray-600"
              />
            )}

            <div className="px-4 py-2 rounded-full text-xs sm:text-sm bg-gray-700 text-white">
              Toplam: {filteredProducts.length} Ürün
            </div>
          </div>
        </div>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {/* Toplam Ürün */}
        <div className="p-5 sm:p-6 rounded-lg border bg-gray-800 border-gray-700">
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-900 text-blue-400 mb-4 mx-auto">
            <i className="ri-shirt-line text-xl sm:text-2xl"></i>
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-center mb-2 text-white">
            Toplam Ürün
          </h3>
          <p className="text-2xl sm:text-3xl font-light text-center text-white">
            {allProducts.length}
          </p>
        </div>

        {/* Yayındaki Ürünler */}
        <div className="p-5 sm:p-6 rounded-lg border bg-gray-800 border-gray-700">
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-900 text-green-400 mb-4 mx-auto">
            <i className="ri-check-line text-xl sm:text-2xl"></i>
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-center mb-2 text-white">
            Yayındaki Ürünler
          </h3>
          <p className="text-2xl sm:text-3xl font-light text-center text-white">
            {allProducts.filter((p) => p.status === 'Yayında').length}
          </p>
        </div>
      </div>

      {/* Ürün Kartları */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h3 className="text-lg sm:text-xl font-medium text-white">
              TÜM ÜRÜNLER
            </h3>
            
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setStatusFilter('Yayında')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === 'Yayında'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <i className="ri-check-line mr-1"></i>
                Yayında
              </button>
              <button
                onClick={() => setStatusFilter('Yayında Değil')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === 'Yayında Değil'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <i className="ri-close-line mr-1"></i>
                Yayında Değil
              </button>
            </div>
          </div>
          
          <div className="text-sm text-right text-gray-400">
            {filteredProducts.length > 0 ? (
              <>
                {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} / {filteredProducts.length} ürün
              </>
            ) : (
              '0 ürün'
            )}
          </div>
        </div>

        {/* Kartlar */}
        <ProductsTable
          products={currentProducts}
          getProductStatusColor={getProductStatusColor}
          onEditProduct={handleEditProduct}
          onDeleteProduct={confirmDeleteProduct}
          loading={loading}
        />

        {/* 🔢 Sayfalama */}
        {totalProductsPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            {/* Geri Butonu */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                currentPage === 1
                  ? 'bg-gray-800 text-gray-600'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>

            {/* Sayfa Numaraları */}
            {getPaginationNumbers().map((number, index) => (
              <span key={index}>
                {number === '...' ? (
                  <span className="px-3 py-2 text-gray-400">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(number as number)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                      currentPage === number
                        ? 'bg-white text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
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
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                currentPage === totalProductsPages
                  ? 'bg-gray-800 text-gray-600'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        )}
      </div>

      {/* YENİ ÜRÜN EKLE MODALI */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto bg-gray-800">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium text-white">
                  Yeni Ürün Ekle
                </h3>
                <button
                  onClick={() => {
                    setIsAddProductModalOpen(false);
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
                  className="w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-700 text-white"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            <form id="add-product-form" onSubmit={handleProductSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2 text-white">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newProduct.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border focus:outline-none text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2 text-white">
                    Kategori *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border focus:outline-none text-sm pr-8 bg-gray-700 border-gray-600 text-white focus:border-white"
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
                  <label htmlFor="price" className="block text-sm font-medium mb-2 text-white">
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
                    className="w-full px-4 py-3 border focus:outline-none text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
                  />
                </div>

                {/* Bedenler */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
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
                      className={`px-4 py-2 text-sm rounded border cursor-pointer whitespace-nowrap transition-colors ${
                        newProduct.size.includes('36-40')
                          ? 'bg-white text-black border-white'
                          : 'border-gray-600 text-white hover:border-white'
                      }`}
                    >
                      36-40
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Renkler
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      id="color"
                      placeholder="Renk ekle (örn. Kırmızı)"
                      className="w-full px-4 py-2 border rounded text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
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
                        className="px-3 py-1 rounded-full text-sm bg-gray-600 text-white flex items-center"
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
                          className="ml-2 text-red-400 hover:text-red-300"
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
                <label htmlFor="description" className="block text-sm font-medium mb-2 text-white">
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
                  className="w-full px-4 py-3 mb-4 border focus:outline-none text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
                />

                {/* Açıklama */}
                <label htmlFor="feat" className="block text-sm font-medium mb-2 text-white">
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
                  className="w-full px-4 py-3 border focus:outline-none text-sm resize-vertical bg-gray-700 border-gray-600 text-white focus:border-white"
                ></textarea>

                <div className="text-xs mt-1 text-gray-400">
                  {typeof newProduct.features === 'string' ? newProduct.features.length : 0}/500 karakter
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Ürün Fotoğraf/Video (En fazla 5 adet)
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    id="product-images"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
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
                    className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      newProduct.imagePreviews.length >= 5
                        ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                        : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <i className="ri-image-add-line text-2xl mb-2"></i>
                    <span className="text-sm">
                      {newProduct.imagePreviews.length >= 5 ? 'Maksimum Limit Aşıldı' : 'Fotoğraf/Video Seç'}
                    </span>
                    <span className="text-xs mt-1">
                      {newProduct.imagePreviews.length}/5 medya
                    </span>
                  </button>

                  {uploadError && (
                    <div className="text-red-400 text-sm text-center p-2 bg-red-900/30 rounded-lg border border-red-800">
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
                            {newProduct.imagePreviews.map((preview, index) => {
                              const file = newProduct.images[index];
                              const fileName = file instanceof File ? file.name : (file || '');
                              const isVideo = isVideoFile(fileName);
                              
                              return (
                                <Draggable key={index} draggableId={index.toString()} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="relative group"
                                    >
                                      {isVideo ? (
                                        <div className="w-full h-20 rounded-lg border border-gray-600 bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                          <video
                                            src={preview}
                                            className="w-full h-full object-cover"
                                            muted
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <i className="ri-play-circle-line text-2xl text-white"></i>
                                          </div>
                                        </div>
                                      ) : (
                                        <img
                                          src={preview}
                                          alt={`Önizleme ${index + 1}`}
                                          className="w-full h-20 object-cover rounded-lg border border-gray-600 transition-transform group-hover:scale-105 cursor-pointer"
                                        />
                                      )}
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
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}

                  {newProduct.imagePreviews.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        Toplam {newProduct.imagePreviews.length} medya seçildi
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewProduct((prev) => ({ ...prev, imagePreviews: [], images: [] }));
                          setUploadError('');
                          const input = document.getElementById('product-images') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="text-sm underline cursor-pointer text-red-400 hover:text-red-300"
                      >
                        Tümünü Temizle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 tracking-wide font-medium transition-colors whitespace-nowrap rounded-full bg-white text-black hover:bg-gray-100"
              >
                ÜRÜNÜ EKLE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ÜRÜN DÜZENLEME MODALI */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="rounded-lg max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto bg-gray-800">
            {/* Üst Başlık */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-medium text-white">
                  Ürün Düzenle
                </h3>
                <button
                  onClick={cancelEditProduct}
                  className="w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-700 text-white"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* İçerik */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 text-sm sm:text-base">
              {/* Ürün Adı */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => handleEditInputChange("title", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Koleksiyon */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Koleksiyon
                </label>
                <select
                  value={editingProduct.category || "Kategori"}
                  onChange={(e) => handleEditInputChange("category", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
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
                <label className="block text-sm font-medium mb-2 text-white">
                  Fiyat
                </label>
                <input
                  type="text"
                  value={editingProduct.price}
                  onChange={(e) => handleEditInputChange("price", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Renkler */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Renkler
                </label>
                <input
                  type="text"
                  placeholder="Renk ekle (örn. Kırmızı) ve Enter'a bas"
                  className="w-full px-3 sm:px-4 py-2 border rounded text-sm bg-gray-700 border-gray-600 text-white"
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
                        className="px-3 py-1 rounded-full text-xs sm:text-sm bg-gray-600 text-white flex items-center"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() =>
                            handleEditInputChange(
                              "colors",
                              editingProduct.colors.filter((c: string) => c !== color)
                            )
                          }
                          className="ml-2 text-red-400 hover:text-red-300"
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
                <label className="block text-sm font-medium mb-2 text-white">
                  Açıklama Başlığı
                </label>
                <input
                  type="text"
                  value={editingProduct.description}
                  onChange={(e) => handleEditInputChange("description", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded bg-gray-700 border-gray-600 text-white"
                />
                <label className="block text-sm font-medium mt-4 mb-2 text-white">
                  Açıklama
                </label>
                <textarea
                  value={editingProduct.features || ""}
                  onChange={(e) => handleEditInputChange("features", e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border text-sm rounded resize-vertical bg-gray-700 border-gray-600 text-white"
                ></textarea>
              </div>

              {/* Ürün Fotoğrafları/Videoları */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Ürün Fotoğraf/Video (En fazla 5 adet)
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    id="edit-product-images"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleEditImageUpload(e.target.files);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => document.getElementById("edit-product-images")?.click()}
                    disabled={editingProduct.images?.length >= 5}
                    className={`w-full h-28 sm:h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors text-sm ${
                      editingProduct.images?.length >= 5
                        ? "border-gray-700 text-gray-600 cursor-not-allowed"
                        : "border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <i className="ri-image-add-line text-2xl mb-1"></i>
                    <span>
                      {editingProduct.images?.length >= 5
                        ? "Maksimum Limit Aşıldı"
                        : "Fotoğraf/Video Seç"}
                    </span>
                    <span className="text-xs mt-1">
                      {editingProduct.images?.length || 0}/5 medya
                    </span>
                  </button>

                  {/* Drag & Drop Önizlemeler */}
                  {editingProduct.images?.length > 0 && (
                    <DragDropContext
                      onDragEnd={(result) => {
                        if (!result.destination) return;

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
                            {editingProduct.imagePreviews?.map((preview: string, index: number) => {
                              const imageFile = editingProduct.images[index];
                              const fileName = imageFile instanceof File ? imageFile.name : (imageFile || '');
                              const isVideo = isVideoFile(fileName);
                              
                              return (
                                <Draggable key={preview} draggableId={preview} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="relative group flex-shrink-0"
                                    >
                                      {isVideo ? (
                                        <div className="w-24 h-24 rounded-lg border border-gray-600 bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                          <video
                                            src={preview}
                                            className="w-full h-full object-cover"
                                            muted
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <i className="ri-play-circle-line text-2xl text-white"></i>
                                          </div>
                                        </div>
                                      ) : (
                                        <img
                                          src={preview}
                                          alt={`Önizleme ${index + 1}`}
                                          className="w-24 h-24 object-cover rounded-lg border border-gray-600 transition-transform group-hover:scale-105"
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleEditImageRemove(index)}
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md opacity-0 group-hover:opacity-100 bg-red-600 text-white hover:bg-red-700"
                                        title="Medyayı Kaldır (Güncelle'ye basınca silinir)"
                                      >
                                        <i className="ri-close-line text-xs"></i>
                                      </button>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}

                  {/* Tümünü Temizle */}
                  {editingProduct.images?.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        Toplam {editingProduct.images.length} medya seçildi
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditInputChange('images', [])}
                        className="text-sm underline cursor-pointer text-red-400 hover:text-red-300"
                      >
                        Tümünü Temizle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Durum */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Durum
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <span
                    onClick={() => handleEditInputChange("status", "Yayında")}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium text-center cursor-pointer ${
                      editingProduct.status === "Yayında"
                        ? "bg-green-900 text-green-400"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    <i className="ri-check-line mr-1"></i> Yayında
                  </span>
                  <span
                    onClick={() => handleEditInputChange("status", "Yayında Değil")}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium text-center cursor-pointer ${
                      editingProduct.status === "Yayında Değil"
                        ? "bg-red-900 text-red-400"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    <i className="ri-close-line mr-1"></i> Yayında Değil
                  </span>
                </div>
              </div>

              {/* Alt Butonlar */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={cancelEditProduct}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-full border font-medium border-gray-600 text-white hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateProduct}
                  disabled={isDeletingImage}
                  className={`flex-1 py-2.5 sm:py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 ${
                    isDeletingImage 
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {isDeletingImage && <i className="ri-loader-4-line animate-spin"></i>}
                  {isDeletingImage ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">
              Ürünü Sil
            </h2>
            <p className="text-sm text-gray-300 mb-6">
              Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700"
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

      {/* TOPLU YAYIN DEĞİŞTİR - AKSİYON SEÇİM MODALI */}
      {isBulkStatusActionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">
                Toplu Yayın Değiştir
              </h2>
              <button
                onClick={closeBulkStatusModals}
                className="w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-700 text-white"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              Yapmak istediğiniz işlemi seçin:
            </p>
            
            <div className="space-y-3">
              {/* Yayına Al Butonu */}
              <button
                onClick={() => handleBulkStatusActionSelect('Yayına Al')}
                disabled={unpublishedCount === 0}
                className={`w-full py-4 px-4 rounded-lg font-medium transition-colors flex items-center justify-between ${
                  unpublishedCount === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-900 text-green-400 hover:bg-green-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  <i className="ri-upload-cloud-line text-xl"></i>
                  Yayına Al
                </span>
                <span className="text-sm bg-green-800 px-3 py-1 rounded-full">
                  {unpublishedCount} ürün
                </span>
              </button>
              
              {/* Yayından Kaldır Butonu */}
              <button
                onClick={() => handleBulkStatusActionSelect('Yayından Kaldır')}
                disabled={publishedCount === 0}
                className={`w-full py-4 px-4 rounded-lg font-medium transition-colors flex items-center justify-between ${
                  publishedCount === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-900 text-red-400 hover:bg-red-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  <i className="ri-download-cloud-line text-xl"></i>
                  Yayından Kaldır
                </span>
                <span className="text-sm bg-red-800 px-3 py-1 rounded-full">
                  {publishedCount} ürün
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPLU YAYIN DEĞİŞTİR - ÜRÜN SEÇİM MODALI */}
      {isBulkStatusProductModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg flex flex-col">
            {/* Modal Başlık */}
            <div className="p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {bulkStatusAction === 'Yayına Al' ? 'Yayına Alınacak Ürünleri Seçin' : 'Yayından Kaldırılacak Ürünleri Seçin'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedProductIds.length} / {getFilteredProductsForBulkStatus().length} ürün seçildi
                  </p>
                </div>
                <button
                  onClick={closeBulkStatusModals}
                  className="w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-700 text-white"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
              
              {/* Tümünü Seç */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => toggleSelectAll(getFilteredProductsForBulkStatus().map(p => p.id))}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                >
                  <i className={`${selectedProductIds.length === getFilteredProductsForBulkStatus().length ? 'ri-checkbox-fill' : 'ri-checkbox-blank-line'}`}></i>
                  {selectedProductIds.length === getFilteredProductsForBulkStatus().length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                </button>
              </div>
            </div>
            
            {/* Ürün Listesi */}
            <div className="flex-1 overflow-y-auto p-6">
              {getFilteredProductsForBulkStatus().length === 0 ? (
                <div className="text-center py-12">
                  <i className="ri-inbox-line text-4xl text-gray-500 mb-3"></i>
                  <p className="text-gray-400">
                    {bulkStatusAction === 'Yayına Al' 
                      ? 'Yayına alınacak ürün bulunmuyor' 
                      : 'Yayından kaldırılacak ürün bulunmuyor'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {getFilteredProductsForBulkStatus().map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    const imageUrl = product.images && product.images.length > 0 
                      ? `${getR2BaseUrl()}${product.images[0]}`
                      : '/images/placeholder.jpg';
                    
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? bulkStatusAction === 'Yayına Al' 
                              ? 'border-green-500 ring-2 ring-green-500/30' 
                              : 'border-red-500 ring-2 ring-red-500/30'
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center ${
                          isSelected 
                            ? bulkStatusAction === 'Yayına Al' ? 'bg-green-500' : 'bg-red-500'
                            : 'bg-gray-700/80'
                        }`}>
                          {isSelected && <i className="ri-check-line text-white text-sm"></i>}
                        </div>
                        
                        {/* Ürün Görseli */}
                        <div className="aspect-[3/4] bg-gray-900">
                          <img
                            src={imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        
                        {/* Ürün Bilgisi */}
                        <div className="p-3 bg-gray-900">
                          <p className="text-sm font-medium text-white truncate">{product.title}</p>
                          <p className="text-xs text-gray-400 truncate">{product.category}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Alt Butonlar */}
            <div className="p-6 border-t border-gray-700 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={closeBulkStatusModals}
                  className="flex-1 py-3 px-4 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={openBulkStatusConfirmModal}
                  disabled={selectedProductIds.length === 0}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    selectedProductIds.length === 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : bulkStatusAction === 'Yayına Al'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {bulkStatusAction === 'Yayına Al' ? 'Yayına Al' : 'Yayından Kaldır'} ({selectedProductIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPLU YAYIN DEĞİŞTİR - ONAY MODALI */}
      {isBulkStatusConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto ${
              bulkStatusAction === 'Yayına Al' 
                ? 'bg-green-900 text-green-400' 
                : 'bg-red-900 text-red-400'
            }`}>
              <i className={`text-2xl ${
                bulkStatusAction === 'Yayına Al' ? 'ri-upload-cloud-line' : 'ri-download-cloud-line'
              }`}></i>
            </div>
            
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              {bulkStatusAction === 'Yayına Al' ? 'Ürünleri Yayına Al' : 'Ürünleri Yayından Kaldır'}
            </h2>
            
            <p className="text-sm text-gray-300 mb-6 text-center">
              Seçtiğiniz <span className={`font-bold ${bulkStatusAction === 'Yayına Al' ? 'text-green-400' : 'text-red-400'}`}>{selectedProductIds.length}</span> adet ürünün durumunu 
              '<span className={`font-bold ${bulkStatusAction === 'Yayına Al' ? 'text-green-400' : 'text-red-400'}`}>
                {bulkStatusAction === 'Yayına Al' ? 'Yayında' : 'Yayında Değil'}
              </span>' olarak değiştirmek üzeresiniz.
              <br /><br />
              <span className="text-gray-400">Emin misiniz?</span>
            </p>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setIsBulkStatusConfirmModalOpen(false);
                  setIsBulkStatusProductModalOpen(true);
                }}
                disabled={isProcessingBulkStatus}
                className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                Geri Dön
              </button>
              <button
                onClick={executeBulkStatusChange}
                disabled={isProcessingBulkStatus}
                className={`px-6 py-2 rounded-lg text-white disabled:opacity-50 flex items-center gap-2 ${
                  bulkStatusAction === 'Yayına Al' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessingBulkStatus && <i className="ri-loader-4-line animate-spin"></i>}
                {isProcessingBulkStatus ? 'İşleniyor...' : 'Evet, Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
