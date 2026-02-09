/* === Vocabulary Flashcard === */

(async () => {
  const data = await App.loadVocab();

  /* --- Build card list from all vocab data --- */
  const allCards = [];
  const categories = new Map();
  const seen = new Set();

  function catLabel(cat) {
    const map = {
      food: 'Food', drink: 'Drinks', weather: 'Weather',
      activity: 'Activities', person: 'People', thing: 'Things'
    };
    return map[cat] || 'Other';
  }

  function addCard(kr, rom, en, category) {
    if (!kr || seen.has(kr)) return;
    seen.add(kr);
    const card = { kr, rom: rom || '', en: en || '', category };
    allCards.push(card);
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(card);
  }

  /* --- Extract from action data --- */
  const action = data.action || {};

  (action.times || []).forEach(t => addCard(t.kr, t.rom, t.en, 'Time'));

  (action.places || []).forEach(p => addCard(p.kr, p.rom, p.en, 'Places'));

  (action.objects || []).forEach(o => {
    addCard(o.kr, o.rom, o.en, catLabel(o.category));
  });

  (action.verbs || []).forEach(v => {
    addCard(v.present, v.presentRom, v.en + ' (present)', 'Verbs');
    addCard(v.past, v.pastRom, v.pastEn + ' (past)', 'Verbs');
    addCard(v.future, v.futureRom, v.futureEn + ' (future)', 'Verbs');
  });

  /* --- Extract from describe data --- */
  const desc = data.describe || {};

  (desc.subjects || []).forEach(s => addCard(s.kr, s.rom, s.en, catLabel(s.category)));

  (desc.adjectives || []).forEach(a => addCard(a.kr, a.rom, a.en, 'Adjectives'));

  (desc.adverbs || []).forEach(a => addCard(a.kr, a.rom, a.en, 'Adverbs'));

  /* --- Extra flashcard data from vocab.json --- */
  const fc = data.flashcards || {};
  (fc.categories || []).forEach(cat => {
    (cat.cards || []).forEach(c => addCard(c.kr, c.rom, c.en, cat.name));
  });

  /* --- State --- */
  let currentCards = [...allCards];
  let currentIdx = 0;
  let isFlipped = false;

  /* --- DOM --- */
  const flashcardEl = document.getElementById('flashcard');
  const innerEl = document.getElementById('flashcard-inner');
  const koreanEl = document.getElementById('card-korean');
  const englishEl = document.getElementById('card-english');
  const romEl = document.getElementById('card-romanization');
  const progressEl = document.getElementById('progress');
  const ttsBtn = document.getElementById('card-tts');

  /* --- Build category tabs --- */
  const tabContainer = document.getElementById('category-tabs');
  const catNames = ['All', ...categories.keys()];

  catNames.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (cat === 'All' ? ' active' : '');
    const count = cat === 'All' ? allCards.length : (categories.get(cat) || []).length;
    btn.textContent = cat + ' (' + count + ')';
    btn.addEventListener('click', () => {
      currentCards = cat === 'All' ? [...allCards] : [...(categories.get(cat) || [])];
      currentIdx = 0;
      isFlipped = false;
      tabContainer.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
    tabContainer.appendChild(btn);
  });

  /* --- Render current card --- */
  function render() {
    if (currentCards.length === 0) {
      koreanEl.textContent = 'No cards';
      englishEl.textContent = '';
      romEl.textContent = '';
      progressEl.textContent = '0 / 0';
      return;
    }
    const card = currentCards[currentIdx];
    koreanEl.textContent = card.kr;
    englishEl.textContent = card.en;
    romEl.textContent = card.rom;
    progressEl.textContent = (currentIdx + 1) + ' / ' + currentCards.length;
    innerEl.classList.toggle('flipped', isFlipped);
  }

  /* --- Flip on tap --- */
  flashcardEl.addEventListener('click', (e) => {
    if (e.target === ttsBtn || e.target.closest('#card-tts')) return;
    isFlipped = !isFlipped;
    render();
  });

  /* --- TTS --- */
  ttsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentCards.length > 0) {
      App.speak(currentCards[currentIdx].kr);
    }
  });

  /* --- Navigation --- */
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentCards.length === 0) return;
    currentIdx = (currentIdx - 1 + currentCards.length) % currentCards.length;
    isFlipped = false;
    render();
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    if (currentCards.length === 0) return;
    currentIdx = (currentIdx + 1) % currentCards.length;
    isFlipped = false;
    render();
  });

  /* --- Shuffle --- */
  document.getElementById('shuffle-btn').addEventListener('click', () => {
    for (let i = currentCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentCards[i], currentCards[j]] = [currentCards[j], currentCards[i]];
    }
    currentIdx = 0;
    isFlipped = false;
    render();
  });

  /* --- Keyboard --- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') document.getElementById('prev-btn').click();
    if (e.key === 'ArrowRight') document.getElementById('next-btn').click();
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      isFlipped = !isFlipped;
      render();
    }
  });

  /* --- Touch swipe --- */
  let touchStartX = 0;
  flashcardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  flashcardEl.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) document.getElementById('prev-btn').click();
      else document.getElementById('next-btn').click();
    }
  });

  /* --- Initial render --- */
  render();
})();
