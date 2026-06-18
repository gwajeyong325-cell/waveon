/* =============================================
   WAVEON - mypage.js
   마이페이지 전용 로직
   ============================================= */

const SUPABASE_URL = 'https://rbvkexfqhsjvvnwnqkyk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidmtleGZxaHNqdnZud25xa3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjk4NjQsImV4cCI6MjA5NzMwNTg2NH0.NHdQgKeDkNUzX2FqRUDGUgPLaRvvp_F2Kyrkf_-q5GA';

const ALL_GENRES = ['액션', '로맨스', '판타지', '드라마', '코미디', '스릴러', 'SF', '호러', '다크 판타지', '모험', '일상', '청춘'];

let allContentCache = {};
let selectedGenres = [];

/* =============================================
   초기화
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user) {
    // 비로그인 → 홈으로 (로그인 모달 열림 표시)
    window.location.href = 'index.html?auth=login';
    return;
  }

  updateHeaderAuth();
  initHamburger();
  renderProfileHero(user);
  initTabs();
  loadMyList();
  loadRecentViews();
  initSettings(user);
});

/* =============================================
   프로필 히어로 렌더링
   ============================================= */
function renderProfileHero(user) {
  const initial = (user.display_name || user.username || '?')[0].toUpperCase();

  document.getElementById('profile-avatar-large').textContent = initial;
  document.getElementById('profile-name').textContent = user.display_name || user.username;
  document.getElementById('profile-email').textContent = user.email;

  // 데모 배지
  if (user.is_demo) {
    document.getElementById('demo-badge').style.display = 'inline-flex';
  }

  // 선호 장르
  const genresEl = document.getElementById('profile-genres');
  const genres = user.preferred_genres || [];
  genresEl.innerHTML = genres.length
    ? genres.map(g => `<span class="genre-pill">${g}</span>`).join('')
    : '<span style="font-size:0.82rem; color:var(--text-muted);">장르를 설정해보세요</span>';

  // 통계
  const myList = JSON.parse(localStorage.getItem(MYLIST_KEY) || '[]');
  const recentViews = getRecentViews();
  document.getElementById('stat-mylist').textContent = myList.length;
  document.getElementById('stat-recent').textContent = recentViews.length;

  const joined = user.created_at ? user.created_at.slice(0, 7) : '-';
  document.getElementById('stat-joined').textContent = joined;

  // 배경 이미지: 내 리스트 첫 번째 콘텐츠 배너
  if (myList.length > 0) {
    fetchContentsByIds(myList.slice(0, 1)).then(contents => {
      if (contents[0]?.banner_url) {
        document.getElementById('profile-hero-bg').style.backgroundImage = `url('${contents[0].banner_url}')`;
      }
    });
  }
}

/* =============================================
   Supabase 데이터 로드
   ============================================= */
async function fetchContentsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  try {
    const query = ids.map(id => `id.eq.${id}`).join(',');
    const url = `${SUPABASE_URL}/rest/v1/contents?or=(${query})`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const data = await res.json();
    data.forEach(c => { allContentCache[c.id] = c; });
    // ids 순서 유지
    return ids.map(id => data.find(c => c.id === id)).filter(Boolean);
  } catch {
    return getFallbackContents(ids);
  }
}

function getFallbackContents(ids) {
  const FALLBACK = [
    { id:1, title:'귀멸의 칼날: 무한열차편', genre:'액션/판타지', content_type:'animation', rating:9.3, thumbnail_url:'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/VpOd_0pxOlM' },
    { id:2, title:'주술회전 시즌2', genre:'액션/다크 판타지', content_type:'animation', rating:9.1, thumbnail_url:'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/ByXuk9QqQkk' },
    { id:3, title:'나루토 질풍전', genre:'액션/모험', content_type:'animation', rating:8.7, thumbnail_url:'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&h=900&fit=crop', trailer_url:'' },
    { id:4, title:'진격의 거인 파이널', genre:'다크 판타지', content_type:'animation', rating:9.5, thumbnail_url:'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/MGRm4IzK1SQ' },
    { id:5, title:'너의 이름은.', genre:'로맨스/판타지', content_type:'movie', rating:8.9, thumbnail_url:'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/xU47nhruN-Q' },
  ];
  return ids.map(id => FALLBACK.find(c => c.id === id)).filter(Boolean);
}

