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

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const adminControls = document.getElementById('admin-controls');
const addImageBtn = document.getElementById('add-image-btn');
const manageFoldersBtn = document.getElementById('manage-folders-btn');
const imageModal = document.getElementById('image-modal');
const modalTitle = document.getElementById('modal-title');
const folderModal = document.getElementById('folder-modal');
const loginModal = document.getElementById('login-modal');
const whatsappModal = document.getElementById('whatsapp-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');
const folderFilters = document.getElementById('folder-filters');

// Image Editor Elements
const imageUpload = document.getElementById('image-upload');
const editorCurrentImage = document.getElementById('editor-current-image');
const editorPrevBtn = document.getElementById('editor-prev-btn');
const editorNextBtn = document.getElementById('editor-next-btn');
const editorCounter = document.getElementById('editor-counter');
const imageSpecificDescription = document.getElementById('image-specific-description');
const deleteCurrentImageBtn = document.getElementById('delete-current-image-btn');

// Form Elements
const titleInput = document.getElementById('title-input');
const priceInput = document.getElementById('price-input');
const descriptionInput = document.getElementById('description-input');
const folderSelect = document.getElementById('folder-select');
const saveImageBtn = document.getElementById('save-image-btn');
const deleteImageBtn = document.getElementById('delete-image-btn');

// Folder Management Elements
const folderList = document.getElementById('folder-list');
const newFolderInput = document.getElementById('new-folder-input');
const addFolderBtn = document.getElementById('add-folder-btn');

// WhatsApp Elements
const whatsappYesBtn = document.getElementById('whatsapp-yes-btn');
const whatsappNoBtn = document.getElementById('whatsapp-no-btn');

// Lightbox Elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxDescription = document.getElementById('lightbox-description');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

// Background Settings Elements
const changeBgBtn = document.getElementById('change-bg-btn');
const backgroundModal = document.getElementById('background-modal');
const gradientSwatches = document.querySelectorAll('.gradient-swatch');
const bgImageUpload = document.getElementById('bg-image-upload');
const bgPreviewContainer = document.getElementById('bg-preview-container');
const bgPreviewImg = document.getElementById('bg-preview-img');
const saveBgBtn = document.getElementById('save-bg-btn');
const resetBgBtn = document.getElementById('reset-bg-btn');
const textColorRadios = document.getElementsByName('text-color');

// State
let isAdmin = false;
let editingId = null;
let currentWhatsAppItem = null;
let currentEditImages = []; // Array of {data: base64, description: string, type: 'file'|'url'}
let currentEditIndex = 0;
let folders = {};
let allImages = []; // Store all images for lightbox navigation
let currentLightboxIndex = 0;
let currentBgSettings = {
    type: 'default', // 'default', 'gradient', 'image'
    value: 'bg-gradient-default', // class name or base64 string
    textColor: 'light' // 'light' or 'dark'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFolders();
    setupImagesListener();
    setupEventListeners();
    checkAdminStatus();
    initBackgroundSettings();
});

function setupEventListeners() {
    // Admin Login
    adminLoginBtn.addEventListener('click', () => openModal(loginModal));
    loginSubmitBtn.addEventListener('click', handleLogin);
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleLogout);
    }

    // Modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Image Management
    addImageBtn.addEventListener('click', () => openImageModal());
    saveImageBtn.addEventListener('click', saveImage);
    deleteImageBtn.addEventListener('click', deleteImage);
    imageUpload.addEventListener('change', handleImageSelect);

    // Image Editor Navigation
    editorPrevBtn.addEventListener('click', () => navigateEditor(-1));
    editorNextBtn.addEventListener('click', () => navigateEditor(1));
    imageSpecificDescription.addEventListener('input', updateSpecificDescription);
    deleteCurrentImageBtn.addEventListener('click', deleteCurrentEditorImage);

    // Folder Management
    manageFoldersBtn.addEventListener('click', () => openModal(folderModal));
    addFolderBtn.addEventListener('click', addFolder);

    // WhatsApp
    whatsappYesBtn.addEventListener('click', sendWhatsApp);
    whatsappNoBtn.addEventListener('click', () => closeModal(whatsappModal));

    // Lightbox Navigation
    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });
    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (!lightboxModal.classList.contains('hidden')) {
            if (e.key === 'ArrowRight') navigateLightbox(-1); // RTL: Right is Prev
            if (e.key === 'ArrowLeft') navigateLightbox(1);   // RTL: Left is Next
            if (e.key === 'Escape') closeModal(lightboxModal);
        }
    });
}

