/* =============================================
   WAVEON - auth.js
   세션 · 로그인 · 회원가입 · 헤더 UI 관리
   ============================================= */

// ---- 데모 계정 ----
const DEMO_ACCOUNT = {
  id: 9999,
  username: 'demo_waveon',
  email: 'demo@waveon.com',
  display_name: '웨이브온 데모',
  preferred_genres: ['애니메이션', '판타지', '액션', '로맨스'],
  created_at: '2026-01-01T00:00:00Z',
  is_demo: true,
};
const DEMO_PASSWORD = 'demo1234';

const SESSION_KEY   = 'waveon_session';
const USERS_KEY     = 'waveon_users';
const MYLIST_KEY    = 'waveon_mylist';
const RECENT_KEY    = 'waveon_recent';

/* =============================================
   세션 헬퍼
   ============================================= */
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function isLoggedIn() { return !!getCurrentUser(); }

/* =============================================
   로그인
   ============================================= */
function login(email, password) {
  const emailTrim = (email || '').trim().toLowerCase();

  // 데모 계정
  if (emailTrim === DEMO_ACCOUNT.email && password === DEMO_PASSWORD) {
    setSession(DEMO_ACCOUNT);
    return { success: true, user: DEMO_ACCOUNT };
  }

  // 로컬 가입 계정
  const users = getLocalUsers();
  const found = users.find(u => u.email === emailTrim && u.password === password);
  if (found) {
    const session = { ...found };
    delete session.password;
    setSession(session);
    return { success: true, user: session };
  }

  return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
}

function loginAsDemo() {
  setSession(DEMO_ACCOUNT);
  return DEMO_ACCOUNT;
}

/* =============================================
   회원가입 (로컬 저장)
   ============================================= */
function signup(username, email, password, displayName) {
  const emailTrim = (email || '').trim().toLowerCase();
  const usernameTrim = (username || '').trim();
  const displayTrim = (displayName || '').trim() || usernameTrim;

  if (!usernameTrim || !emailTrim || !password) {
    return { success: false, error: '모든 필드를 입력해주세요.' };
  }
  if (password.length < 6) {
    return { success: false, error: '비밀번호는 6자 이상이어야 합니다.' };
  }

  const users = getLocalUsers();
  if (emailTrim === DEMO_ACCOUNT.email || users.find(u => u.email === emailTrim)) {
    return { success: false, error: '이미 사용 중인 이메일입니다.' };
  }
  if (users.find(u => u.username === usernameTrim)) {
    return { success: false, error: '이미 사용 중인 사용자명입니다.' };
  }

  const newUser = {
    id: Date.now(),
    username: usernameTrim,
    email: emailTrim,
    password,
    display_name: displayTrim,
    preferred_genres: [],
    created_at: new Date().toISOString(),
    is_demo: false,
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const session = { ...newUser };
  delete session.password;
  setSession(session);

  return { success: true, user: session };
}

/* =============================================
   로그아웃
   ============================================= */
function logout() {
  localStorage.removeItem(SESSION_KEY);
  // 마이페이지에서 로그아웃 시 홈으로
  if (window.location.pathname.includes('mypage')) {
    window.location.href = 'index.html';
  } else {
    updateHeaderAuth();
  }
}

/* =============================================
   프로필 업데이트 (로컬)
   ============================================= */
function updateProfile(fields) {
  const user = getCurrentUser();
  if (!user || user.is_demo) return { success: false, error: '데모 계정은 정보를 변경할 수 없습니다.' };

  const updated = { ...user, ...fields };
  setSession(updated);

  // 로컬 유저 목록도 업데이트
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...fields };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  return { success: true, user: updated };
}

/* =============================================
   최근 시청 기록 (로컬)
   ============================================= */
