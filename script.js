// DOM Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const snippetsGrid = document.getElementById('snippets-grid');
const searchInput = document.getElementById('search');
const addSnippetBtn = document.getElementById('add-snippet');
const addSnippetSidebarBtn = document.getElementById('add-snippet-sidebar');
const themeToggle = document.getElementById('theme-toggle');
const modalOverlay = document.getElementById('snippet-modal-overlay');
const closeModalBtn = document.getElementById('close-modal');
const cancelSnippetBtn = document.getElementById('cancel-snippet');
const saveSnippetBtn = document.getElementById('save-snippet');
const snippetForm = document.getElementById('snippet-form');
const modalTitle = document.getElementById('modal-title');
const snippetIdInput = document.getElementById('snippet-id');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const codeInput = document.getElementById('code');
const categoryList = document.getElementById('category-list');
const contentArea = document.getElementById('main-content');

// State
let snippets = [];
let snippetOrder = [];
let editMode = false;
let activeCategory = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSnippets();
  renderSnippets();
  loadTheme();
  updateCategoryList();
});

// Event Listeners
searchInput.addEventListener('input', renderSnippets);
addSnippetBtn.addEventListener('click', openAddSnippetModal);
addSnippetSidebarBtn.addEventListener('click', openAddSnippetModal);
themeToggle.addEventListener('click', toggleTheme);
closeModalBtn.addEventListener('click', closeModal);
cancelSnippetBtn.addEventListener('click', closeModal);
saveSnippetBtn.addEventListener('click', saveSnippet);
toggleSidebarBtn.addEventListener('click', toggleSidebar);
document.addEventListener('keydown', handleSearchShortcut);

// NEW: Intercept Ctrl+S / Cmd+S to save snippet when modal is open
document.addEventListener('keydown', function (e) {
  const isSaveShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
  if (isSaveShortcut) {
    if (modalOverlay.classList.contains('active')) {
      e.preventDefault(); // Block browser's "Save Page As"
      if (snippetForm.reportValidity()) {
        saveSnippet();
      }
    }
  }
});

// Functions
function handleSearchShortcut(e) {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key !== '/') return;
  if (document.querySelector('.modal-overlay.active')) return;
  e.preventDefault();
  searchInput.focus();
  const end = searchInput.value.length;
  searchInput.setSelectionRange(end, end);
}

function loadSnippets() {
  const storedSnippets = localStorage.getItem('codeSnippets');
  const storedOrder = localStorage.getItem('snippetOrder');
  snippets = storedSnippets ? JSON.parse(storedSnippets) : [];
  snippetOrder = storedOrder ? JSON.parse(storedOrder) : snippets.map(s => s.id);
}

function saveSnippetsToStorage() {
  localStorage.setItem('codeSnippets', JSON.stringify(snippets));
  localStorage.setItem('snippetOrder', JSON.stringify(snippetOrder));
}