// Background Settings Logic
function initBackgroundSettings() {
    loadBackgroundSettings();

    // Event Listeners
    if (changeBgBtn) {
        changeBgBtn.addEventListener('click', () => {
            openModal(backgroundModal);
            updateBgModalUI();
        });
    }

    gradientSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            gradientSwatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');

            const bgClass = swatch.dataset.bg;
            if (bgClass === 'default') {
                previewBackground('default', 'bg-gradient-default');
            } else {
                previewBackground('gradient', bgClass);
            }

            bgPreviewContainer.classList.add('hidden');
            bgImageUpload.value = '';
        });
    });

    if (bgImageUpload) {
        bgImageUpload.addEventListener('change', handleBgImageUpload);
    }

    if (saveBgBtn) {
        saveBgBtn.addEventListener('click', saveBackgroundSettings);
    }

    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', () => {
            if (confirm('האם אתה בטוח שברצונך לאפס את הרקע לברירת המחדל?')) {
                currentBgSettings = { type: 'default', value: 'bg-gradient-default', textColor: 'light' };
                saveBackgroundSettings();
            }
        });
    }
}

function updateBgModalUI() {
    gradientSwatches.forEach(s => s.classList.remove('selected'));
    bgPreviewContainer.classList.add('hidden');

    if (currentBgSettings.type === 'gradient' || currentBgSettings.type === 'default') {
        const activeSwatch = document.querySelector(`.gradient-swatch[data-bg="${currentBgSettings.value === 'bg-gradient-default' ? 'default' : currentBgSettings.value}"]`);
        if (activeSwatch) activeSwatch.classList.add('selected');
    } else if (currentBgSettings.type === 'image') {
        bgPreviewContainer.classList.remove('hidden');
        bgPreviewImg.src = currentBgSettings.value;
    }

    // Update Text Color Radios
    if (textColorRadios) {
        for (const radio of textColorRadios) {
            radio.checked = (radio.value === (currentBgSettings.textColor || 'light'));
        }
    }
}

function previewBackground(type, value) {
    document.body.className = '';
    document.body.style.backgroundImage = '';

    // Re-apply text color class if needed (though preview usually just shows bg)
    // We should probably keep the current text color during preview
    const isDark = document.querySelector('input[name="text-color"]:checked')?.value === 'dark';
    if (isDark) document.body.classList.add('text-dark');

    if (type === 'gradient' || type === 'default') {
        document.body.classList.add(value);
    } else if (type === 'image') {
        document.body.style.backgroundImage = `url('${value}')`;
    }
}

async function handleBgImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const compressedBase64 = await compressImage(file);

        gradientSwatches.forEach(s => s.classList.remove('selected'));
        bgPreviewContainer.classList.remove('hidden');
        bgPreviewImg.src = compressedBase64;

        previewBackground('image', compressedBase64);
    } catch (error) {
        alert('שגיאה בטעינת התמונה: ' + error.message);
    }
}

function loadBackgroundSettings() {
    const bgRef = db.ref('settings/background');
    bgRef.on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            currentBgSettings = settings;
            applyBackground(settings);
        } else {
            applyBackground({ type: 'default', value: 'bg-gradient-default', textColor: 'light' });
        }
    });
}

function applyBackground(settings) {
    document.body.className = '';
    document.body.style.backgroundImage = '';

    // Apply Text Color
    if (settings.textColor === 'dark') {
        document.body.classList.add('text-dark');
    } else {
        document.body.classList.remove('text-dark');
    }

    if (settings.type === 'gradient' || settings.type === 'default') {
        document.body.classList.add(settings.value);
    } else if (settings.type === 'image') {
        document.body.style.backgroundImage = `url('${settings.value}')`;
    }
}

async function saveBackgroundSettings() {
    saveBgBtn.textContent = 'שומר...';
    saveBgBtn.disabled = true;

    try {
        let newSettings = {
            type: 'default',
            value: 'bg-gradient-default',
            textColor: 'light'
        };

        const selectedSwatch = document.querySelector('.gradient-swatch.selected');
        if (selectedSwatch) {
            const bgClass = selectedSwatch.dataset.bg;
            if (bgClass !== 'default') {
                newSettings.type = 'gradient';
                newSettings.value = bgClass;
            }
        } else if (!bgPreviewContainer.classList.contains('hidden') && bgPreviewImg.src) {
            newSettings.type = 'image';
            newSettings.value = bgPreviewImg.src;
        }

        // Get Text Color
        const selectedTextColor = document.querySelector('input[name="text-color"]:checked')?.value || 'light';
        newSettings.textColor = selectedTextColor;

        await db.ref('settings/background').set(newSettings);
        currentBgSettings = newSettings;
        closeModal(backgroundModal);
        alert('הרקע עודכן בהצלחה!');
    } catch (error) {
        alert('שגיאה בשמירה: ' + error.message);
    } finally {
        saveBgBtn.textContent = 'שמור שינויים';
        saveBgBtn.disabled = false;
    }
}

