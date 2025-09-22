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

// Functions
function loadSnippets() {
  const storedSnippets = localStorage.getItem('codeSnippets');
  snippets = storedSnippets ? JSON.parse(storedSnippets) : [];
}

function saveSnippetsToStorage() {
  localStorage.setItem('codeSnippets', JSON.stringify(snippets));
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
//make sure pinned comments show up first
  filteredSnippets.sort((a,b)=>b.pinned-a.pinned);

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
  <button class="secondary-btn" onclick="previewSnippet('${snippet.id}')">
    <i class="fas fa-eye"></i> Preview
  </button>
</div>
  `;


    snippetsGrid.appendChild(snippetCard);

    // Highlight the code block
    const codeBlock = snippetCard.querySelector('pre code');
    hljs.highlightElement(codeBlock);
  });
}

function updateCategoryList() {
  // Get unique categories
  const categories = [...new Set(snippets.map(snippet => snippet.category))];
  
  // Clear existing categories except "All Snippets"
  const allCategoriesItem = categoryList.querySelector('[data-category="all"]');
  categoryList.innerHTML = '';
  categoryList.appendChild(allCategoriesItem);
  
  // Add categories to the list
  categories.forEach(category => {
    if (category) {
      const li = document.createElement('li');
      li.textContent = category;
      li.setAttribute('data-category', category);
      if (activeCategory === category) {
        li.classList.add('active');
      }
      li.addEventListener('click', () => {
        setActiveCategory(category);
      });
      categoryList.appendChild(li);
    }
  });
  
  // Add event listener to "All Snippets"
  allCategoriesItem.addEventListener('click', () => {
    setActiveCategory('all');
  });
}

function setActiveCategory(category) {
  activeCategory = category;
  
  // Update active class
  document.querySelectorAll('.category-list li').forEach(item => {
    if (item.getAttribute('data-category') === category) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  renderSnippets();
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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

function previewSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    modalTitle.textContent = `Preview: ${snippet.title}`;

    titleInput.value = snippet.title;
    categoryInput.value = snippet.category;
    codeInput.value = snippet.code;

    // Disable editing
    titleInput.disabled = true;
    categoryInput.disabled = true;
    codeInput.disabled = true;

    // Hide Save button, show Close instead of Cancel
    saveSnippetBtn.style.display = 'none';
    cancelSnippetBtn.textContent = 'Close';

    modalOverlay.classList.add('active');
  }
}


function deleteSnippet(id) {
  if (confirm('Are you sure you want to delete this snippet?')) {
    snippets = snippets.filter(snippet => snippet.id !== id);
    saveSnippetsToStorage();
    renderSnippets();
    updateCategoryList();
  }
}

function closeModal() {
  modalOverlay.classList.remove('active');
  
  // Re-enable inputs
  titleInput.disabled = false;
  categoryInput.disabled = false;
  codeInput.disabled = false;

  // Reset buttons
  saveSnippetBtn.style.display = 'inline-block';
  cancelSnippetBtn.textContent = 'Cancel';
}


function saveSnippet() {
  if (!snippetForm.checkValidity()) {
    snippetForm.reportValidity();
    return;
  }

  const title = titleInput.value;
  const category = categoryInput.value;
  const code = codeInput.value;

  if (editMode) {
    const id = snippetIdInput.value;
    const index = snippets.findIndex(s => s.id === id);
    if (index !== -1) {
      snippets[index] = { 
        id, 
        title, 
        category, 
        code, 
        pinned: snippets[index].pinned // Preserve pinned status 
      };
    }
  } else {
    const id = Date.now().toString();
    snippets.push({ id, title, category, code, pinned: false }); // Default pinned: false
  }
  

  saveSnippetsToStorage();
  renderSnippets();
  updateCategoryList();
  closeModal();
}

function loadTheme() {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    document.body.classList.add('dark-mode');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function toggleSidebar() {
  sidebar.classList.toggle('active');
  
  if (sidebar.classList.contains("active")) {
    toggleSidebarBtn.style.transform = "translateX(180px)";
    contentArea.style.marginLeft = "250px";
  } else {
    toggleSidebarBtn.style.transform = "translateX(0)";
    contentArea.style.marginLeft = "0px";
  }
}
function togglePin(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    snippet.pinned = !snippet.pinned;
    saveSnippetsToStorage();
    renderSnippets();
  }
}

function saveSnippetsToStorage() {
  localStorage.setItem('codeSnippets', JSON.stringify(snippets));
}


function copyToClipboard(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    navigator.clipboard.writeText(snippet.code)
      .then(() => {
        // Optional: Show feedback to user
        const button = document.querySelector(`.snippet-card button[onclick="copyToClipboard('${id}')"]`);
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.disabled = true;
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy code to clipboard');
      });
  }
}

// Make functions available globally for onclick handlers
window.editSnippet = editSnippet;
window.deleteSnippet = deleteSnippet; 
window.copyToClipboard = copyToClipboard;