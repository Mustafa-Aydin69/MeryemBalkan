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
    handleUpdateProduct,
    // Delete product
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    confirmDeleteProduct,
    handleDeleteProduct,
  } = useProducts();

  return (
    <div>
      {/* Üst Kısım */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 mt-8">
        <h2 className="text-2xl font-light tracking-wide text-white">
          ÜRÜN YÖNETİMİ
        </h2>

        {/* Üst Butonlar + Arama */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Yeni Ürün Ekle */}
          <button
            onClick={() => setIsAddProductModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-colors whitespace-nowrap bg-white text-black hover:bg-gray-100"
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h3 className="text-lg sm:text-xl font-medium text-white">
            TÜM ÜRÜNLER
          </h3>
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
                    className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      newProduct.imagePreviews.length >= 5
                        ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                        : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
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
                                      className="w-full h-20 object-cover rounded-lg border border-gray-600 transition-transform group-hover:scale-105 cursor-pointer"
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
                      <span className="text-gray-400">
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
                  onClick={() => setEditingProduct(null)}
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

              {/* Ürün Fotoğrafları */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
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
                            {editingProduct.imagePreviews?.map((preview: string, index: number) => (
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
                                      className="w-24 h-24 object-cover rounded-lg border border-gray-600 transition-transform group-hover:scale-105"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleEditImageRemove(index)}
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 shadow-md bg-red-600 text-white hover:bg-red-700"
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
                      <span className="text-gray-400">
                        Toplam {editingProduct.images.length} fotoğraf seçildi
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
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-full border font-medium border-gray-600 text-white hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-full font-medium bg-white text-black hover:bg-gray-100"
                >
                  Güncelle
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
    </div>
  );
}