// --- Existing Functions ---

function checkAdminStatus() {
    const sessionAdmin = sessionStorage.getItem('isAdmin');
    if (sessionAdmin === 'true') {
        enableAdminMode();
    }
}

function handleLogin() {
    const password = passwordInput.value;
    if (password === 'tom5') {
        sessionStorage.setItem('isAdmin', 'true');
        enableAdminMode();
        closeModal(loginModal);
        passwordInput.value = '';
        loginError.classList.add('hidden');
    } else {
        loginError.classList.remove('hidden');
    }
}

function handleLogout() {
    sessionStorage.removeItem('isAdmin');
    isAdmin = false;
    location.reload(); // Reload to reset state completely
}

function enableAdminMode() {
    isAdmin = true;
    adminControls.classList.remove('hidden');
    adminLoginBtn.style.display = 'none';
    renderGallery(); // Re-render to show edit buttons
}

function loadFolders() {
    foldersRef.on('value', (snapshot) => {
        folders = snapshot.val() || {};
        renderFolderFilters();
        renderFolderList(); // For admin modal
        renderFolderSelect(); // For image modal
    });
}

function renderFolderFilters() {
    folderFilters.innerHTML = '<button class="folder-filter-btn active" data-id="all">הכל</button>';

    Object.entries(folders).forEach(([id, folderData]) => {
        const btn = document.createElement('button');
        btn.className = 'folder-filter-btn';

        // Handle both string (legacy) and object structure
        const folderName = typeof folderData === 'object' ? folderData.name : folderData;

        btn.textContent = folderName;
        btn.dataset.id = id;
        btn.addEventListener('click', () => filterGallery(id));
        folderFilters.appendChild(btn);
    });

    // Add event listener for "All" button
    folderFilters.querySelector('[data-id="all"]').addEventListener('click', () => filterGallery('all'));
}

function filterGallery(folderId) {
    // Update active button
    document.querySelectorAll('.folder-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.id === folderId);
    });

    loadImages(folderId);
}

let imagesData = {}; // Store raw data from Firebase
let currentFilter = 'all'; // Store current filter

function setupImagesListener() {
    imagesRef.on('value', (snapshot) => {
        imagesData = snapshot.val() || {};
        renderGallery();
    }, (error) => {
        console.error('Firebase read error:', error);
    });
}

