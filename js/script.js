/* =============================================
   WAVEON - script.js
   Supabase 연동 + 전체 인터랙션
   ============================================= */

// ---- Supabase 설정 ----
const SUPABASE_URL = 'https://rbvkexfqhsjvvnwnqkyk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidmtleGZxaHNqdnZud25xa3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjk4NjQsImV4cCI6MjA5NzMwNTg2NH0.NHdQgKeDkNUzX2FqRUDGUgPLaRvvp_F2Kyrkf_-q5GA';

// ---- 전역 상태 ----
let allContents = [];
let featuredContents = [];
let recommendedContents = [];
let currentHeroIndex = 0;
let heroTimer = null;
let myList = JSON.parse(localStorage.getItem('waveon_mylist') || '[]');
let currentActiveContent = null;

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', async () => {
  // auth.js 초기화
  updateHeaderAuth();
  initAuthModal();
  // URL에 ?auth=login 파라미터가 있으면 로그인 모달 자동 오픈
  if (new URLSearchParams(window.location.search).get('auth') === 'login') {
    openAuthModal('login');
  }

  initScrollEffects();
  initHamburger();
  initModals();
  initScrollTopBtn();
  initRecTabs();
  initRecSlider();
  await loadAllContents();
});

/* =============================================
   Supabase API 호출
   ============================================= */
async function supabaseFetch(endpoint, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}${params}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

async function loadAllContents() {
  try {
    allContents = await supabaseFetch('contents', '?order=popularity_rank.asc');
    featuredContents = allContents.filter(c => c.is_featured);
    recommendedContents = allContents.filter(c => c.is_recommended);

    renderHero();
    renderMainContents();
    renderDetailSection();
    renderRecommended('all');
    renderHighlightBanner();
  } catch (err) {
    console.error('콘텐츠 로드 실패, 폴백 데이터 사용:', err);
    renderFallback();
  }
}

/* =============================================
   HERO SECTION
   ============================================= */
function renderHero() {
  if (!featuredContents.length) return;
  updateHeroSlide(0);

  const indicatorsEl = document.getElementById('hero-indicators');
  indicatorsEl.innerHTML = featuredContents.map((_, i) =>
    `<div class="indicator-dot ${i === 0 ? 'active' : ''}" onclick="goToHeroSlide(${i})"></div>`
  ).join('');

  startHeroAutoSlide();
}

