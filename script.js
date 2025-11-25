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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const imagesRef = db.ref('images');
const foldersRef = db.ref('folders');

// State
let images = [];
let folders = [];
let isAdmin = false;
let editingId = null;
let currentWhatsAppItem = null;
let currentFolder = 'all'; // 'all' or folder ID
let currentEditImages = []; // Array of objects: { type: 'file'|'url', data: File|String, description: String }
let currentEditIndex = 0;
let currentLightboxImages = []; // Array of objects: { src: String, description: String }
let currentLightboxIndex = 0;

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
const descriptionInput = document.getElementById('description-input');
const folderSelect = document.getElementById('folder-select');
const modalTitle = document.getElementById('modal-title');
const whatsappYesBtn = document.getElementById('whatsapp-yes-btn');
const whatsappNoBtn = document.getElementById('whatsapp-no-btn');
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxPrevBtn = document.getElementById('lightbox-prev');
const lightboxNextBtn = document.getElementById('lightbox-next');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxDescription = document.getElementById('lightbox-description');
const folderFilters = document.getElementById('folder-filters');
const manageFoldersBtn = document.getElementById('manage-folders-btn');
const folderList = document.getElementById('folder-list');
const newFolderInput = document.getElementById('new-folder-input');
const addFolderBtn = document.getElementById('add-folder-btn');

// Editor DOM Elements
const editorPrevBtn = document.getElementById('editor-prev-btn');
const editorNextBtn = document.getElementById('editor-next-btn');
const editorCurrentImage = document.getElementById('editor-current-image');
const editorCounter = document.getElementById('editor-counter');
const imageSpecificDescription = document.getElementById('image-specific-description');
const deleteCurrentImageBtn = document.getElementById('delete-current-image-btn');


// Initialize Data Listeners
imagesRef.on('value', (snapshot) => {
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
}, (error) => {
    console.error('Firebase: Error reading images:', error);
    alert('שגיאה בטעינת הנתונים: ' + error.message);
});

foldersRef.on('value', (snapshot) => {
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

closeModals.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from reaching elements behind modal
        const modal = e.target.closest('.modal');
        closeModal(modal);
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

whatsappYesBtn.addEventListener('click', sendWhatsApp);
whatsappNoBtn.addEventListener('click', () => closeModal(whatsappModal));

manageFoldersBtn.addEventListener('click', () => {
    openModal(folderModal);
});

addFolderBtn.addEventListener('click', addFolder);

lightboxPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    prevLightboxImage();
});

lightboxNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    nextLightboxImage();
});

// Editor Event Listeners
editorPrevBtn.addEventListener('click', () => navigateEditor(-1));
editorNextBtn.addEventListener('click', () => navigateEditor(1));
deleteCurrentImageBtn.addEventListener('click', deleteCurrentEditorImage);
imageSpecificDescription.addEventListener('input', (e) => {
    if (currentEditImages[currentEditIndex]) {
        currentEditImages[currentEditIndex].description = e.target.value;
    }
});


// Functions
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
    if (modal === imageModal) {
        currentEditImages = [];
        currentEditIndex = 0;
    }
}

function renderGallery() {
    galleryGrid.innerHTML = '';

    const filteredImages = currentFolder === 'all'
        ? images
        : images.filter(img => img.folderId === currentFolder);

    filteredImages.forEach(img => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        // Handle multiple images: use first image as thumbnail
        // Check if images is array of objects or strings (legacy)
        let imgSrc = '';
        if (img.images && img.images.length > 0) {
            const firstImg = img.images[0];
            imgSrc = typeof firstImg === 'object' ? firstImg.src : firstImg;
        } else {
            imgSrc = img.src;
        }

        item.innerHTML = `
            <img src="${imgSrc}" alt="${img.title || 'יצירה'}" loading="lazy" class="gallery-img-trigger">
            <div class="item-info">
                <div>
                    <span class="artwork-title">${img.title || ''}</span>
                    <span class="price-tag">${img.price ? '₪' + img.price : ''}</span>
                </div>
                <div style="display: flex; align-items: center;">
                    ${isAdmin ? `<button class="edit-btn" onclick="window.editImage('${img.id}')"><i class="fa-solid fa-pen"></i></button>` : ''}
                    <button class="whatsapp-icon-btn" onclick="window.confirmWhatsApp('${img.id}')">
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                    <button class="magnify-btn" onclick="window.openLightbox('${img.id}')">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                    </button>
                </div>
            </div>
        `;

        // Add click event to image for lightbox
        const imgEl = item.querySelector('.gallery-img-trigger');
        imgEl.addEventListener('click', () => window.openLightbox(img.id));

        galleryGrid.appendChild(item);
    });
}