/* =============================================
   내 리스트 렌더링
   ============================================= */
async function loadMyList() {
  const myList = JSON.parse(localStorage.getItem(MYLIST_KEY) || '[]');
  const grid = document.getElementById('mylist-grid');
  const emptyEl = document.getElementById('mylist-empty');
  const countEl = document.getElementById('mylist-count-text');

  if (myList.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
    countEl.textContent = '아직 저장된 콘텐츠가 없어요.';
    return;
  }

  countEl.textContent = `총 ${myList.length}개의 콘텐츠가 저장되어 있습니다.`;
  grid.innerHTML = '<div class="mypage-empty" style="display:flex; padding:40px; grid-column:1/-1;"><div style="font-size:1.5rem">⏳</div><h3 style="font-size:1rem;">불러오는 중...</h3></div>';

  const contents = await fetchContentsByIds(myList);

  if (contents.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
    return;
  }

  grid.innerHTML = contents.map(c => renderMpCard(c, 'mylist')).join('');

  // 통계 업데이트
  document.getElementById('stat-mylist').textContent = contents.length;
}

function removeFromMyList(contentId) {
  let myList = JSON.parse(localStorage.getItem(MYLIST_KEY) || '[]');
  myList = myList.filter(id => id !== contentId);
  localStorage.setItem(MYLIST_KEY, JSON.stringify(myList));
  showAuthToast('리스트에서 제거했습니다.');
  loadMyList();
  document.getElementById('stat-mylist').textContent = myList.length;
}

/* =============================================
   최근 시청 렌더링
   ============================================= */
async function loadRecentViews() {
  const recent = getRecentViews();
  const grid = document.getElementById('recent-grid');
  const emptyEl = document.getElementById('recent-empty');
  const countEl = document.getElementById('recent-count-text');

  if (recent.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
    countEl.textContent = '아직 시청 기록이 없어요.';
    return;
  }

  countEl.textContent = `최근 본 콘텐츠 ${recent.length}개`;
  grid.innerHTML = '<div class="mypage-empty" style="display:flex; padding:40px; grid-column:1/-1;"><div style="font-size:1.5rem">⏳</div><h3 style="font-size:1rem;">불러오는 중...</h3></div>';

  const contents = await fetchContentsByIds(recent);

  if (contents.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
    return;
  }

  grid.innerHTML = contents.map((c, i) => renderMpCard(c, 'recent', i)).join('');
  document.getElementById('stat-recent').textContent = contents.length;
}

/* =============================================
   카드 HTML 생성
   ============================================= */
function renderMpCard(content, type, idx = 0) {
  const typeLabel = { movie: '영화', drama: '드라마', animation: '애니메이션' };
  const removeBtn = type === 'mylist'
    ? `<button class="mp-card-remove" onclick="event.stopPropagation(); removeFromMyList(${content.id})" title="리스트에서 제거">✕</button>`
    : '';
  const recentBadge = type === 'recent'
    ? `<span class="watched-badge">${idx === 0 ? '방금 전' : `${idx}번째 전`}</span>`
    : '';

  return `
    <div class="mp-card" onclick="openMpDetail(${content.id})">
      ${removeBtn}
      ${recentBadge}
      <img src="${content.thumbnail_url}" alt="${content.title}" loading="lazy"
           onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'">
      <div class="mp-card-overlay">
        <button class="card-hover-btn" style="font-size:0.82rem;padding:9px;width:100%;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;border:none;cursor:pointer;" onclick="event.stopPropagation(); openMpDetail(${content.id})">자세히 보기</button>
      </div>
      <div class="mp-card-info">
        <div class="mp-card-title">${content.title}</div>
        <div class="mp-card-meta">${content.genre || '미분류'} · ★ ${content.rating || '-'}</div>
      </div>
    </div>
  `;
}

function openMpDetail(contentId) {
  const content = allContentCache[contentId];
  if (!content) return;
  // 상세 모달은 홈 페이지에 있으므로, 간단한 토스트로 대체
  showAuthToast(`"${content.title}" — ${content.description ? content.description.slice(0,40) + '...' : ''}`);
}

