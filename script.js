let snippets = [];
let editMode = false;

// DOM Elements
const snippetsGrid = document.getElementById('snippets-grid');
const addSnippetBtn = document.getElementById('add-snippet');
const addSnippetSidebarBtn = document.getElementById('add-snippet-sidebar');
const saveSnippetBtn = document.getElementById('save-snippet');
const cancelSnippetBtn = document.getElementById('cancel-snippet');
const closeModalBtn = document.getElementById('close-modal');
const modalOverlay = document.getElementById('snippet-modal-overlay');
const snippetForm = document.getElementById('snippet-form');
const snippetIdInput = document.getElementById('snippet-id');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const codeInput = document.getElementById('code');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSnippets();
  renderSnippets();
});

// Load snippets
function loadSnippets() {
  const stored = localStorage.getItem('codeSnippets');
  snippets = stored ? JSON.parse(stored) : [];
}

// Save snippets
function saveSnippetsToStorage() {
  localStorage.setItem('codeSnippets', JSON.stringify(snippets));
}

// Render snippets
function renderSnippets() {
  snippetsGrid.innerHTML = '';
  if (snippets.length === 0) {
    snippetsGrid.innerHTML = '<p>No snippets yet. Add one!</p>';
    return;
  }
  snippets.forEach(snippet => {
    const card = document.createElement('div');
    card.className = 'snippet-card';
    card.innerHTML = `
      <h3>${snippet.title}</h3>
      <pre><code>${snippet.code}</code></pre>
      <div class="snippet-actions">
        <button class="secondary-btn" onclick="deleteSnippet('${snippet.id}')">Delete</button>
      </div>
    `;
    snippetsGrid.appendChild(card);
  });
}

// Add snippet modal
function openAddSnippetModal() {
  editMode = false;
  snippetForm.reset();
  snippetIdInput.value = '';
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  modalOverlay.style.display = 'none';
}

function saveSnippet() {
  const title = titleInput.value;
  const category = categoryInput.value;
  const code = codeInput.value;

  if (editMode) {
    const id = snippetIdInput.value;
    const index = snippets.findIndex(s => s.id === id);
    if (index !== -1) {
      snippets[index] = { id, title, category, code };
    }
  } else {
    const id = Date.now().toString();
    snippets.push({ id, title, category, code });
  }

  saveSnippetsToStorage();
  renderSnippets();
  closeModal();
}

function deleteSnippet(id) {
  snippets = snippets.filter(s => s.id !== id);
  saveSnippetsToStorage();
  renderSnippets();
}

// Export to GitHub Gist
async function exportSnippetsAsGist() {
  if (snippets.length === 0) {
    alert("No snippets to export!");
    return;
  }

  let content = "";
  snippets.forEach(s => {
    content += `// ${s.title} [${s.category}]\n${s.code}\n\n`;
  });

  try {
    const response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        "Authorization": "token YOUR_GITHUB_TOKEN", // replace with your token
        "Accept": "application/vnd.github+json"
      },
      body: JSON.stringify({
        description: "Exported snippets from Code-Block",
        public: false,
        files: { "snippets.js": { content } }
      })
    });

    const data = await response.json();
    if (response.ok) {
      alert("✅ Gist created: " + data.html_url);
    } else {
      alert("❌ Failed: " + data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Error exporting snippets");
  }
}

// Event listeners
addSnippetBtn.addEventListener('click', openAddSnippetModal);
addSnippetSidebarBtn.addEventListener('click', openAddSnippetModal);
saveSnippetBtn.addEventListener('click', saveSnippet);
cancelSnippetBtn.addEventListener('click', closeModal);
closeModalBtn.addEventListener('click', closeModal);

// Make functions global for onclick
window.deleteSnippet = deleteSnippet;
window.exportSnippetsAsGist = exportSnippetsAsGist;