function updateHeroSlide(index) {
  const content = featuredContents[index];
  if (!content) return;

  currentHeroIndex = index;
  currentActiveContent = content;

  const bg = document.getElementById('hero-bg');
  bg.style.backgroundImage = `url('${content.banner_url || content.thumbnail_url}')`;
  bg.classList.remove('zooming');
  void bg.offsetWidth;
  bg.classList.add('zooming');

  document.getElementById('hero-title').textContent = content.title;
  document.getElementById('hero-desc').textContent = content.description;

  const typeLabelMap = { movie: '영화', drama: '드라마', animation: '애니메이션' };
  document.getElementById('hero-badges').innerHTML = `
    <span class="badge badge-genre">${content.genre || '장르 미분류'}</span>
    <span class="badge badge-type">${typeLabelMap[content.content_type] || content.content_type}</span>
    ${content.age_rating ? `<span class="badge badge-new">${content.age_rating}</span>` : ''}
  `;

  const metaItems = [];
  if (content.release_date) metaItems.push(`공개일 ${content.release_date.slice(0,7)}`);
  if (content.episode_count) metaItems.push(`총 ${content.episode_count}화`);
  if (content.runtime) metaItems.push(`${content.runtime}분`);
  if (content.rating) metaItems.push(`★ ${content.rating}`);

  document.getElementById('hero-meta').innerHTML = metaItems
    .map(t => `<span class="hero-meta-item">${t}</span>`).join('');

  updateListBtn(content.id);

  document.querySelectorAll('.indicator-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function goToHeroSlide(index) {
  clearTimeout(heroTimer);
  updateHeroSlide(index);
  startHeroAutoSlide();
}

function startHeroAutoSlide() {
  clearTimeout(heroTimer);
  heroTimer = setTimeout(() => {
    const next = (currentHeroIndex + 1) % featuredContents.length;
    updateHeroSlide(next);
    startHeroAutoSlide();
  }, 6000);
}

function updateListBtn(contentId) {
  const btn = document.getElementById('hero-list-btn');
  if (!btn) return;
  const inList = myList.includes(contentId);
  btn.textContent = inList ? '✓ 내 리스트에 있음' : '+ 내 리스트';
  btn.classList.toggle('in-list', inList);
}

/* =============================================
   MAIN CONTENTS
   ============================================= */
function renderMainContents() {
  const grid = document.getElementById('contents-grid');
  if (!allContents.length) return;

  const displayContents = allContents.slice(0, 8);
  const typeLabel = { movie: '영화', drama: '드라마', animation: '애니메이션' };

  grid.innerHTML = displayContents.map((content, idx) => `
    <div class="content-card" onclick="openContentModal(${content.id})" tabindex="0" role="button" aria-label="${content.title} 상세보기">
      <span class="card-rank">${String(idx + 1).padStart(2, '0')}</span>
      <img class="card-img" src="${content.thumbnail_url}" alt="${content.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'">
      <div class="card-overlay">
        <div class="card-hover-actions">
          <button class="card-hover-btn" onclick="event.stopPropagation(); openTrailerModal(${content.id})">▶ 예고편 보기</button>
          <button class="card-hover-btn secondary" onclick="event.stopPropagation(); toggleList(${content.id}, this)">
            ${myList.includes(content.id) ? '✓ 내 리스트에 있음' : '+ 내 리스트 담기'}
          </button>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${content.title}</div>
        <div class="card-meta">
          <span class="card-genre">${content.genre || '미분류'}</span>
          <span class="card-type-tag">${typeLabel[content.content_type] || content.content_type}</span>
          <span class="card-rating">★ ${content.rating || '-'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* =============================================
   DETAIL SECTION
   ============================================= */
function renderDetailSection() {
  const featured = featuredContents[0] || allContents[0];
  if (!featured) return;

  const typeLabel = { movie: '영화', drama: '드라마', animation: '애니메이션' };
  const epInfo = featured.episode_count ? `총 ${featured.episode_count}화` : `${featured.runtime || '?'}분`;

  document.getElementById('detail-card').innerHTML = `
    <div class="detail-poster">
      <img src="${featured.thumbnail_url}" alt="${featured.title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'">
    </div>
    <div class="detail-info">
      <div class="detail-badges">
        <span class="badge badge-genre">${featured.genre || '미분류'}</span>
        <span class="badge badge-type">${typeLabel[featured.content_type] || featured.content_type}</span>
        <span class="badge badge-new">${featured.age_rating || '전체'}</span>
      </div>
      <h2 class="detail-title">${featured.title}</h2>
      <p class="detail-desc">${featured.description}</p>
      <div class="detail-meta-grid">
        <div class="meta-card">
          <div class="meta-card-label">공개일</div>
          <div class="meta-card-value">${featured.release_date ? featured.release_date.slice(0,10) : '-'}</div>
        </div>
        <div class="meta-card">
          <div class="meta-card-label">${featured.episode_count ? '에피소드' : '러닝타임'}</div>
          <div class="meta-card-value">${epInfo}</div>
        </div>
        <div class="meta-card">
          <div class="meta-card-label">평점</div>
          <div class="meta-card-value rating-value">${featured.rating ? `★ ${featured.rating}` : '-'}</div>
        </div>
        <div class="meta-card">
          <div class="meta-card-label">장르</div>
          <div class="meta-card-value" style="font-size:0.88rem">${featured.genre || '-'}</div>
        </div>
        <div class="meta-card">
          <div class="meta-card-label">연령 등급</div>
          <div class="meta-card-value">${featured.age_rating || '전체'}</div>
        </div>
        <div class="meta-card">
          <div class="meta-card-label">인기 순위</div>
          <div class="meta-card-value"># ${featured.popularity_rank || '-'}</div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary btn-lg" onclick="openTrailerModal(${featured.id})">▶ 예고편 보기</button>
        <button class="btn btn-secondary btn-lg" onclick="handleWatchNowContent(${featured.id})">지금 시청하기</button>
        <button class="btn btn-ghost btn-lg" onclick="toggleList(${featured.id}, this)">
          ${myList.includes(featured.id) ? '✓ 내 리스트에 있음' : '+ 내 리스트 담기'}
        </button>
      </div>
    </div>
  `;
}

function renderHighlightBanner() {
  const featured = featuredContents[1] || featuredContents[0] || allContents[0];
  if (!featured) return;

  document.getElementById('highlight-banner').innerHTML = `
    <div class="highlight-banner-bg" style="background-image: url('${featured.banner_url || featured.thumbnail_url}')"></div>
    <div class="highlight-banner-content">
      <div class="highlight-text">
        <h3>지금 화제의 작품 — ${featured.title}</h3>
        <p>${featured.description ? featured.description.slice(0, 80) + '...' : ''}</p>
      </div>
      <button class="btn btn-primary btn-lg" onclick="openContentModal(${featured.id})">자세히 보기</button>
    </div>
  `;
}

/* =============================================
   RECOMMENDED SECTION
   ============================================= */
function renderRecommended(tab) {
  const slider = document.getElementById('rec-slider');
  let list;

  if (tab === 'animation') {
    list = allContents.filter(c => c.content_type === 'animation');
  } else if (tab === 'movie') {
    list = allContents.filter(c => c.content_type === 'movie');
  } else if (tab === 'popular') {
    list = [...allContents].sort((a, b) => (a.popularity_rank || 99) - (b.popularity_rank || 99)).slice(0, 8);
  } else {
    list = recommendedContents;
  }

  if (!list.length) list = allContents.slice(0, 6);

  const reasons = { popular: '인기 급상승', animation: '애니메이션 추천', movie: '영화 추천', all: '맞춤 추천' };

  slider.innerHTML = list.map(content => `
    <div class="rec-card" onclick="openContentModal(${content.id})" tabindex="0" role="button" aria-label="${content.title}">
      <div class="rec-card-img-wrap">
        <img src="${content.thumbnail_url}" alt="${content.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop'">
        <div class="rec-card-hover">
          <span class="rec-hover-reason">${reasons[tab] || '추천'}</span>
          <button class="card-hover-btn" style="font-size:0.8rem;padding:8px" onclick="event.stopPropagation(); openTrailerModal(${content.id})">▶ 예고편</button>
          <button class="card-hover-btn secondary" style="font-size:0.8rem;padding:8px" onclick="event.stopPropagation(); toggleList(${content.id}, this)">
            ${myList.includes(content.id) ? '✓ 내 리스트' : '+ 리스트 담기'}
          </button>
        </div>
      </div>
      <div class="rec-card-body">
        <div class="rec-card-title">${content.title}</div>
        <div class="rec-card-genre">${content.genre || '미분류'} · ★ ${content.rating || '-'}</div>
      </div>
    </div>
  `).join('');
}

/* =============================================
   내 리스트 담기 (토글)
   ============================================= */
function toggleList(contentId, btnEl) {
  const idx = myList.indexOf(contentId);
  if (idx === -1) {
    myList.push(contentId);
    showToast('내 리스트에 담았습니다!');
  } else {
    myList.splice(idx, 1);
    showToast('내 리스트에서 제거했습니다.');
  }
  localStorage.setItem('waveon_mylist', JSON.stringify(myList));

  if (btnEl) {
    const inList = myList.includes(contentId);
    btnEl.textContent = inList ? '✓ 내 리스트에 있음' : '+ 내 리스트 담기';
    btnEl.classList.toggle('in-list', inList);
  }

  updateListBtn(currentActiveContent ? currentActiveContent.id : null);
}

/* =============================================
   예고편 모달
   ============================================= */
function openTrailerModal(contentId) {
  const content = allContents.find(c => c.id === contentId);
  if (!content) return;

  const modal = document.getElementById('trailer-modal');
  const iframe = document.getElementById('trailer-iframe');
  const info = document.getElementById('modal-info');

  let trailerSrc = content.trailer_url || '';
  if (trailerSrc.includes('youtube.com/embed/')) {
    trailerSrc = trailerSrc + '?autoplay=1&mute=0';
  } else if (trailerSrc.includes('youtube.com/watch?v=')) {
    const videoId = trailerSrc.split('v=')[1]?.split('&')[0];
    trailerSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }

  iframe.src = trailerSrc || 'about:blank';
  info.innerHTML = `
    <h3>${content.title}</h3>
    <p>${content.genre || ''} · ${content.age_rating || '전체'} · ★ ${content.rating || '-'}</p>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTrailerModal() {
  const modal = document.getElementById('trailer-modal');
  document.getElementById('trailer-iframe').src = 'about:blank';
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/* =============================================
   콘텐츠 상세 모달
   ============================================= */
function openContentModal(contentId) {
  const content = allContents.find(c => c.id === contentId);
  if (!content) return;

  // 최근 시청 기록 저장 (auth.js의 addRecentView 사용)
  if (typeof addRecentView === 'function') addRecentView(contentId);

  const modal = document.getElementById('content-modal');
  const typeLabel = { movie: '영화', drama: '드라마', animation: '애니메이션' };
  const epInfo = content.episode_count ? `총 ${content.episode_count}화` : `${content.runtime || '?'}분`;

  document.getElementById('content-modal-body').innerHTML = `
    <div class="content-modal-header">
      <img src="${content.banner_url || content.thumbnail_url}" alt="${content.title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=760&h=400&fit=crop'">
      <div class="content-modal-header-overlay"></div>
    </div>
    <div class="content-modal-body">
      <div class="badges">
        <span class="badge badge-genre">${content.genre || '미분류'}</span>
        <span class="badge badge-type">${typeLabel[content.content_type] || content.content_type}</span>
        <span class="badge badge-new">${content.age_rating || '전체'}</span>
      </div>
      <h2>${content.title}</h2>
      <p>${content.description}</p>
      <div class="content-modal-meta">
        <div class="modal-meta-item">
          <span>공개일</span>
          <span>${content.release_date ? content.release_date.slice(0,10) : '-'}</span>
        </div>
        <div class="modal-meta-item">
          <span>${content.episode_count ? '에피소드' : '러닝타임'}</span>
          <span>${epInfo}</span>
        </div>
        <div class="modal-meta-item">
          <span>평점</span>
          <span>★ ${content.rating || '-'}</span>
        </div>
      </div>
      <div class="content-modal-actions">
        <button class="btn btn-primary" onclick="handleWatchNowContent(${content.id})">▶ 지금 시청하기</button>
        <button class="btn btn-secondary" onclick="closeContentModal(); openTrailerModal(${content.id})">예고편 보기</button>
        <button class="btn btn-ghost" onclick="toggleList(${content.id}, this)">
          ${myList.includes(content.id) ? '✓ 내 리스트에 있음' : '+ 내 리스트 담기'}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeContentModal() {
  document.getElementById('content-modal').classList.remove('open');
  document.body.style.overflow = '';
}

/* =============================================
   모달 초기화
   ============================================= */
function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.addEventListener('click', e => {
    if (e.target === modal) closeAuthModal();
  });
}

function initModals() {
  document.getElementById('modal-close-btn').addEventListener('click', closeTrailerModal);
  document.getElementById('content-modal-close').addEventListener('click', closeContentModal);

  document.getElementById('trailer-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTrailerModal();
  });
  document.getElementById('content-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeContentModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTrailerModal(); closeContentModal(); }
  });
}

/* =============================================
   햄버거 메뉴
   ============================================= */
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* =============================================
   스크롤 효과
   ============================================= */
function initScrollEffects() {
  const header = document.getElementById('main-header');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);

    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) current = section.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =============================================
   스크롤 탑 버튼
   ============================================= */
function initScrollTopBtn() {
  const btn = document.getElementById('scroll-top-btn');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* =============================================
   추천 탭
   ============================================= */
function initRecTabs() {
  document.querySelectorAll('.rec-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rec-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderRecommended(tab.dataset.tab);
    });
  });
}

/* =============================================
   추천 슬라이더
   ============================================= */
function initRecSlider() {
  const slider = document.getElementById('rec-slider');
  const CARD_WIDTH = 236;

  document.getElementById('rec-prev').addEventListener('click', () => {
    slider.scrollBy({ left: -CARD_WIDTH * 2, behavior: 'smooth' });
  });
  document.getElementById('rec-next').addEventListener('click', () => {
    slider.scrollBy({ left: CARD_WIDTH * 2, behavior: 'smooth' });
  });
}

/* =============================================
   버튼 핸들러
   ============================================= */
function handleWatchNow() {
  if (currentActiveContent) handleWatchNowContent(currentActiveContent.id);
}

function handleWatchNowContent(contentId) {
  const content = allContents.find(c => c.id === contentId);
  showToast(`"${content ? content.title : '선택한 콘텐츠'}" 재생을 시작합니다!`);
}

function handleTrailer() {
  if (currentActiveContent) openTrailerModal(currentActiveContent.id);
}

function handleAddToList() {
  if (currentActiveContent) toggleList(currentActiveContent.id, document.getElementById('hero-list-btn'));
}

function handleStartBtn() {
  showToast('WAVEON에 오신 것을 환영합니다! 지금 바로 시작해보세요.');
  setTimeout(() => {
    document.getElementById('main-contents').scrollIntoView({ behavior: 'smooth' });
  }, 800);
}

function handlePlanSelect(plan) {
  showToast(`${plan} 플랜을 선택하셨습니다! 회원가입 후 이용 가능합니다.`);
}

function handleFooterLink(label) {
  showToast(`"${label}" 페이지는 준비 중입니다.`);
  return false;
}

function handleSNS(platform) {
  showToast(`WAVEON ${platform} 채널로 이동합니다!`);
  return false;
}

/* =============================================
   토스트 알림
   ============================================= */
let toastTimer = null;

function showToast(message) {
  let toast = document.getElementById('waveon-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'waveon-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '999px',
      fontSize: '0.9rem',
      fontWeight: '600',
      zIndex: '9999',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      whiteSpace: 'nowrap',
      maxWidth: '90vw',
      textAlign: 'center',
      boxShadow: '0 8px 30px rgba(124,58,237,0.4)',
      pointerEvents: 'none',
      fontFamily: 'Noto Sans KR, sans-serif',
    });
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2800);
}

/* =============================================
   폴백 데이터 (DB 연결 실패 시)
   ============================================= */
function renderFallback() {
  allContents = [
    { id:1, title:'귀멸의 칼날: 무한열차편', description:'탄지로 일행이 무한열차에서 벌어지는 악몽에 맞서 싸우는 이야기. 불꽃의 기둥 렌고쿠와 함께하는 숨막히는 전투가 펼쳐진다.', genre:'액션/판타지', content_type:'animation', release_date:'2020-10-16', episode_count:26, runtime:44, age_rating:'15세', thumbnail_url:'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/VpOd_0pxOlM', rating:9.3, popularity_rank:1, is_recommended:true, is_featured:true },
    { id:2, title:'주술회전 시즌2', description:'한층 강해진 주술사들과 더욱 강력한 저주들의 전쟁. 전작을 뛰어넘는 스케일과 연출로 팬들을 열광시킨 시즌2.', genre:'액션/다크 판타지', content_type:'animation', release_date:'2023-07-06', episode_count:23, runtime:24, age_rating:'19세', thumbnail_url:'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/ByXuk9QqQkk', rating:9.1, popularity_rank:2, is_recommended:true, is_featured:true },
    { id:3, title:'나루토 질풍전', description:'세계 최고의 닌자가 되려는 소년 나루토의 성장 이야기. 동료, 스승, 라이벌과 함께 성장하며 수많은 전투를 겪는다.', genre:'액션/모험', content_type:'animation', release_date:'2007-02-15', episode_count:500, runtime:23, age_rating:'12세', thumbnail_url:'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/bhlAqr_NNGE', rating:8.7, popularity_rank:3, is_recommended:false, is_featured:false },
    { id:4, title:'진격의 거인 파이널', description:'자유를 향한 마지막 전쟁. 에렌과 동료들의 운명이 결정되는 최후의 이야기가 펼쳐진다.', genre:'다크 판타지/액션', content_type:'animation', release_date:'2023-03-04', episode_count:12, runtime:24, age_rating:'19세', thumbnail_url:'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/MGRm4IzK1SQ', rating:9.5, popularity_rank:4, is_recommended:true, is_featured:false },
    { id:5, title:'너의 이름은.', description:'도쿄에 사는 소년과 시골 마을의 소녀가 꿈속에서 몸이 뒤바뀌는 현상을 겪으며 이어지는 운명적인 이야기.', genre:'로맨스/판타지', content_type:'movie', release_date:'2016-08-26', episode_count:null, runtime:106, age_rating:'전체', thumbnail_url:'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/xU47nhruN-Q', rating:8.9, popularity_rank:5, is_recommended:true, is_featured:false },
    { id:6, title:'원피스', description:'해적왕을 꿈꾸는 소년 루피와 동료들의 대모험. 30년째 이어지는 장대한 서사와 감동적인 스토리.', genre:'액션/모험', content_type:'animation', release_date:'1999-10-20', episode_count:1100, runtime:24, age_rating:'12세', thumbnail_url:'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1600&h=900&fit=crop', trailer_url:'', rating:9.0, popularity_rank:6, is_recommended:false, is_featured:false },
    { id:7, title:'스파이 패밀리', description:'스파이, 킬러, 초능력자가 한 가족을 이루며 벌어지는 유쾌한 일상 코미디. 아냐의 귀여운 매력이 포인트!', genre:'코미디/액션', content_type:'animation', release_date:'2022-04-09', episode_count:37, runtime:24, age_rating:'12세', thumbnail_url:'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/GBSt2RiCq50', rating:8.5, popularity_rank:7, is_recommended:true, is_featured:false },
    { id:8, title:'체인소 맨', description:'악마 사냥꾼이 되는 꿈을 가진 소년 덴지. 그의 파트너 포치와의 감동적인 이야기와 충격적인 전개.', genre:'액션/다크 판타지', content_type:'animation', release_date:'2022-10-11', episode_count:12, runtime:24, age_rating:'19세', thumbnail_url:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop', banner_url:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&h=900&fit=crop', trailer_url:'https://www.youtube.com/embed/dBqhGJwUYkQ', rating:8.8, popularity_rank:8, is_recommended:true, is_featured:false },
  ];

  featuredContents = allContents.filter(c => c.is_featured);
  recommendedContents = allContents.filter(c => c.is_recommended);

  renderHero();
  renderMainContents();
  renderDetailSection();
  renderRecommended('all');
  renderHighlightBanner();
}
