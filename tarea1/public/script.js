const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const uploadZone = document.getElementById('uploadZone');
const slotsContainer = document.getElementById('slotsContainer');
const publishButton = document.getElementById('publishButton');
const postsGrid = document.getElementById('postsGrid');
const postTemplate = document.getElementById('postTemplate');
const inputModel = document.getElementById('inputModel');
const inputType = document.getElementById('inputType');
const inputLocation = document.getElementById('inputLocation');
const inputDescription = document.getElementById('inputDescription');
const inputTags = document.getElementById('inputTags');

const MAX_PHOTOS = 3;
let selectedFiles = [null, null, null];
let activeSlotIndex = 0;

// API functions
async function fetchPosts() {
  try {
    const response = await fetch('/api/posts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

async function createPost(model, type, location, description, tags, files) {
  try {
    const formData = new FormData();
    formData.append('model', model);
    formData.append('type', type);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('tags', tags.join(', '));

    // Append files
    for (let i = 0; i < files.length; i++) {
      if (files[i]) {
        formData.append('images', files[i].file);
      }
    }

    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

async function deletePost(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// UI functions
async function renderPosts() {
  try {
    const posts = await fetchPosts();
    postsGrid.innerHTML = '';
    
    if (posts.length === 0) {
      postsGrid.innerHTML = '<p class="empty-state">No hay publicaciones aún. Crea la primera usando el formulario de arriba.</p>';
      return;
    }

    posts.slice().reverse().forEach((post) => {
      const clone = postTemplate.content.cloneNode(true);
      const card = clone.querySelector('.post-card');
      const image = clone.querySelector('.post-image');
      const title = clone.querySelector('.post-title');
      const text = clone.querySelector('.post-text');

      image.style.backgroundImage = post.images[0]
        ? `url('${post.images[0]}')`
        : `linear-gradient(135deg, #dbe7fb 0%, #f6f7fd 100%)`;
      title.textContent = `${post.model} · ${post.type}`;
      text.textContent = post.description.length > 120 ? `${post.description.slice(0, 120)}...` : post.description;

      postsGrid.appendChild(clone);
    });
  } catch (error) {
    console.error('Error rendering posts:', error);
    postsGrid.innerHTML = '<p class="empty-state">Error al cargar las publicaciones.</p>';
  }
}

function updateSlotButtons() {
  const slots = slotsContainer.querySelectorAll('.slot');
  slots.forEach((slot) => {
    const index = Number(slot.dataset.index);
    const file = selectedFiles[index];
    slot.classList.toggle('has-file', Boolean(file));
    slot.textContent = file ? `Foto ${index + 1} cargada` : `Subir Foto ${index + 1}`;
  });
}

function renderUploadPreviews() {
  const existingPreview = uploadZone.querySelector('.upload-preview-grid');
  if (existingPreview) existingPreview.remove();

  const uploadedFiles = selectedFiles.filter(Boolean);
  if (uploadedFiles.length === 0) return;

  const previewGrid = document.createElement('div');
  previewGrid.className = 'upload-preview-grid';
  uploadedFiles.forEach((fileObject) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.style.backgroundImage = `url('${fileObject.preview}')`;
    previewGrid.appendChild(item);
  });

  uploadZone.insertBefore(previewGrid, slotsContainer);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleFiles(files, targetIndex) {
  const fileArray = Array.from(files).slice(0, MAX_PHOTOS);
  for (let i = 0; i < fileArray.length; i += 1) {
    const insertionIndex = targetIndex + i;
    if (insertionIndex >= MAX_PHOTOS) break;
    const file = fileArray[i];
    const preview = await readFileAsDataURL(file);
    selectedFiles[insertionIndex] = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      preview: preview
    };
  }
  updateSlotButtons();
  renderUploadPreviews();
}

function clearForm() {
  inputModel.value = '';
  inputType.value = 'Avión Comercial';
  inputLocation.value = '';
  inputDescription.value = '';
  inputTags.value = '';
  selectedFiles = [null, null, null];
  activeSlotIndex = 0;
  updateSlotButtons();
  renderUploadPreviews();
}

async function publishPost() {
  const model = inputModel.value.trim();
  const type = inputType.value;
  const location = inputLocation.value.trim();
  const description = inputDescription.value.trim();
  const tags = inputTags.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!model || !description) {
    alert('Por favor, completa el modelo y la descripción antes de publicar.');
    return;
  }

  try {
    publishButton.disabled = true;
    publishButton.textContent = 'Publicando...';

    await createPost(model, type, location, description, tags, selectedFiles);
    
    alert('¡Publicación creada exitosamente!');
    clearForm();
    await renderPosts();
  } catch (error) {
    alert('Error al publicar. Por favor, intenta de nuevo.');
    console.error('Publish error:', error);
  } finally {
    publishButton.disabled = false;
    publishButton.textContent = 'PUBLICAR EN LA COMUNIDAD';
  }
}

function activateSlotButton(event) {
  const slot = event.target.closest('.slot');
  if (!slot) return;
  activeSlotIndex = Number(slot.dataset.index);
  fileInput.value = '';
  fileInput.click();
}

function handleDragOver(event) {
  event.preventDefault();
  dropArea.classList.add('dragover');
}

function handleDragLeave() {
  dropArea.classList.remove('dragover');
}

function handleDrop(event) {
  event.preventDefault();
  dropArea.classList.remove('dragover');
  const files = event.dataTransfer.files;
  if (files.length === 0) return;
  handleFiles(files, 0);
}

// Event listeners
fileInput.addEventListener('change', (event) => {
  const files = event.target.files;
  if (files.length === 0) return;
  handleFiles(files, activeSlotIndex);
});

dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('dragleave', handleDragLeave);
dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('click', () => {
  activeSlotIndex = 0;
  fileInput.value = '';
  fileInput.click();
});
slotsContainer.addEventListener('click', activateSlotButton);
publishButton.addEventListener('click', publishPost);

// Load posts on page load
document.addEventListener('DOMContentLoaded', renderPosts);
