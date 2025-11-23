// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, remove, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAkmStZnzpUWRDnPco-chYK5gN9udF5bMk",
    authDomain: "tomsartstudio.firebaseapp.com",
    databaseURL: "https://tomsartstudio-default-rtdb.firebaseio.com",
    projectId: "tomsartstudio",
    storageBucket: "tomsartstudio.firebasestorage.app",
    messagingSenderId: "672780934608",
    appId: "1:672780934608:web:9e058408b4baabd689edd5",
    measurementId: "G-GJREYTGW8T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const imagesRef = ref(db, 'images');
const foldersRef = ref(db, 'folders');

// State
let images = [];
let folders = [];
let isAdmin = false;
let editingId = null;
let currentWhatsAppItem = null;
let currentFolder = 'all'; // 'all' or folder ID

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminControls = document.getElementById('admin-controls');
const loginModal = document.getElementById('login-modal');
const imageModal = document.getElementById('image-modal');
const whatsappModal = document.getElementById('whatsapp-modal');
const folderModal = document.getElementById('folder-modal');
const closeModals = document.querySelectorAll('.close-modal');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');
const addImageBtn = document.getElementById('add-image-btn');
const saveImageBtn = document.getElementById('save-image-btn');
const deleteImageBtn = document.getElementById('delete-image-btn');
const imageUploadInput = document.getElementById('image-upload');
const priceInput = document.getElementById('price-input');
const titleInput = document.getElementById('title-input');
const folderSelect = document.getElementById('folder-select');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const modalTitle = document.getElementById('modal-title');
const whatsappYesBtn = document.getElementById('whatsapp-yes-btn');
const whatsappNoBtn = document.getElementById('whatsapp-no-btn');
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const folderFilters = document.getElementById('folder-filters');
const manageFoldersBtn = document.getElementById('manage-folders-btn');
const folderList = document.getElementById('folder-list');
const newFolderInput = document.getElementById('new-folder-input');
const addFolderBtn = document.getElementById('add-folder-btn');

// Initialize Data Listeners
onValue(imagesRef, (snapshot) => {
    const data = snapshot.val();
    images = [];
    if (data) {
        Object.keys(data).forEach(key => {
            images.push({
                id: key,
                ...data[key]
            });
        });
        images.reverse();
    }
    renderGallery();
    renderFolderFilters();
});

onValue(foldersRef, (snapshot) => {
    const data = snapshot.val();
    folders = [];
    if (data) {
        Object.keys(data).forEach(key => {
            folders.push({
                id: key,
                ...data[key]
            });
        });
        // Sort by order
        folders.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    renderFolderFilters();
    populateFolderSelect();
    renderFolderList();
});

// Event Listeners
adminLoginBtn.addEventListener('click', () => {
    if (isAdmin) {
        isAdmin = false;
        adminControls.classList.add('hidden');
        adminLoginBtn.innerHTML = '<i class="fa-solid fa-user-lock"></i>';
        renderGallery();
    } else {
        openModal(loginModal);
    }
});

loginSubmitBtn.addEventListener('click', checkPassword);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
});

addImageBtn.addEventListener('click', () => {
    openImageModal();
});

saveImageBtn.addEventListener('click', saveImage);
deleteImageBtn.addEventListener('click', deleteImage);

imageUploadInput.addEventListener('change', handleImageSelect);

whatsappYesBtn.addEventListener('click', sendWhatsApp);
whatsappNoBtn.addEventListener('click', () => closeModal(whatsappModal));

manageFoldersBtn.addEventListener('click', () => openModal(folderModal));

addFolderBtn.addEventListener('click', createFolder);
newFolderInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createFolder();
});