function addRecentView(contentId) {
  let recent = getRecentViews();
  recent = [contentId, ...recent.filter(id => id !== contentId)].slice(0, 10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

function getRecentViews() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

/* =============================================
   로컬 유저 목록 헬퍼
   ============================================= */
function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

/* =============================================
   헤더 UI 업데이트 (index.html + mypage.html 공통)
   ============================================= */
function updateHeaderAuth() {
  const user = getCurrentUser();

  const loginBtn    = document.getElementById('header-login-btn');
  const userSection = document.getElementById('header-user-section');
  const avatarEl    = document.getElementById('header-avatar');
  const userNameEl  = document.getElementById('header-user-name');
  const mobileLoginLi = document.getElementById('mobile-login-li');
  const mobileUserLi  = document.getElementById('mobile-user-li');
  const mobileName    = document.getElementById('mobile-user-name');

  if (!loginBtn) return;

  if (user) {
    loginBtn.style.display    = 'none';
    if (userSection) userSection.style.display = 'flex';
    const initial = (user.display_name || user.username || '?')[0].toUpperCase();
    if (avatarEl)   avatarEl.textContent   = initial;
    if (userNameEl) userNameEl.textContent = user.display_name || user.username;
    if (mobileLoginLi) mobileLoginLi.style.display = 'none';
    if (mobileUserLi)  mobileUserLi.style.display  = 'flex';
    if (mobileName)    mobileName.textContent = user.display_name || user.username;
  } else {
    loginBtn.style.display    = 'flex';
    if (userSection) userSection.style.display = 'none';
    if (mobileLoginLi) mobileLoginLi.style.display = 'flex';
    if (mobileUserLi)  mobileUserLi.style.display  = 'none';
  }
}

/* =============================================
   로그인 모달 열기/닫기 (index.html에서 사용)
   ============================================= */
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  clearAuthForms();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab)
  );
  document.querySelectorAll('.auth-form').forEach(f =>
    f.classList.toggle('active', f.id === `${tab}-form`)
  );
}

function clearAuthForms() {
  document.querySelectorAll('.auth-form input').forEach(i => i.value = '');
  document.querySelectorAll('.auth-error').forEach(e => e.textContent = '');
}

/* =============================================
   로그인 폼 제출
   ============================================= */
function handleLoginSubmit(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;
  const errorEl  = document.getElementById('login-error');

  const result = login(email, password);
  if (result.success) {
    closeAuthModal();
    updateHeaderAuth();
    showAuthToast(`환영합니다, ${result.user.display_name || result.user.username}님!`);
  } else {
    if (errorEl) errorEl.textContent = result.error;
  }
}

function handleDemoLogin() {
  const user = loginAsDemo();
  closeAuthModal();
  updateHeaderAuth();
  showAuthToast(`데모 계정으로 로그인됐습니다. 환영합니다!`);
}

/* =============================================
   회원가입 폼 제출
   ============================================= */
function handleSignupSubmit(e) {
  e.preventDefault();
  const username    = document.getElementById('signup-username')?.value;
  const email       = document.getElementById('signup-email')?.value;
  const password    = document.getElementById('signup-password')?.value;
  const displayName = document.getElementById('signup-display')?.value;
  const errorEl     = document.getElementById('signup-error');

  const result = signup(username, email, password, displayName);
  if (result.success) {
    closeAuthModal();
    updateHeaderAuth();
    showAuthToast(`회원가입 완료! 환영합니다, ${result.user.display_name}님!`);
  } else {
    if (errorEl) errorEl.textContent = result.error;
  }
}

/* =============================================
   토스트 (auth 전용 — script.js의 showToast와 동일 로직)
   ============================================= */
let _authToastTimer = null;
function showAuthToast(msg) {
  let t = document.getElementById('waveon-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'waveon-toast';
    Object.assign(t.style, {
      position: 'fixed', bottom: '80px', left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
      color: '#fff', padding: '12px 24px', borderRadius: '999px',
      fontSize: '0.9rem', fontWeight: '600', zIndex: '9999',
      opacity: '0', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
      boxShadow: '0 8px 30px rgba(124,58,237,0.4)', pointerEvents: 'none',
      fontFamily: 'Noto Sans KR, sans-serif',
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(_authToastTimer);
  _authToastTimer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}
