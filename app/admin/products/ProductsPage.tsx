'use client';

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useProducts } from './useProducts';
import ProductsTable from './ProductsTable';

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
    // Bulk add product
    isBulkAddModalOpen,
    setIsBulkAddModalOpen,
    bulkProducts,
    bulkProduct,
    setBulkProduct,
    bulkUploadError,
    setBulkUploadError,
    isPublishingBulk,
    handleBulkInputChange,
    addBulkSize,
    removeBulkSize,
    addBulkColor,
    removeBulkColor,
    addBulkImage,
    removeBulkImage,
    handleBulkDragEnd,
    addProductToBoard,
    removeProductFromBoard,
    clearBoard,
    publishBulkProducts,
    closeBulkAddModal,
    // Publish all products
    isPublishAllModalOpen,
    setIsPublishAllModalOpen,
    isPublishingAll,
    unpublishedCount,
    publishAllProducts,
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

          {/* Toplu Ürün Ekle */}
          <button
            onClick={() => setIsBulkAddModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-colors whitespace-nowrap bg-gray-700 text-white hover:bg-gray-600"
          >
            <i className="ri-stack-line mr-2"></i> TOPLU ÜRÜN EKLE
          </button>

          {/* Yayına Al Butonu */}
          {unpublishedCount > 0 && (
            <button
              onClick={() => setIsPublishAllModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-colors whitespace-nowrap bg-green-600 text-white hover:bg-green-700"
            >
              <i className="ri-upload-cloud-line mr-2"></i> YAYINA AL ({unpublishedCount})
            </button>
          )}

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

      {/* TOPLU ÜRÜN EKLE MODALI */}
      {isBulkAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="rounded-lg max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto bg-gray-800">
            {/* Modal Başlık */}
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium text-white">
                  Toplu Ürün Ekle
                </h3>
                <button
                  onClick={closeBulkAddModal}
                  className="w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-700 text-white"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* BOARD (Geçici Ürün Listesi) */}
              {bulkProducts.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <i className="ri-dashboard-line"></i>
                      Board ({bulkProducts.length} ürün)
                    </h4>
                    <button
                      onClick={clearBoard}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Tümünü Temizle
                    </button>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {bulkProducts.map((product) => (
                        <div
                          key={product.id}
                          className="relative group"
                        >
                          {/* Ürün Kartı */}
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700 hover:border-gray-500 transition-all cursor-pointer">
                            <img
                              src={product.imagePreviews[0]}
                              alt={product.title}
                              className="w-full h-full object-cover object-top"
                            />
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center p-2">
                              <p className="text-xs font-medium text-white truncate mb-1">{product.title}</p>
                              <p className="text-[10px] text-gray-400 truncate">{product.category}</p>
                              <p className="text-[10px] text-gray-400">{product.price}</p>
                              {product.colors.length > 0 && (
                                <p className="text-[10px] text-gray-500 truncate mt-1">
                                  {product.colors.join(', ')}
                                </p>
                              )}
                              {product.size.length > 0 && (
                                <p className="text-[10px] text-gray-500">
                                  {product.size.join(', ')}
                                </p>
                              )}
                            </div>
                            
                            {/* Sil Butonu */}
                            <button
                              onClick={() => removeProductFromBoard(product.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 shadow-md bg-red-600 text-white hover:bg-red-700 z-10"
                              title="Board'dan kaldır"
                            >
                              <i className="ri-close-line text-xs"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Yayınla Butonu */}
                  <button
                    onClick={publishBulkProducts}
                    disabled={isPublishingBulk}
                    className={`w-full mt-4 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
                      isPublishingBulk
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isPublishingBulk ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Yayınlanıyor...
                      </>
                    ) : (
                      <>
                        <i className="ri-upload-cloud-line"></i>
                        ÜRÜNLERİ YAYINLA ({bulkProducts.length})
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Form Alanı */}
              <div className="space-y-6">
                {bulkProducts.length > 0 && (
                  <div className="border-t border-gray-700 pt-6">
                    <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <i className="ri-add-circle-line"></i>
                      Yeni Ürün Ekle
                    </h4>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="bulk-title" className="block text-sm font-medium mb-2 text-white">
                      Ürün Adı *
                    </label>
                    <input
                      type="text"
                      id="bulk-title"
                      name="title"
                      value={bulkProduct.title}
                      onChange={handleBulkInputChange}
                      required
                      className="w-full px-4 py-3 border focus:outline-none text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="bulk-category" className="block text-sm font-medium mb-2 text-white">
                      Kategori *
                    </label>
                    <select
                      id="bulk-category"
                      name="category"
                      value={bulkProduct.category}
                      onChange={handleBulkInputChange}
                      required
                      className="w-full px-4 py-3 border focus:outline-none text-sm pr-8 bg-gray-700 border-gray-600 text-white focus:border-white"
                    >
                      <option value="">Kategori Seçiniz</option>
                      <option value="Abiye">Abiye</option>
                      <option value="Gelinlik">Gelinlik</option>
                      <option value="Nisanlik">Nişanlık</option>
                      <option value="Kinalik">Kınalık</option>
                      <option value="After-Party">After Party</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="bulk-price" className="block text-sm font-medium mb-2 text-white">
                      Fiyat *
                    </label>
                    <input
                      type="text"
                      id="bulk-price"
                      name="price"
                      value={bulkProduct.price}
                      onChange={handleBulkInputChange}
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
                          bulkProduct.size.includes('36-40')
                            ? removeBulkSize('36-40')
                            : addBulkSize('36-40')
                        }
                        className={`px-4 py-2 text-sm rounded border cursor-pointer whitespace-nowrap transition-colors ${
                          bulkProduct.size.includes('36-40')
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
                        id="bulk-color"
                        placeholder="Renk ekle (örn. Kırmızı)"
                        className="w-full px-4 py-2 border rounded text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value && !bulkProduct.colors.includes(value)) {
                              addBulkColor(value);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Eklenen renkler listesi */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bulkProduct.colors.map((color, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm bg-gray-600 text-white flex items-center"
                        >
                          {color}
                          <button
                            type="button"
                            onClick={() => removeBulkColor(color)}
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
                  <label htmlFor="bulk-description" className="block text-sm font-medium mb-2 text-white">
                    Açıklama Başlığı
                  </label>

                  <input
                    type="text"
                    id="bulk-description"
                    name="description"
                    value={bulkProduct.description || ''}
                    onChange={handleBulkInputChange}
                    placeholder="Örn: Zarif siyah gece elbisesi."
                    className="w-full px-4 py-3 mb-4 border focus:outline-none text-sm bg-gray-700 border-gray-600 text-white focus:border-white"
                  />

                  {/* Açıklama */}
                  <label htmlFor="bulk-features" className="block text-sm font-medium mb-2 text-white">
                    Açıklama *
                  </label>

                  <textarea
                    id="bulk-features"
                    name="features"
                    value={bulkProduct.features}
                    onChange={handleBulkInputChange}
                    rows={4}
                    maxLength={500}
                    required
                    placeholder="Örn: Kumaş Özellikleri, Ürün Detayları vb."
                    className="w-full px-4 py-3 border focus:outline-none text-sm resize-vertical bg-gray-700 border-gray-600 text-white focus:border-white"
                  ></textarea>

                  <div className="text-xs mt-1 text-gray-400">
                    {typeof bulkProduct.features === 'string' ? bulkProduct.features.length : 0}/500 karakter
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Ürün Fotoğraf/Video (En fazla 5 adet)
                  </label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      id="bulk-product-images"
                      accept="image/*,video/mp4,video/webm,video/quicktime"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          addBulkImage(e.target.files);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => document.getElementById('bulk-product-images')?.click()}
                      disabled={bulkProduct.imagePreviews.length >= 5}
                      className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        bulkProduct.imagePreviews.length >= 5
                          ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                          : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <i className="ri-image-add-line text-2xl mb-2"></i>
                      <span className="text-sm">
                        {bulkProduct.imagePreviews.length >= 5 ? 'Maksimum Limit Aşıldı' : 'Fotoğraf/Video Seç'}
                      </span>
                      <span className="text-xs mt-1">
                        {bulkProduct.imagePreviews.length}/5 medya
                      </span>
                    </button>

                    {bulkUploadError && (
                      <div className="text-red-400 text-sm text-center p-2 bg-red-900/30 rounded-lg border border-red-800">
                        <i className="ri-error-warning-line mr-1"></i>
                        {bulkUploadError}
                      </div>
                    )}

                    {bulkProduct.imagePreviews.length > 0 && (
                      <DragDropContext onDragEnd={handleBulkDragEnd}>
                        <Droppable droppableId="bulk-images" direction="horizontal">
                          {(provided) => (
                            <div
                              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3"
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {bulkProduct.imagePreviews.map((preview, index) => {
                                const file = bulkProduct.images[index];
                                const fileName = file instanceof File ? file.name : (file || '');
                                const isVideo = isVideoFile(fileName);
                                
                                return (
                                  <Draggable key={index} draggableId={`bulk-${index}`} index={index}>
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
                                          onClick={() => removeBulkImage(index)}
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

                    {bulkProduct.imagePreviews.length > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                          Toplam {bulkProduct.imagePreviews.length} medya seçildi
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkProduct((prev) => ({ ...prev, imagePreviews: [], images: [] }));
                            setBulkUploadError('');
                            const input = document.getElementById('bulk-product-images') as HTMLInputElement;
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

                {/* Board'a Ekle Butonu */}
                <button
                  type="button"
                  onClick={addProductToBoard}
                  className="w-full py-4 tracking-wide font-medium transition-colors whitespace-nowrap rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <i className="ri-add-line mr-2"></i>
                  ÜRÜNÜ BOARD'A EKLE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPLU YAYINA ALMA ONAY MODALI */}
      {isPublishAllModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-900 text-green-400 mb-4 mx-auto">
              <i className="ri-upload-cloud-line text-2xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              Ürünleri Yayına Al
            </h2>
            <p className="text-sm text-gray-300 mb-6 text-center">
              <span className="font-bold text-green-400">{unpublishedCount}</span> adet yayında olmayan ürünü yayına almak istediğinize emin misiniz?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsPublishAllModalOpen(false)}
                disabled={isPublishingAll}
                className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                Hayır
              </button>
              <button
                onClick={publishAllProducts}
                disabled={isPublishingAll}
                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPublishingAll && <i className="ri-loader-4-line animate-spin"></i>}
                {isPublishingAll ? 'Yayınlanıyor...' : 'Evet, Yayına Al'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
