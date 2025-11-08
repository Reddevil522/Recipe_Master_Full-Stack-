// Recipe Master — Frontend + HTML Template Buttons + Backend + Confirmation Modal + Auth (Admin/User/Register)
// API base kept as before
const API_BASE = 'http://localhost/recipe-master/api';

let recipes = [];
let filteredRecipes = [];

/* ---------------- INITIALIZE ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth(); // initialize auth UI and logic (must run before loading recipes)
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    const addBtn = document.getElementById('add-recipe-btn');
    const suggestBtn = document.getElementById('suggest-recipe-btn');
    const addAdminBtn = document.getElementById('add-admin-btn');
    const searchInput = document.getElementById('search-input');
    const form = document.getElementById('recipe-form');
    const suggestForm = document.getElementById('suggest-form');
    const addAdminForm = document.getElementById('add-admin-form');

    addBtn.addEventListener('click', () => {
        // Reset editing mode
        window.resetEditMode();
        
        // Reset form for adding new recipe
        form.reset();
        document.getElementById('form-title').textContent = 'Add Recipe';
        document.getElementById('save-recipe').innerHTML = '<i class="fas fa-save"></i> Save';
        openModal('add-modal');
    });
    suggestBtn.addEventListener('click', () => openModal('suggest-modal'));
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', () => openModal('add-admin-modal'));
    }
    document.querySelectorAll('[data-close-modal]').forEach(btn =>
        btn.addEventListener('click', closeAllModals)
    );
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        filteredRecipes = recipes.filter(r =>
            r.title?.toLowerCase().includes(q) ||
            (r.cuisine_type || '').toLowerCase().includes(q) ||
            (r.ingredients || '').toLowerCase().includes(q)
        );
        renderRecipes();
    });

    // Store editing state
    let isEditing = false;
    let editingId = null;
    
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-recipe');
        const stopLoading = showLoading(saveBtn);
        
        const recipeData = collectForm();
        if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
            stopLoading();
            notify('Please fill in Title, Ingredients and Instructions.', 'error'); 
            return;
        }
        
        if (isEditing && editingId) {
            // Update existing recipe via API
            try {
                const updatedRecipe = await apiUpdateRecipe(editingId, recipeData);
                recipes = recipes.map(r => {
                    if (String(r.id) === String(editingId)) {
                        return updatedRecipe;
                    }
                    return r;
                });
                notify('Recipe updated successfully! ✅', 'success');
            } catch (err) {
                // Fallback to local update
                recipes = recipes.map(r => {
                    if (String(r.id) === String(editingId)) {
                        return { ...r, ...recipeData, id: r.id };
                    }
                    return r;
                });
                saveRecipesToStorage();
                notify('Recipe updated locally (backend not available)', 'info');
            }
            
            // Reset editing state
            isEditing = false;
            editingId = null;
        } else {
            // Add new recipe via API
            try {
                const newRecipe = await apiAddRecipe(recipeData);
                recipes.push(newRecipe);
                notify('Recipe added successfully! 🎉', 'success');
            } catch (err) {
                // Fallback to local add
                const newRecipeWithId = {
                    ...recipeData,
                    id: Date.now()
                };
                recipes.push(newRecipeWithId);
                saveRecipesToStorage();
                notify('Recipe added locally (backend not available)', 'info');
            }
        }
        
        filteredRecipes = [...recipes];
        renderRecipes();
        closeAllModals();
        form.reset();
        document.getElementById('form-title').textContent = 'Add Recipe';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        stopLoading();
    });
    
    // Make editing state accessible to editRecipe function
    window.setEditMode = (id) => {
        isEditing = true;
        editingId = id;
    };
    
    window.resetEditMode = () => {
        isEditing = false;
        editingId = null;
    };

    // Suggestion form handler
    suggestForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-suggestion');
        const stopLoading = showLoading(submitBtn);
        
        const suggestion = collectSuggestionForm();
        if (!suggestion.title || !suggestion.ingredients || !suggestion.instructions) {
            stopLoading();
            notify('Please fill in Title, Ingredients and Instructions.', 'error');
            return;
        }
        
        try {
            saveSuggestion(suggestion);
            closeAllModals();
            suggestForm.reset();
            notify('Recipe suggestion submitted successfully! 🎉', 'success');
        } catch (err) {
            notify('Failed to submit suggestion', 'error');
        } finally {
            stopLoading();
        }
    });

    // Password toggle for admin password
    document.querySelectorAll('.pw-toggle').forEach(t => {
        t.addEventListener('click', () => {
            const target = document.getElementById(t.dataset.target);
            if (!target) return;
            target.type = target.type === 'password' ? 'text' : 'password';
            t.querySelector('i').classList.toggle('fa-eye');
            t.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Add Admin form handler
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async e => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-admin');
            const stopLoading = showLoading(submitBtn);
            
            const name = document.getElementById('admin_name').value.trim();
            const username = document.getElementById('admin_username').value.trim();
            const password = document.getElementById('admin_password').value;
            
            if (!name || !username || !password) {
                stopLoading();
                notify('Please fill all fields.', 'error');
                return;
            }
            
            if (password.length < 6) {
                stopLoading();
                notify('Password must be at least 6 characters.', 'error');
                return;
            }
            
            try {
                // Add admin via API
                const response = await fetch(`${API_BASE}/admin.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email: username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    closeAllModals();
                    addAdminForm.reset();
                    await loadAdminList();
                    notify(`Admin "${name}" created successfully! 🎉`, 'success');
                } else {
                    notify(data.message || 'Failed to create admin', 'error');
                }
            } catch (err) {
                // Fallback to localStorage
                console.log('API not available, saving admin locally');
                const users = getStoredUsers();
                if (users.some(u => u.email === username)) {
                    stopLoading();
                    notify('Username already exists.', 'error');
                    return;
                }
                
                const newAdmin = {
                    id: genId(),
                    name: name,
                    email: username,
                    password: btoa(password),
                    role: 'admin',
                    isSuperAdmin: false
                };
                
                users.push(newAdmin);
                setStoredUsers(users);
                
                closeAllModals();
                addAdminForm.reset();
                await loadAdminList();
                notify(`Admin "${name}" created successfully (locally)! 🎉`, 'success');
            }
            
            stopLoading();
        });
        
        // Password strength for admin
        const adminPw = document.getElementById('admin_password');
        if (adminPw) {
            adminPw.addEventListener('input', () => {
                const el = document.getElementById('admin-pw-strength');
                if (!el) return;
                const pw = adminPw.value;
                let score = 0;
                if (pw.length >= 8) score += 2;
                if (/[A-Z]/.test(pw)) score++;
                if (/[0-9]/.test(pw)) score++;
                if (/[^A-Za-z0-9]/.test(pw)) score++;
                const label = score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : 'Strong';
                el.querySelector('span').textContent = `Strength: ${label}`;
                el.className = 'pw-strength s' + Math.min(score, 4);
            });
        }
    }

    // Load recipes and initialize based on user role
    loadRecipes().then(() => {
        // After recipes are loaded, check if user is logged in and re-render
        const currentUser = getCurrent();
        if (currentUser) {
            renderRecipes(); // Re-render with correct button visibility
        }
    });
    
    initSuggestions();
    initAdminManagement();
});

/* ---------------- AUTH (Admin/User/Register) ---------------- */
const AUTH_KEY_USERS = 'rm_users';         // stores users array
const AUTH_KEY_CURRENT = 'rm_current';     // current logged in info