function renderSnippets() {
  const searchTerm = searchInput.value.toLowerCase();
  let filteredSnippets = snippets;

  if (searchTerm) {
    filteredSnippets = filteredSnippets.filter(snippet =>
      snippet.title.toLowerCase().includes(searchTerm) ||
      snippet.category.toLowerCase().includes(searchTerm)
    );
  }

  if (activeCategory !== 'all') {
    filteredSnippets = filteredSnippets.filter(snippet =>
      snippet.category === activeCategory
    );
  }

  filteredSnippets.sort((a, b) => {
    if (b.pinned !== a.pinned) return b.pinned - a.pinned;
    return snippetOrder.indexOf(a.id) - snippetOrder.indexOf(b.id);
  });

  snippetsGrid.innerHTML = '';

  if (filteredSnippets.length === 0) {
    snippetsGrid.innerHTML = `
      <div class="empty-state">
        <h2>No snippets found</h2>
        <p>Add your first code snippet or try a different search term.</p>
      </div>
    `;
    return;
  }

  filteredSnippets.forEach(snippet => {
    const snippetCard = document.createElement('div');
    snippetCard.className = 'snippet-card';
    snippetCard.setAttribute('draggable', 'true');
    snippetCard.setAttribute('data-id', snippet.id);

    snippetCard.innerHTML = `
      <div class="snippet-header">
        <div class="snippet-title">${snippet.title}</div>
        <div class="snippet-category">${snippet.category}</div>
        <button class="pin-btn ${snippet.pinned ? 'pinned' : ''}" onclick="togglePin('${snippet.id}')">
          <i class="fas fa-thumbtack"></i>
        </button>
      </div>
      <div class="snippet-content">
        <pre><code class="language-${snippet.category.toLowerCase()}">${escapeHtml(snippet.code)}</code></pre>
      </div>
      <div class="snippet-actions">
        <button class="secondary-btn copy-btn" onclick="copyToClipboard('${snippet.id}')">
          <i class="fas fa-copy"></i> Copy
        </button>
        <button class="secondary-btn" onclick="editSnippet('${snippet.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="secondary-btn" onclick="deleteSnippet('${snippet.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;

    snippetCard.addEventListener('dragstart', handleDragStart);
    snippetCard.addEventListener('dragover', handleDragOver);
    snippetCard.addEventListener('drop', handleDrop);
    snippetCard.addEventListener('dragend', handleDragEnd);

    snippetsGrid.appendChild(snippetCard);

    const codeBlock = snippetCard.querySelector('pre code');
    hljs.highlightElement(codeBlock);
  });
}

// Drag and drop handlers
let draggedId = null;
function handleDragStart(e) { draggedId = this.getAttribute('data-id'); this.classList.add('dragging'); }
function handleDragOver(e) { e.preventDefault(); this.classList.add('drag-over'); }
function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const droppedId = this.getAttribute('data-id');
  if (draggedId && droppedId && draggedId !== droppedId) {
    const fromIdx = snippetOrder.indexOf(draggedId);
    const toIdx = snippetOrder.indexOf(droppedId);
    snippetOrder.splice(fromIdx, 1);
    snippetOrder.splice(toIdx, 0, draggedId);
    saveSnippetsToStorage();
    renderSnippets();
  }
  draggedId = null;
}
function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.snippet-card.drag-over').forEach(card => card.classList.remove('drag-over'));
}

function updateCategoryList() {
  const categories = [...new Set(snippets.map(snippet => snippet.category))];
  const allCategoriesItem = categoryList.querySelector('[data-category="all"]');
  categoryList.innerHTML = '';
  categoryList.appendChild(allCategoriesItem);
  categories.forEach(category => {
    if (category) {
      const li = document.createElement('li');
      li.textContent = category;
      li.setAttribute('data-category', category);
      if (activeCategory === category) li.classList.add('active');
      li.addEventListener('click', () => setActiveCategory(category));
      categoryList.appendChild(li);
    }
  });
  allCategoriesItem.addEventListener('click', () => setActiveCategory('all'));
}

function setActiveCategory(category) {
  activeCategory = category;
  document.querySelectorAll('.category-list li').forEach(item => {
    if (item.getAttribute('data-category') === category) item.classList.add('active');
    else item.classList.remove('active');
  });
  renderSnippets();
}

function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;")
               .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}

function openAddSnippetModal() {
  editMode = false;
  modalTitle.textContent = 'Add New Snippet';
  snippetForm.reset();
  snippetIdInput.value = '';
  modalOverlay.classList.add('active');
}

function editSnippet(id) {
  editMode = true;
  modalTitle.textContent = 'Edit Snippet';
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    snippetIdInput.value = snippet.id;
    titleInput.value = snippet.title;
    categoryInput.value = snippet.category;
    codeInput.value = snippet.code;
    modalOverlay.classList.add('active');
  }
}

function deleteSnippet(id) {
  if (confirm('Are you sure you want to delete this snippet?')) {
    snippets = snippets.filter(snippet => snippet.id !== id);
    snippetOrder = snippetOrder.filter(snippetId => snippetId !== id);
    saveSnippetsToStorage();
    renderSnippets();
    updateCategoryList();
  
}}