function renderGallery() {
    galleryGrid.innerHTML = '';
    allImages = []; // Reset for lightbox

    Object.entries(imagesData).forEach(([id, item]) => {
        if (currentFilter === 'all' || item.folderId === currentFilter) {
            // Handle legacy data structure (single src) vs new (array of images)
            let mainImageSrc = item.src;
            if (item.images && item.images.length > 0) {
                mainImageSrc = item.images[0].src;
            }

            if (!mainImageSrc) return; // Skip items without images

            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `
                <img src="${mainImageSrc}" alt="${item.title || 'יצירה'}" loading="lazy">
                <div class="item-info">
                    <div>
                        <span class="artwork-title">${item.title || ''}</span>
                        <span class="price-tag">${item.price ? '₪' + item.price : ''}</span>
                        ${item.description ? `
                            <div class="description-wrapper">
                                <button class="description-toggle">
                                    <span class="toggle-text">+ תיאור</span>
                                    <i class="fa-solid fa-chevron-down toggle-icon"></i>
                                </button>
                                <p class="artwork-description hidden">${item.description}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="whatsapp-icon-btn" aria-label="שלח הודעה"><i class="fa-brands fa-whatsapp"></i></button>
                        <button class="share-btn" aria-label="שתף"><i class="fa-solid fa-share-nodes"></i></button>
                        <button class="magnify-btn" aria-label="הגדל"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                        ${isAdmin ? `<button class="edit-btn" data-id="${id}"><i class="fa-solid fa-pen"></i></button>` : ''}
                    </div>
                </div>
            `;

            // Add to allImages for lightbox
            allImages.push({
                id: id,
                ...item,
                mainSrc: mainImageSrc
            });

            // Event Listeners
            const imgElement = galleryItem.querySelector('img');
            const magnifyBtn = galleryItem.querySelector('.magnify-btn');

            // Open lightbox on image click or magnify click
            const openLightboxHandler = () => openLightbox(id);
            imgElement.addEventListener('click', openLightboxHandler);
            magnifyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openLightbox(id);
            });

            // Description Toggle Listener
            const toggleBtn = galleryItem.querySelector('.description-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const desc = galleryItem.querySelector('.artwork-description');
                    const toggleText = toggleBtn.querySelector('.toggle-text');
                    const toggleIcon = toggleBtn.querySelector('.toggle-icon');

                    if (desc.classList.contains('open')) {
                        // Closing
                        desc.classList.remove('open');
                        if (toggleText) toggleText.textContent = '+ תיאור';
                        if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';

                        // Wait for transition to end before hiding
                        const transitionEndHandler = () => {
                            if (!desc.classList.contains('open')) {
                                desc.classList.add('hidden');
                            }
                            desc.removeEventListener('transitionend', transitionEndHandler);
                        };
                        desc.addEventListener('transitionend', transitionEndHandler);
                    } else {
                        // Opening
                        desc.classList.remove('hidden');
                        if (toggleText) toggleText.textContent = '- תיאור';
                        if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
                        // Force reflow to ensure transition plays
                        void desc.offsetWidth;
                        desc.classList.add('open');
                    }

                    toggleBtn.classList.toggle('active');
                });
            }

            galleryItem.querySelector('.whatsapp-icon-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                confirmWhatsApp(item);
            });

            galleryItem.querySelector('.share-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                handleShare(item);
            });

            if (isAdmin) {
                galleryItem.querySelector('.edit-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openImageModal(id, item);
                });
            }

            galleryGrid.appendChild(galleryItem);
        }
    });
}

function filterGallery(folderId) {
    currentFilter = folderId;

    // Update active button
    document.querySelectorAll('.folder-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.id === folderId);
    });

    renderGallery();
}



// --- Image Editor Functions ---

function openImageModal(id = null, item = null) {
    editingId = id;
    currentEditImages = [];
    currentEditIndex = 0;

    // Reset Form
    titleInput.value = '';
    priceInput.value = '';
    descriptionInput.value = '';
    folderSelect.value = '';
    imageUpload.value = '';
    deleteImageBtn.classList.add('hidden');

    if (item) {
        modalTitle.textContent = 'עריכת יצירה';
        titleInput.value = item.title || '';
        priceInput.value = item.price || '';
        descriptionInput.value = item.description || '';
        folderSelect.value = item.folderId || '';
        deleteImageBtn.classList.remove('hidden');

        // Load existing images
        if (item.images) {
            currentEditImages = item.images.map(img => ({
                data: img.src,
                description: img.description || '',
                type: 'url' // Mark as existing URL
            }));
        } else if (item.src) {
            // Legacy support
            currentEditImages = [{
                data: item.src,
                description: '',
                type: 'url'
            }];
        }
    } else {
        modalTitle.textContent = 'הוספת יצירה חדשה';
    }

    renderImageEditor();
    openModal(imageModal);
}

async function handleImageSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    for (const file of files) {
        const base64 = await readFileAsBase64(file);
        currentEditImages.push({
            data: base64, // This is the raw file data, will be compressed on save
            description: '',
            type: 'file' // Mark as new file
        });
    }

    // Move to the first new image
    currentEditIndex = currentEditImages.length - files.length;
    renderImageEditor();
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

    const currentImg = currentEditImages[currentEditIndex];

    // Display Image
    // If it's a file type (base64 raw), show it directly. If URL, show URL.
    editorCurrentImage.innerHTML = `<img src="${currentImg.data}" alt="Preview">`;

    // Update Controls
    editorCounter.textContent = `${currentEditIndex + 1} / ${currentEditImages.length}`;
    imageSpecificDescription.value = currentImg.description;
    imageSpecificDescription.disabled = false;
    deleteCurrentImageBtn.disabled = false;

    editorPrevBtn.disabled = currentEditIndex === 0;
    editorNextBtn.disabled = currentEditIndex === currentEditImages.length - 1;
}

function navigateEditor(direction) {
    currentEditIndex += direction;
    renderImageEditor();
}

function updateSpecificDescription(e) {
    if (currentEditImages[currentEditIndex]) {
        currentEditImages[currentEditIndex].description = e.target.value;
    }
}

function deleteCurrentEditorImage() {
    if (confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
        currentEditImages.splice(currentEditIndex, 1);
        if (currentEditIndex >= currentEditImages.length) {
            currentEditIndex = Math.max(0, currentEditImages.length - 1);
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
                src = await compressImage(item.data); // Compress base64 string
            }
            return {
                src: src,
                description: item.description
            };
        }));

        const imageData = {
            images: processedImages,
            src: processedImages[0].src, // Main thumbnail for legacy/grid
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
    if (confirm('האם אתה בטוח שברצונך למחוק את היצירה כולה?')) {
        db.ref(`images/${editingId}`).remove()
            .then(() => closeModal(imageModal))
            .catch(err => alert('שגיאה במחיקה: ' + err.message));
    }
}

// --- Folder Management ---

function renderFolderList() {
    folderList.innerHTML = '';
    Object.entries(folders).forEach(([id, folderData]) => {
        const div = document.createElement('div');
        div.className = 'folder-item';
        // Handle both string (legacy) and object structure
        const folderName = typeof folderData === 'object' ? folderData.name : folderData;

        div.innerHTML = `
            <span>${folderName}</span>
            <button class="danger-btn-small" onclick="deleteFolder('${id}')"><i class="fa-solid fa-trash"></i></button>
        `;
        folderList.appendChild(div);
    });
}

function renderFolderSelect() {
    folderSelect.innerHTML = '<option value="">ללא תיקייה</option>';
    Object.entries(folders).forEach(([id, folderData]) => {
        const option = document.createElement('option');
        option.value = id;
        // Handle both string (legacy) and object structure
        const folderName = typeof folderData === 'object' ? folderData.name : folderData;
        option.textContent = folderName;
        folderSelect.appendChild(option);
    });
}

function addFolder() {
    const name = newFolderInput.value.trim();
    if (name) {
        foldersRef.push(name);
        newFolderInput.value = '';
    }
}

window.deleteFolder = function (id) {
    if (confirm('האם אתה בטוח? התמונות בתיקייה זו לא יימחקו, אך יוסרו מהתיקייה.')) {
        foldersRef.child(id).remove();
    }
};

// --- WhatsApp ---

function confirmWhatsApp(item) {
    currentWhatsAppItem = item;
    openModal(whatsappModal);
}

function sendWhatsApp() {
    if (!currentWhatsAppItem) return;

    const phoneNumber = '972547896115';
    const titleText = currentWhatsAppItem.title ? currentWhatsAppItem.title : 'מהאתר';
    const text = `שלום תום אני מעוניין ביצירה ${titleText} בבקשה צור איתי קשר, תודה`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    closeModal(whatsappModal);
}

// --- Lightbox ---

function openLightbox(id) {
    // Find index in allImages
    currentLightboxIndex = allImages.findIndex(img => img.id === id);
    if (currentLightboxIndex === -1) return;

    updateLightboxContent();
    lightboxModal.classList.remove('hidden');
}

function updateLightboxContent() {
    const item = allImages[currentLightboxIndex];

    // Use high-res image if available (currently just using src)
    // If item has multiple images, we could implement sub-gallery in lightbox, 
    // but for now let's show the main image.
    // TODO: Support multiple images in lightbox if requested.
    const imgSrc = item.images ? item.images[0].src : item.src;

    lightboxImage.src = imgSrc;
    lightboxDescription.textContent = item.title || '';
    lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${allImages.length}`;
}

function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    if (currentLightboxIndex >= allImages.length) currentLightboxIndex = 0;
    if (currentLightboxIndex < 0) currentLightboxIndex = allImages.length - 1;
    updateLightboxContent();
}

// Share Functionality
const lightboxShareBtn = document.getElementById('lightbox-share');
if (lightboxShareBtn) {
    lightboxShareBtn.addEventListener('click', handleShare);
}

async function handleShare(itemToShare = null) {
    const item = itemToShare || allImages[currentLightboxIndex];
    if (!item) return;

    const shareData = {
        title: 'Tom Art Studio',
        text: `Check out this artwork: ${item.title || 'Artwork'}`,
        url: window.location.href // Ideally deep link, but current page is fallback
    };

    // Try to share the image file if possible
    if (navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        // Fallback: Copy URL or just alert
        // For now, just try to copy the image URL to clipboard
        try {
            await navigator.clipboard.writeText(item.src || item.images[0].src);
            alert('קישור לתמונה הועתק ללוח!');
        } catch (err) {
            alert('לא ניתן לשתף בדפדפן זה.');
        }
    }
}

// --- Utilities ---

function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function compressImage(base64Str, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        // If it's a file object (from upload), read it first
        if (typeof base64Str !== 'string') {
            readFileAsBase64(base64Str).then(str => {
                compressImageString(str, maxWidth, quality).then(resolve);
            });
            return;
        }
        compressImageString(base64Str, maxWidth, quality).then(resolve);
    });
}

function compressImageString(base64Str, maxWidth, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
}