function renderFolderFilters() {
    folderFilters.innerHTML = '';

    // 'All' button
    const allBtn = document.createElement('button');
    allBtn.className = `folder-filter-btn ${currentFolder === 'all' ? 'active' : ''}`;
    allBtn.innerHTML = `<span class="folder-count">${images.length}</span> הכל`;
    allBtn.onclick = () => filterByFolder('all');
    folderFilters.appendChild(allBtn);

    folders.forEach(folder => {
        const count = images.filter(img => img.folderId === folder.id).length;
        const btn = document.createElement('button');
        btn.className = `folder-filter-btn ${currentFolder === folder.id ? 'active' : ''}`;
        btn.innerHTML = `<span class="folder-count">${count}</span> ${folder.name}`;
        btn.onclick = () => filterByFolder(folder.id);
        folderFilters.appendChild(btn);
    });
}

function filterByFolder(folderId) {
    currentFolder = folderId;
    renderGallery();
    renderFolderFilters();
}

function populateFolderSelect(currentValue = null) {
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
    currentEditImages = [];
    currentEditIndex = 0;
    loginError.classList.add('hidden');

    if (id) {
        const img = images.find(i => i.id === id);
        modalTitle.textContent = 'עריכת תמונה';
        priceInput.value = img.price;
        titleInput.value = img.title || '';
        descriptionInput.value = img.description || '';
        folderSelect.value = img.folderId || '';

        // Load existing images into editor state
        if (img.images && img.images.length > 0) {
            img.images.forEach(item => {
                if (typeof item === 'object') {
                    currentEditImages.push({ type: 'url', data: item.src, description: item.description || '' });
                } else {
                    // Legacy: string url
                    currentEditImages.push({ type: 'url', data: item, description: '' });
                }
            });
        } else if (img.src) {
            currentEditImages.push({ type: 'url', data: img.src, description: '' });
        }

        deleteImageBtn.classList.remove('hidden');
    } else {
        modalTitle.textContent = 'הוספת תמונה';
        priceInput.value = '';
        titleInput.value = '';
        descriptionInput.value = '';
        folderSelect.value = '';
        deleteImageBtn.classList.add('hidden');
    }

    renderImageEditor();
    openModal(imageModal);
}

function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`התמונה ${file.name} גדולה מדי. אנא בחר תמונה קטנה מ-10MB.`);
                return;
            }
            currentEditImages.push({ type: 'file', data: file, description: '' });
        });

        // If this was the first image added, set index to it
        if (currentEditImages.length === files.length) {
            currentEditIndex = 0;
        } else {
            // Jump to the first newly added image
            currentEditIndex = currentEditImages.length - files.length;
        }

        renderImageEditor();
        imageUploadInput.value = ''; // Reset input
    }
}

function renderImageEditor() {
    if (currentEditImages.length === 0) {
        editorCurrentImage.innerHTML = '<div class="placeholder-text">אין תמונות. לחץ על "הוסף תמונות" כדי להתחיל.</div>';
        editorCounter.textContent = '0 / 0';
        imageSpecificDescription.value = '';
        imageSpecificDescription.disabled = true;
        deleteCurrentImageBtn.disabled = true;
        editorPrevBtn.disabled = true;
        editorNextBtn.disabled = true;
        return;
    }

    // Ensure index is valid
    if (currentEditIndex >= currentEditImages.length) currentEditIndex = currentEditImages.length - 1;
    if (currentEditIndex < 0) currentEditIndex = 0;

    const currentItem = currentEditImages[currentEditIndex];

    editorCurrentImage.innerHTML = '';
    const img = document.createElement('img');

    if (currentItem.type === 'file') {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(currentItem.data);
    } else {
        img.src = currentItem.data;
    }

    editorCurrentImage.appendChild(img);

    editorCounter.textContent = `${currentEditIndex + 1} / ${currentEditImages.length}`;
    imageSpecificDescription.value = currentItem.description || '';
    imageSpecificDescription.disabled = false;
    deleteCurrentImageBtn.disabled = false;

    editorPrevBtn.disabled = currentEditIndex === 0;
    editorNextBtn.disabled = currentEditIndex === currentEditImages.length - 1;
}

function navigateEditor(direction) {
    const newIndex = currentEditIndex + direction;
    if (newIndex >= 0 && newIndex < currentEditImages.length) {
        currentEditIndex = newIndex;
        renderImageEditor();
    }
}

function deleteCurrentEditorImage() {
    if (confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
        currentEditImages.splice(currentEditIndex, 1);

        if (currentEditImages.length === 0) {
            currentEditIndex = 0;
        } else if (currentEditIndex >= currentEditImages.length) {
            currentEditIndex = currentEditImages.length - 1;
        }
        renderImageEditor();
    }
}