function initAuth() {
    // create default super admin if not existing
    let users = getStoredUsers();
    
    // Remove any old admin accounts
    users = users.filter(u => u.email !== 'admin');
    
    // Check if Gopal Kumar super admin exists
    const existingAdmin = users.find(u => u.email === 'Gopal522');
    if (existingAdmin) {
        // Ensure it's a superadmin
        existingAdmin.role = 'superadmin';
        existingAdmin.isSuperAdmin = true;
        existingAdmin.id = 'superadmin_001';
        existingAdmin.name = 'Gopal Kumar';
        existingAdmin.password = btoa('Army@522');
        localStorage.setItem(AUTH_KEY_USERS, JSON.stringify(users));
        console.log('✅ Super Admin verified: Gopal Kumar');
    } else {
        // Create new super admin
        const hasSuperAdmin = users.some(u => u.role === 'superadmin');
        if (!hasSuperAdmin) {
            users.push({ 
                id: 'superadmin_001', 
                name: 'Gopal Kumar', 
                email: 'Gopal522', 
                password: btoa('Army@522'), 
                role: 'superadmin',
                isSuperAdmin: true 
            });
            localStorage.setItem(AUTH_KEY_USERS, JSON.stringify(users));
            console.log('✅ Created Super Admin: Gopal Kumar');
        }
    }

    // Check if user is already logged in
    let currentUser = getCurrent();
    if (!currentUser) {
        // Show auth modal only if not logged in
        openAuthModal();
    } else {
        // Verify super admin credentials
        if (currentUser.email === 'Gopal522' && currentUser.role !== 'superadmin') {
            currentUser.role = 'superadmin';
            currentUser.isSuperAdmin = true;
            currentUser.name = 'Gopal Kumar';
            setCurrent(currentUser);
            console.log('✅ Verified Super Admin: Gopal Kumar');
        }
        
        // Remove old admin if logged in
        if (currentUser.email === 'admin') {
            clearCurrent();
            openAuthModal();
            notify('Please login with new credentials', 'info');
            return;
        }
        
        // User already logged in, close auth modal and apply state
        closeAuthModal();
        applyAuthState(currentUser);
        // Note: renderRecipes() will be called after loadRecipes() completes
    }

    // Tab switching
    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
            const form = document.getElementById(target);
            if (form) form.style.display = 'block';
        });
    });

    // Password show/hide toggles
    document.querySelectorAll('.pw-toggle').forEach(t => {
        t.addEventListener('click', () => {
            const target = document.getElementById(t.dataset.target);
            if (!target) return;
            target.type = target.type === 'password' ? 'text' : 'password';
            t.querySelector('i').classList.toggle('fa-eye');
            t.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Register password strength
    const rpw = document.getElementById('r_password');
    if (rpw) {
        rpw.addEventListener('input', () => updatePwStrength(rpw.value));
    }

    // Forms handlers
    const regForm = document.getElementById('user-register');
    const userLoginForm = document.getElementById('user-login');
    const adminLoginForm = document.getElementById('admin-login');

    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleRegister();
    });
    userLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleUserLogin();
    });
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAdminLogin();
    });

    document.querySelectorAll('[data-close-auth]').forEach(b => b.addEventListener('click', () => {
        // closing auth modal not allowed unless logged in: show message
        const current = getCurrent();
        if (!current) {
            notify('Please login or register to continue.', 'info');
            return;
        }
        closeAuthModal();
    }));
}

function openAuthModal() {
    const m = document.getElementById('auth-modal');
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');

    // disable background interactions
    const toggle = document.getElementById('theme-toggle');
    if (toggle) { toggle.style.pointerEvents = 'none'; toggle.style.opacity = '0.5'; }
}

function closeAuthModal() {
    const m = document.getElementById('auth-modal');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');

    const toggle = document.getElementById('theme-toggle');
    if (toggle) { toggle.style.pointerEvents = 'auto'; toggle.style.opacity = '1'; }
}