/* =============================================
   탭 초기화
   ============================================= */
function initTabs() {
  document.querySelectorAll('.mypage-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mypage-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.mypage-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`section-${tab.dataset.section}`).classList.add('active');
    });
  });
}

/* =============================================
   계정 설정 초기화
   ============================================= */
function initSettings(user) {
  // 폼에 현재 값 채우기
  const displayEl = document.getElementById('settings-display');
  const usernameEl = document.getElementById('settings-username');
  const emailEl = document.getElementById('settings-email');
  if (displayEl) displayEl.value = user.display_name || '';
  if (usernameEl) usernameEl.value = user.username || '';
  if (emailEl) emailEl.value = user.email || '';

  // 데모 계정이면 폼 비활성화 + 안내
  if (user.is_demo) {
    document.getElementById('demo-settings-notice').style.display = 'flex';
    document.querySelectorAll('#profile-form input, #profile-form button[type="submit"]').forEach(el => {
      el.disabled = true;
      el.style.opacity = '0.4';
    });
  }

  // 선호 장르 태그
  selectedGenres = [...(user.preferred_genres || [])];
  renderGenreTags();
}

function renderGenreTags() {
  const user = getCurrentUser();
  const container = document.getElementById('genre-tags');
  if (!container) return;

  // 데모면 비활성화
  const isDemo = user?.is_demo;

  container.innerHTML = ALL_GENRES.map(g => `
    <button class="genre-tag-btn ${selectedGenres.includes(g) ? 'selected' : ''}"
      onclick="${isDemo ? 'showAuthToast(\'데모 계정은 장르를 변경할 수 없습니다.\')' : `toggleGenre('${g}')`}"
      ${isDemo ? 'style="opacity:0.5; cursor:not-allowed;"' : ''}>
      ${g}
    </button>
  `).join('');
}

function toggleGenre(genre) {
  const idx = selectedGenres.indexOf(genre);
  if (idx === -1) selectedGenres.push(genre);
  else selectedGenres.splice(idx, 1);
  renderGenreTags();
}

/* =============================================
   프로필 업데이트 제출
   ============================================= */
function handleProfileUpdate(e) {
  e.preventDefault();
  const displayName = document.getElementById('settings-display').value.trim();
  const errorEl = document.getElementById('settings-error');
  const successEl = document.getElementById('settings-success');

  if (!displayName) {
    errorEl.textContent = '닉네임을 입력해주세요.';
    return;
  }

  const result = updateProfile({ display_name: displayName });
  if (result.success) {
    errorEl.textContent = '';
    successEl.textContent = '✓ 저장되었습니다!';
    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('header-user-name').textContent = displayName;
    setTimeout(() => { successEl.textContent = ''; }, 3000);
  } else {
    errorEl.textContent = result.error;
  }
}

function handleGenreSave() {
  const user = getCurrentUser();
  if (user?.is_demo) {
    showAuthToast('데모 계정은 정보를 변경할 수 없습니다.');
    return;
  }
  const result = updateProfile({ preferred_genres: selectedGenres });
  if (result.success) {
    showAuthToast('선호 장르가 저장되었습니다!');
    // 프로필 히어로 장르 갱신
    const genresEl = document.getElementById('profile-genres');
    genresEl.innerHTML = selectedGenres.length
      ? selectedGenres.map(g => `<span class="genre-pill">${g}</span>`).join('')
      : '<span style="font-size:0.82rem; color:var(--text-muted);">장르를 설정해보세요</span>';
  }
}

/* =============================================
   내 리스트 초기화
   ============================================= */
function handleClearList() {
  if (!confirm('저장된 모든 리스트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
  localStorage.setItem(MYLIST_KEY, JSON.stringify([]));
  showAuthToast('내 리스트가 초기화되었습니다.');
  loadMyList();
  document.getElementById('stat-mylist').textContent = 0;
}

/* =============================================
   햄버거 (mypage용)
   ============================================= */
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // 모바일 아바타 초기화
  const user = getCurrentUser();
  if (user) {
    const mobileAvatar = document.getElementById('mobile-avatar');
    if (mobileAvatar) mobileAvatar.textContent = (user.display_name || user.username || '?')[0].toUpperCase();
  }
}