async function saveImage() {
    const price = priceInput.value;
    const title = titleInput.value;
    const description = descriptionInput.value;
    const folderId = folderSelect.value || null;

    if (currentEditImages.length === 0) {
        alert('אנא בחר לפחות תמונה אחת');
        return;
    }

    saveImageBtn.textContent = 'שומר...';
    saveImageBtn.disabled = true;

    try {
        // Process images: compress files, keep URLs
        const processedImages = await Promise.all(currentEditImages.map(async (item) => {
            let src = item.data;
            if (item.type === 'file') {
                src = await compressImage(item.data);
            }
            return {
                src: src,
                description: item.description
            };
        }));

        const imageData = {
            images: processedImages,
            src: processedImages[0].src, // Main thumbnail
            price: price,
            title: title,
            description: description,
            folderId: folderId
        };

        if (editingId) {
            const imgRef = db.ref(`images/${editingId}`);
            await imgRef.set(imageData);
        } else {
            const newImgRef = imagesRef.push();
            await newImgRef.set(imageData);
        }

        closeModal(imageModal);
    } catch (err) {
        alert('שגיאה בשמירה: ' + err.message);
    } finally {
        saveImageBtn.textContent = 'שמור';
        saveImageBtn.disabled = false;
    }
}

function deleteImage() {
    if (editingId && confirm('האם אתה בטוח שברצונך למחוק את היצירה כולה?')) {
        const imgRef = db.ref(`images/${editingId}`);
        imgRef.remove().then(() => {
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
    const titleText = currentWhatsAppItem.title || 'מהאתר';
    const text = `שלום תום אני מעוניין ביצירה ${titleText} בבקשה צור איתי קשר, תודה`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    closeModal(whatsappModal);
}

// Global functions for HTML access
window.editImage = openImageModal;
window.confirmWhatsApp = confirmWhatsApp;
window.openLightbox = openLightbox;


function openLightbox(id) {
    const img = images.find(i => i.id === id);
    if (img) {
        // Handle legacy data (array of strings) vs new data (array of objects)
        if (img.images && img.images.length > 0) {
            currentLightboxImages = img.images.map(item => {
                if (typeof item === 'object') {
                    return item;
                } else {
                    return { src: item, description: '' };
                }
            });
        } else {
            currentLightboxImages = [{ src: img.src, description: '' }];
        }

        currentLightboxIndex = 0;
        updateLightboxImage();
        openModal(lightboxModal);
    }
}
window.openLightbox = openLightbox;

function updateLightboxImage() {
    const currentItem = currentLightboxImages[currentLightboxIndex];
    lightboxImage.src = currentItem.src;

    // Update description: use specific image description if available, otherwise fallback (optional)
    // Here we only show specific description as requested
    lightboxDescription.textContent = currentItem.description || '';

    // Update counter
    if (currentLightboxImages.length > 1) {
        lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
        lightboxPrevBtn.style.display = 'flex';
        lightboxNextBtn.style.display = 'flex';
    } else {
        lightboxCounter.textContent = '';
        lightboxPrevBtn.style.display = 'none';
        lightboxNextBtn.style.display = 'none';
    }
}

function nextLightboxImage() {
    if (currentLightboxImages.length > 1) {
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
        updateLightboxImage();
    }
}

function prevLightboxImage() {
    if (currentLightboxImages.length > 1) {
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
        updateLightboxImage();
    }
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Max dimensions
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.8 quality
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Folder Management
function renderFolderList() {
    folderList.innerHTML = '';
    folders.forEach(folder => {
        const count = images.filter(img => img.folderId === folder.id).length;
        const item = document.createElement('div');
        item.className = 'folder-item';
        item.innerHTML = `
            <span class="folder-item-name">${folder.name}</span>
            <span class="folder-item-count">${count} יצירות</span>
            <div class="folder-item-actions">
                <button class="folder-item-btn delete" onclick="window.deleteFolder('${folder.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        folderList.appendChild(item);
    });
}

function addFolder() {
    const name = newFolderInput.value.trim();
    if (name) {
        const newFolderRef = foldersRef.push();
        newFolderRef.set({
            name: name,
            order: folders.length
        }).then(() => {
            newFolderInput.value = '';
        }).catch(err => alert('שגיאה בהוספת תיקייה: ' + err.message));
    }
}

window.deleteFolder = function (id) {
    if (confirm('האם אתה בטוח שברצונך למחוק תיקייה זו?')) {
        // Check if folder has images
        const hasImages = images.some(img => img.folderId === id);
        if (hasImages) {
            alert('לא ניתן למחוק תיקייה המכילה יצירות. אנא העבר או מחק את היצירות קודם.');
            return;
        }

        const folderRef = db.ref(`folders/${id}`);
        folderRef.remove().catch(err => alert('שגיאה במחיקה: ' + err.message));
    }
}

// Expose renderImageEditor for testing
window.renderImageEditor = renderImageEditor;
window.saveImage = saveImage;
window.deleteCurrentEditorImage = deleteCurrentEditorImage;
window.getCurrentEditImages = () => currentEditImages;
window.setCurrentEditImages = (val) => { currentEditImages = val; };
window.getCurrentEditIndex = () => currentEditIndex;
window.setCurrentEditIndex = (val) => { currentEditIndex = val; };