closeModals.forEach(btn => {
    btn.addEventListener('click', (e) => {
        closeModal(e.target.closest('.modal'));
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

// Functions
function renderFolderFilters() {
    if (!folderFilters) return;

    folderFilters.innerHTML = '';

    // All button
    const allCount = images.length;
    const allBtn = document.createElement('button');
    allBtn.className = 'folder-filter-btn' + (currentFolder === 'all' ? ' active' : '');
    allBtn.innerHTML = `<span class="folder-count">(${allCount})</span> הכל`;
    allBtn.addEventListener('click', () => filterByFolder('all'));
    folderFilters.appendChild(allBtn);

    // Folder buttons
    folders.forEach(folder => {
        const count = images.filter(img => img.folderId === folder.id).length;
        const btn = document.createElement('button');
        btn.className = 'folder-filter-btn' + (currentFolder === folder.id ? ' active' : '');
        btn.innerHTML = `<span class="folder-count">(${count})</span> ${folder.name}`;
        btn.addEventListener('click', () => filterByFolder(folder.id));
        folderFilters.appendChild(btn);
    });

    // No folder button (only if there are uncategorized images)
    const uncategorizedCount = images.filter(img => !img.folderId).length;
    if (uncategorizedCount > 0) {
        const noFolderBtn = document.createElement('button');
        noFolderBtn.className = 'folder-filter-btn' + (currentFolder === 'none' ? ' active' : '');
        noFolderBtn.innerHTML = `<span class="folder-count">(${uncategorizedCount})</span> ללא קטגוריה`;
        noFolderBtn.addEventListener('click', () => filterByFolder('none'));
        folderFilters.appendChild(noFolderBtn);
    }
}

function filterByFolder(folderId) {
    currentFolder = folderId;
    renderGallery();
    renderFolderFilters();
}

function getFilteredImages() {
    if (currentFolder === 'all') {
        return images;
    } else if (currentFolder === 'none') {
        return images.filter(img => !img.folderId);
    } else {
        return images.filter(img => img.folderId === currentFolder);
    }
}

function renderGallery() {
    galleryGrid.innerHTML = '';

    const filteredImages = getFilteredImages();

    if (filteredImages.length === 0) {
        galleryGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-secondary); margin-top: 50px;">אין תמונות בקטגוריה זו.</p>';
        return;
    }

    filteredImages.forEach(img => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const editButtonHTML = isAdmin
            ? `<button class="edit-btn" data-id="${img.id}"><i class="fa-solid fa-pen"></i></button>`
            : '';

        const titleDisplay = img.title ? `<span class="artwork-title">יצירה מס' ${img.title}</span>` : '';

        item.innerHTML = `
            <img src="${img.src}" alt="Gallery Image" loading="lazy" class="gallery-img-trigger" data-src="${img.src}">
            <div class="item-info">
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 3px;">
                    ${titleDisplay}
                    <span class="price-tag">${formatPrice(img.price)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <button class="magnify-btn" data-src="${img.src}">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                    ${editButtonHTML}
                    <button class="whatsapp-icon-btn" data-id="${img.id}">
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(item);
    });

    // Re-attach event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openImageModal(btn.dataset.id));
    });
    document.querySelectorAll('.whatsapp-icon-btn').forEach(btn => {
        btn.addEventListener('click', () => confirmWhatsApp(btn.dataset.id));
    });
    document.querySelectorAll('.magnify-btn').forEach(btn => {
        btn.addEventListener('click', () => openLightbox(btn.dataset.src));
    });
    document.querySelectorAll('.gallery-img-trigger').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.dataset.src));
    });
}

function formatPrice(price) {
    return price ? `₪${Number(price).toLocaleString()}` : '';
}

function checkPassword() {
    const password = passwordInput.value;
    if (password === 'loofisheli1') {
        isAdmin = true;
        adminControls.classList.remove('hidden');
        adminLoginBtn.innerHTML = '<i class="fa-solid fa-unlock"></i>';
        closeModal(loginModal);
        passwordInput.value = '';
        loginError.classList.add('hidden');
        renderGallery();
    } else {
        loginError.classList.remove('hidden');
    }
}

function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
    if (modal.id === 'lightbox-modal') {
        lightboxImage.src = '';
    }
}

function openLightbox(src) {
    lightboxImage.src = src;
    openModal(lightboxModal);
}

function populateFolderSelect() {
    if (!folderSelect) return;

    // Keep current selection
    const currentValue = folderSelect.value;

    folderSelect.innerHTML = '<option value="">ללא תיקייה</option>';
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        folderSelect.appendChild(option);
    });

    // Restore selection if it still exists
    if (currentValue) {
        folderSelect.value = currentValue;
    }
}

function openImageModal(id = null) {
    editingId = id;
    imageUploadInput.value = '';
    loginError.classList.add('hidden');

    if (id) {
        const img = images.find(i => i.id === id);
        modalTitle.textContent = 'עריכת תמונה';
        priceInput.value = img.price;
        titleInput.value = img.title || '';
        folderSelect.value = img.folderId || '';
        imagePreview.src = img.src;
        imagePreviewContainer.classList.remove('hidden');
        deleteImageBtn.classList.remove('hidden');
    } else {
        modalTitle.textContent = 'הוספת תמונה';
        priceInput.value = '';
        titleInput.value = '';
        folderSelect.value = '';
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
        deleteImageBtn.classList.add('hidden');
    }

    openModal(imageModal);
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('התמונה גדולה מדי. אנא בחר תמונה קטנה מ-10MB.');
            imageUploadInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
}

function saveImage() {
    const price = priceInput.value;
    const title = titleInput.value;
    const folderId = folderSelect.value || null;

    if (editingId) {
        const imgRef = ref(db, `images/${editingId}`);

        if (imageUploadInput.files[0]) {
            compressImage(imageUploadInput.files[0])
                .then(compressedDataUrl => {
                    set(imgRef, {
                        src: compressedDataUrl,
                        price: price,
                        title: title,
                        folderId: folderId
                    }).then(() => {
                        closeModal(imageModal);
                    }).catch(err => alert('שגיאה בשמירה: ' + err.message));
                })
                .catch(err => alert('שגיאה בכיווץ תמונה: ' + err.message));
        } else {
            const currentImg = images.find(i => i.id === editingId);
            set(imgRef, {
                src: currentImg.src,
                price: price,
                title: title,
                folderId: folderId
            }).then(() => {
                closeModal(imageModal);
            }).catch(err => alert('שגיאה בשמירה: ' + err.message));
        }
    } else {
        if (!imageUploadInput.files[0]) {
            alert('אנא בחר תמונה');
            return;
        }

        compressImage(imageUploadInput.files[0])
            .then(compressedDataUrl => {
                const newImgRef = push(imagesRef);
                set(newImgRef, {
                    src: compressedDataUrl,
                    price: price,
                    title: title,
                    folderId: folderId
                }).then(() => {
                    closeModal(imageModal);
                }).catch(err => alert('שגיאה בשמירה: ' + err.message));
            })
            .catch(err => alert('שגיאה בכיווץ תמונה: ' + err.message));
    }
}

function deleteImage() {
    if (editingId && confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
        const imgRef = ref(db, `images/${editingId}`);
        remove(imgRef).then(() => {
            closeModal(imageModal);
        }).catch(err => alert('שגיאה במחיקה: ' + err.message));
    }
}

function confirmWhatsApp(id) {
    currentWhatsAppItem = images.find(i => i.id === id);
    if (currentWhatsAppItem) {
        openModal(whatsappModal);
    }
}

function sendWhatsApp() {
    if (!currentWhatsAppItem) return;

    const phoneNumber = '972547896115';
    const titleText = currentWhatsAppItem.title ? `מספר ${currentWhatsAppItem.title}` : 'מהאתר';
    const text = `שלום תום אני מעוניין ביצירה ${titleText} בבקשה צור איתי קשר, תודה`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    closeModal(whatsappModal);
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const maxWidth = 1600;
        const maxHeight = 1600;
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function () {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };

            img.onerror = function (err) {
                reject(err);
            };
        };

        reader.onerror = function (err) {
            reject(err);
        };
    });
}

// Folder Management Functions
function createFolder() {
    const name = newFolderInput.value.trim();
    if (!name) {
        alert('אנא הכנס שם לתיקייה');
        return;
    }

    const newFolderRef = push(foldersRef);
    set(newFolderRef, {
        name: name,
        order: folders.length
    }).then(() => {
        newFolderInput.value = '';
    }).catch(err => alert('שגיאה ביצירת תיקייה: ' + err.message));
}

function renderFolderList() {
    if (!folderList) return;

    folderList.innerHTML = '';

    if (folders.length === 0) {
        folderList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">אין תיקיות עדיין</p>';
        return;
    }

    folders.forEach(folder => {
        const count = images.filter(img => img.folderId === folder.id).length;

        const item = document.createElement('div');
        item.className = 'folder-item';
        item.innerHTML = `
            <span class="folder-item-name">${folder.name}</span>
            <span class="folder-item-count">(${count})</span>
            <div class="folder-item-actions">
                <button class="folder-item-btn edit" data-id="${folder.id}" title="עריכה">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="folder-item-btn delete" data-id="${folder.id}" title="מחיקה">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        folderList.appendChild(item);
    });

    // Attach event listeners
    document.querySelectorAll('.folder-item-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => editFolder(btn.dataset.id));
    });
    document.querySelectorAll('.folder-item-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteFolder(btn.dataset.id));
    });
}

function editFolder(id) {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;

    const newName = prompt('הכנס שם חדש לתיקייה:', folder.name);
    if (newName && newName.trim() !== folder.name) {
        const folderRef = ref(db, `folders/${id}`);
        update(folderRef, {
            name: newName.trim()
        }).catch(err => alert('שגיאה בעדכון תיקייה: ' + err.message));
    }
}

function deleteFolder(id) {
    const count = images.filter(img => img.folderId === id).length;

    if (count > 0) {
        alert(`לא ניתן למחוק תיקייה שמכילה ${count} תמונות. אנא העבר את התמונות לתיקייה אחרת תחילה.`);
        return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק תיקייה זו?')) {
        const folderRef = ref(db, `folders/${id}`);
        remove(folderRef).catch(err => alert('שגיאה במחיקת תיקייה: ' + err.message));
    }
}