function getStoredUsers() {
    try {
        const raw = localStorage.getItem(AUTH_KEY_USERS);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setStoredUsers(arr) {
    localStorage.setItem(AUTH_KEY_USERS, JSON.stringify(arr));
}

function getCurrent() {
    try {
        const raw = localStorage.getItem(AUTH_KEY_CURRENT);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
function setCurrent(obj) {
    localStorage.setItem(AUTH_KEY_CURRENT, JSON.stringify(obj));
}
function clearCurrent() {
    localStorage.removeItem(AUTH_KEY_CURRENT);
}

function genId() {
    return 'u_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
}

// Password strength meter (basic)
function updatePwStrength(pw) {
    const el = document.getElementById('pw-strength');
    if (!el) return;
    let score = 0;
    if (pw.length >= 8) score += 2;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const label = score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : 'Strong';
    el.querySelector('span').textContent = `Strength: ${label}`;
    el.className = 'pw-strength s' + Math.min(score, 4);
}

async function handleRegister() {
    const name = document.getElementById('r_name').value.trim();
    const email = document.getElementById('r_email').value.trim().toLowerCase();
    const pw = document.getElementById('r_password').value;
    const pw2 = document.getElementById('r_password2').value;

    if (!name || !email || !pw) { notify('Please fill all required fields.', 'error'); return; }
    if (pw !== pw2) { notify('Passwords do not match.', 'error'); return; }
    if (pw.length < 6) { notify('Password should be at least 6 characters.', 'error'); return; }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { notify('Please enter a valid email address.', 'error'); return; }

    try {
        // Register via API
        const response = await fetch(`${API_BASE}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', name, email, password: pw })
        });
        
        const data = await response.json();
        
        if (data.success) {
            setCurrent({ ...data.user, remember: true });
            notify(`Welcome aboard, ${name}! 🎉`, 'success');
            closeAuthModal();
            applyAuthState(getCurrent());
            renderRecipes();
        } else {
            notify(data.message || 'Registration failed', 'error');
        }
    } catch (err) {
        // Fallback to localStorage
        const users = getStoredUsers();
        if (users.some(u => u.email === email)) { 
            notify('Email already registered. Try logging in.', 'error'); 
            return; 
        }
        const user = { id: genId(), name, email, password: btoa(pw), role: 'user' };
        users.push(user);
        setStoredUsers(users);
        setCurrent({ id: user.id, name: user.name, email: user.email, role: user.role, remember: true });
        notify(`Welcome aboard, ${name}! (Saved locally)`, 'success');
        closeAuthModal();
        applyAuthState(getCurrent());
        renderRecipes();
    }
}

async function handleUserLogin() {
    const email = document.getElementById('u_email').value.trim().toLowerCase();
    const pw = document.getElementById('u_password').value;
    const remember = document.getElementById('u_remember').checked;

    if (!email || !pw) { notify('Enter email and password.', 'error'); return; }

    try {
        // Login via API
        const response = await fetch(`${API_BASE}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password: pw })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            
            // Check if admin trying to login in user tab
            if (user.role === 'admin' || user.role === 'superadmin') {
                notify('Please use "Admin Login" tab for admin accounts.', 'error');
                return;
            }
            
            setCurrent({ ...user, remember });
            notify(`Welcome back, ${user.name}! 👋`, 'success');
            closeAuthModal();
            applyAuthState(getCurrent());
            renderRecipes();
        } else {
            notify(data.message || 'Invalid credentials', 'error');
        }
    } catch (err) {
        // Fallback to localStorage
        const users = getStoredUsers();
        const found = users.find(u => u.email === email && u.password === btoa(pw));
        
        if (!found) { 
            notify('Invalid credentials. Please try again.', 'error'); 
            return; 
        }
        
        if (found.role === 'admin' || found.role === 'superadmin') {
            notify('Please use "Admin Login" tab for admin accounts.', 'error');
            return;
        }

        setCurrent({ id: found.id, name: found.name, email: found.email, role: found.role, remember });
        notify(`Welcome back, ${found.name}! (Offline mode)`, 'success');
        closeAuthModal();
        applyAuthState(getCurrent());
        renderRecipes();
    }
}

async function handleAdminLogin() {
    const username = document.getElementById('a_user').value.trim();
    const pw = document.getElementById('a_password').value;

    if (!username || !pw) { notify('Enter admin username and password.', 'error'); return; }

    try {
        // Login via API
        const response = await fetch(`${API_BASE}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email: username, password: pw })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            
            // Check if regular user trying to login in admin tab
            if (user.role === 'user') {
                notify('Please use "User Login" tab for user accounts.', 'error');
                return;
            }
            
            // Only allow admin and superadmin
            if (user.role !== 'admin' && user.role !== 'superadmin') {
                notify('This account does not have admin privileges.', 'error');
                return;
            }

            setCurrent({ ...user, remember: true });
            
            const greeting = user.role === 'superadmin' ? 'Super Admin access granted! 👑' : 'Admin access granted! 🔐';
            notify(greeting, 'success');
            closeAuthModal();
            applyAuthState(getCurrent());
            renderRecipes();
            
            if (user.role === 'superadmin') {
                initAdminManagement();
            }
        } else {
            notify(data.message || 'Invalid admin credentials', 'error');
        }
    } catch (err) {
        // Fallback to localStorage
        const users = getStoredUsers();
        const found = users.find(u => 
            (u.email === username || u.name === username) && 
            u.password === btoa(pw)
        );
        
        if (!found) { 
            notify('Invalid admin credentials.', 'error'); 
            return; 
        }
        
        if (found.role === 'user') {
            notify('Please use "User Login" tab for user accounts.', 'error');
            return;
        }
        
        if (found.role !== 'admin' && found.role !== 'superadmin') {
            notify('This account does not have admin privileges.', 'error');
            return;
        }

        setCurrent({ 
            id: found.id, 
            name: found.name, 
            email: found.email, 
            role: found.role,
            isSuperAdmin: found.isSuperAdmin || false,
            remember: true 
        });
        
        const greeting = found.role === 'superadmin' ? 'Super Admin access granted! 👑 (Offline)' : 'Admin access granted! 🔐 (Offline)';
        notify(greeting, 'success');
        closeAuthModal();
        applyAuthState(getCurrent());
        renderRecipes();
        
        if (found.role === 'superadmin') {
            initAdminManagement();
        }
    }
}

// Adjust UI / permissions after login
function applyAuthState(current) {
    const addBtn = document.getElementById('add-recipe-btn');
    const suggestBtn = document.getElementById('suggest-recipe-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (!current) {
        // no user — disable add
        addBtn.setAttribute('disabled', 'true');
        addBtn.title = 'Login required';
        suggestBtn.style.display = 'none';
        userMenu.style.display = 'none';
    } else {
        // Show user menu
        userMenu.style.display = 'block';
        document.getElementById('user-name-display').textContent = current.name;
        document.getElementById('dropdown-user-name').textContent = current.name;
        document.getElementById('dropdown-user-role').textContent = current.role;
        
        // Role-based button visibility
        if (current.role === 'admin' || current.role === 'superadmin') {
            addBtn.removeAttribute('disabled');
            addBtn.style.display = 'inline-flex';
            addBtn.title = 'Add new recipe';
            suggestBtn.style.display = 'none'; // Admin doesn't need suggest button
            
            // Show suggestions section for admin
            showSuggestionsSection();
            renderSuggestions();
            
            // Show admin management for super admin only
            if (current.role === 'superadmin') {
                showAdminManagementSection();
                renderAdminList();
            }
        } else {
            // Regular users can only suggest recipes
            addBtn.style.display = 'none';
            suggestBtn.style.display = 'inline-flex';
            suggestBtn.title = 'Suggest a recipe to admin';
        }
        
        // Setup user menu interactions
        setupUserMenu();
    }
}

let userMenuInitialized = false;

function setupUserMenu() {
    if (userMenuInitialized) return; // Prevent duplicate event listeners
    
    const avatarBtn = document.getElementById('user-avatar-btn');
    const dropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!avatarBtn || !dropdown || !logoutBtn) return;
    
    // Toggle dropdown
    avatarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Logout functionality with smooth animation
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.classList.remove('show');
        
        // Create custom confirmation modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-overlay';
        confirmModal.innerHTML = `
            <div class="confirm-box logout-confirm">
                <div class="confirm-icon">
                    <i class="fas fa-sign-out-alt"></i>
                </div>
                <h3>Logout Confirmation</h3>
                <p>Are you sure you want to logout?</p>
                <div class="confirm-buttons">
                    <button id="confirmLogout" class="btn btn-danger">
                        <i class="fas fa-sign-out-alt"></i> Yes, Logout
                    </button>
                    <button id="cancelLogout" class="btn btn-cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
        
        // Cancel logout
        confirmModal.querySelector('#cancelLogout').onclick = () => {
            confirmModal.style.opacity = '0';
            setTimeout(() => confirmModal.remove(), 300);
        };
        
        // Confirm logout
        confirmModal.querySelector('#confirmLogout').onclick = () => {
            confirmModal.style.opacity = '0';
            setTimeout(() => {
                confirmModal.remove();
                clearCurrent();
                
                // Show logout animation
                const logoutOverlay = document.createElement('div');
                logoutOverlay.className = 'logout-overlay';
                logoutOverlay.innerHTML = `
                    <div class="logout-animation">
                        <i class="fas fa-sign-out-alt"></i>
                        <p>Logging out...</p>
                    </div>
                `;
                document.body.appendChild(logoutOverlay);
                
                notify('Logged out successfully! 👋', 'success');
                
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }, 300);
        };
    });
    
    userMenuInitialized = true;
}

/* ---------------- THEME ---------------- */
const THEME_KEY = 'theme';
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    let theme = saved;
    if (!theme) {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        theme = prefersLight ? 'light' : 'dark';
    }
    applyTheme(theme);
    if (!saved && window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
            applyTheme(e.matches ? 'light' : 'dark');
        });
    }
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (theme === 'light') { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    else { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
}

/* ---------------- API CALLS ---------------- */
const RECIPES_KEY = 'rm_recipes';

function saveRecipesToStorage() {
    try {
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
    } catch (e) {
        console.error('Failed to save recipes to localStorage:', e);
    }
}

function loadRecipesFromStorage() {
    try {
        const stored = localStorage.getItem(RECIPES_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error('Failed to load recipes from localStorage:', e);
        return null;
    }
}

async function loadRecipes() {
    try {
        // Try to load from API
        const data = await apiGetRecipes();
        recipes = Array.isArray(data) ? data : [];
        filteredRecipes = [...recipes];
        saveRecipesToStorage(); // Save to localStorage
    } catch {
        // If API fails, try localStorage first
        const storedRecipes = loadRecipesFromStorage();
        
        if (storedRecipes && storedRecipes.length > 0) {
            recipes = storedRecipes;
            filteredRecipes = [...recipes];
            console.log('Loaded recipes from localStorage');
        } else {
            // Use sample data as last resort
            recipes = [
                { id: 1, title: "Veg Biryani", ingredients: "Rice, vegetables, spices", instructions: "Soak rice\nCook veggies\nLayer & dum", image_url: "", cuisine_type: "Indian", prep_time: 30, cook_time: 60, servings: 4, difficulty: "Medium" },
                { id: 2, title: "Aloo Gobi", ingredients: "Potato, cauliflower", instructions: "Cut veggies\nFry spices\nCook till tender", image_url: "", cuisine_type: "Indian", prep_time: 15, cook_time: 25, servings: 3, difficulty: "Easy" }
            ];
            filteredRecipes = [...recipes];
            saveRecipesToStorage();
            notify('Using sample data locally.', 'info');
        }
    }
    renderRecipes();
}

async function apiGetRecipes() {
    const r = await fetch(`${API_BASE}/get_recipes.php`);
    if (!r.ok) throw new Error('Failed to fetch recipes');
    return r.json();
}
async function apiAddRecipe(payload) {
    const r = await fetch(`${API_BASE}/add_recipe.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('Failed to add recipe');
    return r.json();
}
async function apiDeleteRecipe(id) {
    const r = await fetch(`${API_BASE}/delete_recipe.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error('Failed to delete');
    return r.json();
}
async function apiUpdateRecipe(id, patch) {
    const r = await fetch(`${API_BASE}/update_recipe.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch)
    });
    if (!r.ok) throw new Error('Failed to update');
    return r.json();
}

/* ---------------- RENDER (uses HTML template) ---------------- */
function renderRecipes() {
    const list = document.getElementById('recipe-list');
    const tpl = document.getElementById('recipe-card');
    list.innerHTML = '';

    if (!filteredRecipes.length) {
        const empty = document.createElement('li');
        empty.className = 'no-recipes';
        empty.innerHTML = `<div class="recipe-card-content"><h3>No recipes found</h3><p class="subtitle">Try a different search</p></div>`;
        list.appendChild(empty);
        return;
    }

    filteredRecipes.forEach(recipe => {
        const node = tpl.content.firstElementChild.cloneNode(true);

        // Fill image + title
        const img = node.querySelector('[data-ref="img"]');
        const title = node.querySelector('[data-ref="title"]');
        const meta = node.querySelector('[data-ref="meta"]');

        if (recipe.image_url) {
            img.src = recipe.image_url;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
        img.alt = recipe.title || 'Recipe';
        title.textContent = recipe.title || 'Recipe';

        const totalMin = (toInt(recipe.prep_time) + toInt(recipe.cook_time)) || 0;
        meta.innerHTML = `
      <span><i class="fas fa-clock"></i> ${totalMin} min</span>
      <span><i class="fas fa-users"></i> ${toInt(recipe.servings) || 1} servings</span>
      <span class="recipe-badge">${escapeHtml(recipe.difficulty || 'Easy')}</span>
    `;

        // Wire buttons (from HTML)
        const viewBtn = node.querySelector('[data-action="view"]');
        const editBtn = node.querySelector('[data-action="edit"]');
        const deleteBtn = node.querySelector('[data-action="delete"]');
        
        viewBtn.addEventListener('click', () => viewRecipe(recipe.id));
        editBtn.addEventListener('click', () => editRecipe(recipe.id));
        deleteBtn.addEventListener('click', () => confirmDelete(recipe.id));
        
        // Check user role and hide edit/delete for regular users
        const current = getCurrent();
        if (!current || (current.role !== 'admin' && current.role !== 'superadmin')) {
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        } else {
            // Ensure buttons are visible for admins
            editBtn.style.display = 'inline-flex';
            deleteBtn.style.display = 'inline-flex';
        }

        list.appendChild(node);
    });
}

/* ---------------- VIEW ---------------- */
function viewRecipe(id) {
    const recipe = recipes.find(r => String(r.id) === String(id));
    if (!recipe) return;

    const viewImg = document.getElementById('view-image');
    if (recipe.image_url) {
        viewImg.src = recipe.image_url;
        viewImg.style.display = 'block';
    } else {
        viewImg.style.display = 'none';
    }
    document.getElementById('view-title').textContent = recipe.title || 'Recipe';
    document.getElementById('view-meta').innerHTML = `
    <span><i class="fas fa-clock"></i> ${(toInt(recipe.prep_time) + toInt(recipe.cook_time)) || 0} min</span>
    <span><i class="fas fa-users"></i> ${toInt(recipe.servings) || 1} servings</span>
    <span><i class="fas fa-signal"></i> ${escapeHtml(recipe.difficulty || 'Easy')}</span>
    <span><i class="fas fa-globe"></i> ${escapeHtml(recipe.cuisine_type || '–')}</span>
  `;
    document.getElementById('view-ingredients').innerHTML =
        (recipe.ingredients || '').split(',').map(i => `<li><i class="fas fa-check"></i> ${escapeHtml(i.trim())}</li>`).join('') || '<li>—</li>';
    document.getElementById('view-instructions').innerHTML =
        (recipe.instructions || '').split('\n').map(s => `<li>${escapeHtml(s.replace(/^\d+\.\s*/, ''))}</li>`).join('') || '<li>—</li>';

    openModal('view-modal');
}

/* ---------------- EDIT ---------------- */
function editRecipe(id) {
    const recipe = recipes.find(r => String(r.id) === String(id));
    if (!recipe) return;

    // Set editing mode
    window.setEditMode(id);

    // Fill form with recipe data
    document.getElementById('title').value = recipe.title || '';
    document.getElementById('image_url').value = recipe.image_url || '';
    document.getElementById('ingredients').value = recipe.ingredients || '';
    document.getElementById('instructions').value = recipe.instructions || '';
    document.getElementById('prep_time').value = recipe.prep_time || 0;
    document.getElementById('cook_time').value = recipe.cook_time || 0;
    document.getElementById('servings').value = recipe.servings || 1;
    document.getElementById('difficulty').value = recipe.difficulty || 'Easy';
    document.getElementById('cuisine_type').value = recipe.cuisine_type || '';

    // Update UI
    document.getElementById('form-title').textContent = 'Edit Recipe';
    document.getElementById('save-recipe').innerHTML = '<i class="fas fa-save"></i> Update';
    
    openModal('add-modal');
}

/* ---------------- DELETE (with confirmation) ---------------- */
function confirmDelete(id) {
    const modal = document.createElement('div');
    modal.className = 'confirm-overlay';
    modal.innerHTML = `
    <div class="confirm-box">
      <h3>Confirm Deletion</h3>
      <p>Are you sure you want to delete this recipe? This action cannot be undone.</p>
      <div class="confirm-buttons">
        <button id="confirmYes" class="btn btn-danger"><i class="fas fa-trash"></i> Delete</button>
        <button id="confirmNo" class="btn btn-cancel">Cancel</button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    modal.querySelector('#confirmNo').onclick = () => modal.remove();
    modal.querySelector('#confirmYes').onclick = async () => {
        modal.remove();
        await deleteRecipe(id);
    };
}

async function deleteRecipe(id) {
    try {
        // Delete from API/Database
        await apiDeleteRecipe(id);
        recipes = recipes.filter(r => r.id !== id);
        filteredRecipes = filteredRecipes.filter(r => r.id !== id);
        renderRecipes();
        notify('Recipe deleted successfully! 🗑️', 'success');
    } catch (err) {
        // Fallback to local delete if API fails
        console.log('API not available, deleting locally');
        recipes = recipes.filter(r => r.id !== id);
        filteredRecipes = filteredRecipes.filter(r => r.id !== id);
        saveRecipesToStorage();
        renderRecipes();
        notify('Recipe deleted locally (backend not available)', 'info');
    }
}

/* ---------------- ADMIN MANAGEMENT ---------------- */
function initAdminManagement() {
    const current = getCurrent();
    console.log('initAdminManagement - Current user:', current);
    if (current && current.role === 'superadmin') {
        console.log('Showing admin management for super admin');
        showAdminManagementSection();
        loadAdminList();
    } else {
        console.log('Not showing admin management - role:', current?.role);
    }
}

let cachedAdmins = [];

async function loadAdminList() {
    try {
        // Load from database via API
        const response = await fetch(`${API_BASE}/admin.php`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            cachedAdmins = data;
            renderAdminList();
            console.log('Loaded admins from database:', data.length);
        }
    } catch (err) {
        // Fallback to localStorage
        console.log('API not available, loading admins from localStorage');
        const users = getStoredUsers();
        cachedAdmins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');
        renderAdminList();
    }
}

function showAdminManagementSection() {
    const section = document.getElementById('admin-management-section');
    console.log('showAdminManagementSection - Section found:', !!section);
    if (section) {
        section.style.display = 'block';
        console.log('Admin management section displayed');
    }
}

function renderAdminList() {
    const list = document.getElementById('admin-list');
    if (!list) return;
    
    const admins = cachedAdmins;
    
    list.innerHTML = '';
    
    if (admins.length === 0) {
        list.innerHTML = '<div class="no-admins"><i class="fas fa-user-shield"></i><p>No admins found</p></div>';
        return;
    }
    
    admins.forEach(admin => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        
        const isSuperAdmin = admin.role === 'superadmin' || admin.isSuperAdmin;
        const badge = isSuperAdmin ? 
            '<span class="role-badge super">👑 Super Admin</span>' : 
            '<span class="role-badge">🔐 Admin</span>';
        
        card.innerHTML = `
            <div class="admin-info">
                <div class="admin-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="admin-details">
                    <h3>${escapeHtml(admin.name)}</h3>
                    <p class="admin-username">@${escapeHtml(admin.email)}</p>
                    ${badge}
                </div>
            </div>
            <div class="admin-actions">
                ${!isSuperAdmin ? `
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${admin.id}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                ` : '<span class="protected-badge"><i class="fas fa-shield-alt"></i> Protected</span>'}
            </div>
        `;
        
        if (!isSuperAdmin) {
            const deleteBtn = card.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', () => confirmDeleteAdmin(admin.id, admin.name));
        }
        
        list.appendChild(card);
    });
}

function confirmDeleteAdmin(id, name) {
    const modal = document.createElement('div');
    modal.className = 'confirm-overlay';
    modal.innerHTML = `
        <div class="confirm-box">
            <div class="confirm-icon warning">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Remove Admin</h3>
            <p>Are you sure you want to remove admin <strong>"${escapeHtml(name)}"</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
            <div class="confirm-buttons">
                <button id="confirmDeleteAdmin" class="btn btn-danger">
                    <i class="fas fa-trash"></i> Remove Admin
                </button>
                <button id="cancelDeleteAdmin" class="btn btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#cancelDeleteAdmin').onclick = () => modal.remove();
    modal.querySelector('#confirmDeleteAdmin').onclick = () => {
        modal.remove();
        deleteAdmin(id, name);
    };
}

async function deleteAdmin(id, name) {
    try {
        // Delete from database via API
        const response = await fetch(`${API_BASE}/admin.php?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Admin deleted from database');
            await loadAdminList();
            notify(`Admin "${name}" removed successfully.`, 'success');
        } else {
            notify(data.message || 'Failed to delete admin', 'error');
        }
    } catch (err) {
        // Fallback to localStorage
        console.log('API not available, deleting from localStorage');
        let users = getStoredUsers();
        const admin = users.find(u => u.id === id);
        
        // Double check it's not super admin
        if (admin && (admin.role === 'superadmin' || admin.isSuperAdmin)) {
            notify('Cannot delete Super Admin!', 'error');
            return;
        }
        
        users = users.filter(u => u.id !== id);
        setStoredUsers(users);
        await loadAdminList();
        notify(`Admin "${name}" removed successfully (locally).`, 'success');
    }
}

/* ---------------- RECIPE SUGGESTIONS ---------------- */
const SUGGESTIONS_KEY = 'rm_suggestions';

function initSuggestions() {
    const current = getCurrent();
    if (current && (current.role === 'admin' || current.role === 'superadmin')) {
        showSuggestionsSection();
        loadSuggestions();
    }
}

let cachedSuggestions = [];

function getSuggestions() {
    return cachedSuggestions;
}

async function loadSuggestions() {
    try {
        // Load from database via API
        const response = await fetch(`${API_BASE}/suggestions.php?status=pending`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            cachedSuggestions = data;
            renderSuggestions();
            console.log('Loaded suggestions from database:', data.length);
        }
    } catch (err) {
        // Fallback to localStorage
        console.log('API not available, loading suggestions from localStorage');
        try {
            const raw = localStorage.getItem(SUGGESTIONS_KEY);
            cachedSuggestions = raw ? JSON.parse(raw) : [];
            renderSuggestions();
        } catch {
            cachedSuggestions = [];
        }
    }
}

async function saveSuggestion(suggestion) {
    const current = getCurrent();
    
    const newSuggestion = {
        title: suggestion.title,
        image_url: suggestion.image_url || '',
        ingredients: suggestion.ingredients,
        instructions: suggestion.instructions,
        prep_time: suggestion.prep_time || 0,
        cook_time: suggestion.cook_time || 0,
        servings: suggestion.servings || 1,
        difficulty: suggestion.difficulty || 'Easy',
        cuisine_type: suggestion.cuisine_type || '',
        notes: suggestion.notes || '',
        submitted_by: current ? current.id : null,
        submitted_by_name: current ? current.name : 'Anonymous'
    };
    
    try {
        // Save to database via API
        const response = await fetch(`${API_BASE}/suggestions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSuggestion)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Suggestion saved to database');
        } else {
            throw new Error('Failed to save suggestion');
        }
    } catch (err) {
        // Fallback to localStorage
        console.log('API not available, saving suggestion locally');
        const suggestions = getSuggestions();
        const localSuggestion = {
            id: 's_' + Date.now(),
            ...newSuggestion,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };
        suggestions.push(localSuggestion);
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
    }
    
    // Update count if admin is viewing
    if (current && (current.role === 'admin' || current.role === 'superadmin')) {
        await loadSuggestions();
    }
}

function showSuggestionsSection() {
    const section = document.getElementById('suggestions-section');
    if (section) {
        section.style.display = 'block';
        
        const toggleBtn = document.getElementById('toggle-suggestions');
        const list = document.getElementById('suggestions-list');
        
        // Ensure list is hidden initially
        list.style.display = 'none';
        
        // Remove any existing listeners to prevent duplicates
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        newToggleBtn.addEventListener('click', () => {
            const icon = newToggleBtn.querySelector('i');
            const text = newToggleBtn.querySelector('span');
            
            if (list.style.display === 'none' || list.style.display === '') {
                list.style.display = 'grid';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
                text.textContent = 'Hide Suggestions';
            } else {
                list.style.display = 'none';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
                text.textContent = 'Show Suggestions';
            }
        });
    }
}

function renderSuggestions() {
    const suggestions = getSuggestions().filter(s => s.status === 'pending');
    const countBadge = document.getElementById('suggestion-count');
    const list = document.getElementById('suggestions-list');
    
    if (!list) return;
    
    countBadge.textContent = suggestions.length;
    list.innerHTML = '';
    
    if (suggestions.length === 0) {
        list.innerHTML = '<div class="no-suggestions"><i class="fas fa-inbox"></i><p>No pending suggestions</p></div>';
        return;
    }
    
    suggestions.forEach(suggestion => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.innerHTML = `
            <div class="suggestion-header">
                <h3><i class="fas fa-utensils"></i> ${escapeHtml(suggestion.title)}</h3>
                <span class="suggestion-meta">by ${escapeHtml(suggestion.submittedBy)}</span>
            </div>
            <div class="suggestion-body">
                <p><strong>Ingredients:</strong> ${escapeHtml(suggestion.ingredients)}</p>
                <p><strong>Instructions:</strong> ${escapeHtml(suggestion.instructions.substring(0, 100))}...</p>
                <div class="suggestion-details">
                    <span><i class="fas fa-clock"></i> ${toInt(suggestion.prep_time) + toInt(suggestion.cook_time)} min</span>
                    <span><i class="fas fa-signal"></i> ${escapeHtml(suggestion.difficulty)}</span>
                    <span><i class="fas fa-globe"></i> ${escapeHtml(suggestion.cuisine_type || 'N/A')}</span>
                </div>
            </div>
            <div class="suggestion-actions">
                <button class="btn btn-success" data-action="approve" data-id="${suggestion.id}">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-secondary" data-action="view" data-id="${suggestion.id}">
                    <i class="fas fa-eye"></i> View Full
                </button>
                <button class="btn btn-danger" data-action="reject" data-id="${suggestion.id}">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        `;
        
        // Add event listeners
        const approveBtn = card.querySelector('[data-action="approve"]');
        const viewBtn = card.querySelector('[data-action="view"]');
        const rejectBtn = card.querySelector('[data-action="reject"]');
        
        approveBtn.addEventListener('click', () => approveSuggestion(suggestion.id));
        viewBtn.addEventListener('click', () => viewSuggestionDetails(suggestion.id));
        rejectBtn.addEventListener('click', () => rejectSuggestion(suggestion.id));
        
        list.appendChild(card);
    });
}

function viewSuggestionDetails(id) {
    const suggestions = getSuggestions();
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;
    
    // Show in view modal
    const viewImg = document.getElementById('view-image');
    if (suggestion.image_url) {
        viewImg.src = suggestion.image_url;
        viewImg.style.display = 'block';
    } else {
        viewImg.style.display = 'none';
    }
    document.getElementById('view-title').textContent = suggestion.title || 'Recipe';
    document.getElementById('view-meta').innerHTML = `
        <span><i class="fas fa-clock"></i> ${(toInt(suggestion.prep_time) + toInt(suggestion.cook_time)) || 0} min</span>
        <span><i class="fas fa-users"></i> ${toInt(suggestion.servings) || 1} servings</span>
        <span><i class="fas fa-signal"></i> ${escapeHtml(suggestion.difficulty || 'Easy')}</span>
        <span><i class="fas fa-globe"></i> ${escapeHtml(suggestion.cuisine_type || '–')}</span>
        <span><i class="fas fa-user"></i> Suggested by ${escapeHtml(suggestion.submittedBy)}</span>
    `;
    document.getElementById('view-ingredients').innerHTML =
        (suggestion.ingredients || '').split(',').map(i => `<li><i class="fas fa-check"></i> ${escapeHtml(i.trim())}</li>`).join('') || '<li>—</li>';
    document.getElementById('view-instructions').innerHTML =
        (suggestion.instructions || '').split('\n').map(s => `<li>${escapeHtml(s.replace(/^\d+\.\s*/, ''))}</li>`).join('') || '<li>—</li>';
    
    openModal('view-modal');
}

async function approveSuggestion(id) {
    const suggestions = getSuggestions();
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) {
        notify('Suggestion not found', 'error');
        return;
    }
    
    // Add to recipes
    const newRecipe = {
        title: suggestion.title,
        image_url: suggestion.image_url || '',
        ingredients: suggestion.ingredients,
        instructions: suggestion.instructions,
        prep_time: suggestion.prep_time || 0,
        cook_time: suggestion.cook_time || 0,
        servings: suggestion.servings || 1,
        difficulty: suggestion.difficulty || 'Easy',
        cuisine_type: suggestion.cuisine_type || ''
    };
    
    try {
        // Add recipe to database
        const row = await apiAddRecipe(newRecipe);
        recipes.push(row);
        
        // Update suggestion status in database
        await fetch(`${API_BASE}/suggestions.php?id=${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });
        
        console.log('Suggestion approved in database');
    } catch (err) {
        // Fallback to local storage if API fails
        console.log('API not available, using local storage');
        newRecipe.id = Date.now();
        recipes.push(newRecipe);
        
        // Mark as approved in localStorage
        suggestion.status = 'approved';
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
    }
    
    filteredRecipes = [...recipes];
    renderRecipes();
    
    await loadSuggestions();
    notify('Recipe approved and added! ✅', 'success');
}

async function rejectSuggestion(id) {
    if (!confirm('Are you sure you want to reject this suggestion?')) return;
    
    try {
        // Update suggestion status in database
        const response = await fetch(`${API_BASE}/suggestions.php?id=${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Suggestion rejected in database');
        }
    } catch (err) {
        // Fallback to localStorage
        console.log('API not available, using local storage');
        const suggestions = getSuggestions();
        const suggestion = suggestions.find(s => s.id === id);
        if (suggestion) {
            suggestion.status = 'rejected';
            localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
        }
    }
    
    await loadSuggestions();
    notify('Suggestion rejected', 'info');
}

/* ---------------- HELPERS ---------------- */
function collectForm() {
    const get = id => document.getElementById(id).value.trim();
    return {
        title: get('title'),
        image_url: get('image_url'),
        ingredients: get('ingredients'),
        instructions: get('instructions'),
        prep_time: toInt(get('prep_time')),
        cook_time: toInt(get('cook_time')),
        servings: toInt(get('servings')) || 1,
        difficulty: document.getElementById('difficulty').value,
        cuisine_type: get('cuisine_type')
    };
}

function collectSuggestionForm() {
    const get = id => document.getElementById(id).value.trim();
    return {
        title: get('suggest_title'),
        image_url: get('suggest_image_url'),
        ingredients: get('suggest_ingredients'),
        instructions: get('suggest_instructions'),
        prep_time: toInt(get('suggest_prep_time')),
        cook_time: toInt(get('suggest_cook_time')),
        servings: toInt(get('suggest_servings')) || 1,
        difficulty: document.getElementById('suggest_difficulty').value,
        cuisine_type: get('suggest_cuisine_type'),
        notes: get('suggest_notes')
    };
}
function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');

    // Disable theme toggle while a modal is open
    const toggle = document.getElementById('theme-toggle');
    if (toggle) { toggle.style.pointerEvents = 'none'; toggle.style.opacity = '0.5'; toggle.style.transition = 'opacity 0.3s ease'; }
}
function closeAllModals() {
    document.querySelectorAll('.modal.open').forEach(m => {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
    });

    // Re-enable theme toggle
    const toggle = document.getElementById('theme-toggle');
    if (toggle) { toggle.style.pointerEvents = 'auto'; toggle.style.opacity = '1'; }
}
function toInt(v) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; }
function escapeHtml(str = '') { return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s])); }
function notify(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `notification notification-${type}`;
    el.style.cssText = 'position:fixed;top:20px;right:20px;padding:14px 20px;border-radius:16px;font-weight:600;z-index:10000;min-width:250px;';
    
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
                 type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
                 '<i class="fas fa-info-circle"></i>';
    
    el.innerHTML = `${icon} <span>${message}</span>`;
    el.style.background = type === 'success' ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 
                          type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                          'linear-gradient(135deg, #3b82f6, #2563eb)';
    el.style.color = '#fff';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '10px';
    el.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
    
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100px)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function showLoading(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<span class="loading-spinner"></span> Loading...';
    button.disabled = true;
    return () => {
        button.innerHTML = originalHTML;
        button.disabled = false;
    };
}

/* ---------------- CONFIRMATION STYLES (injected) ---------------- */
const confirmStyle = document.createElement('style');
confirmStyle.textContent = `
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 5000; animation: fadeIn 0.3s ease;
}
.confirm-box {
  background: var(--panel); color: var(--text);
  padding: 24px; border-radius: 16px; box-shadow: var(--shadow-lg);
  width: min(90%, 380px); text-align: center; animation: popIn 0.3s ease;
}
.confirm-box h3 { margin-bottom: 10px; }
.confirm-box p { color: var(--muted); margin-bottom: 18px; }
.confirm-buttons { display: flex; justify-content: center; gap: 12px; }
.btn-danger {
  background: linear-gradient(90deg, #ef4444, #dc2626); color: #fff;
  border: none; padding: 10px 16px; border-radius: 10px; font-weight: 600;
}
.btn-cancel {
  background: var(--panel-2); color: var(--text);
  border: 1px solid var(--border); padding: 10px 16px; border-radius: 10px; font-weight: 600;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;
document.head.appendChild(confirmStyle);
