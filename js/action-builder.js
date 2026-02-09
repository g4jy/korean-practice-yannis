/* === Action Sentence Builder === */

(async () => {
  const data = await App.loadVocab();
  const { subjects, times, places, objects, verbs } = data.action;

  const state = {
    subjectIdx: 0,
    timeIdx: 0,
    placeIdx: 0,
    objectIdx: 0,
    verbIdx: 0
  };

  const blocks = {
    subject: document.getElementById('block-subject'),
    time: document.getElementById('block-time'),
    place: document.getElementById('block-place'),
    object: document.getElementById('block-object'),
    verb: document.getElementById('block-verb')
  };

  /* --- Get current tense from time selection --- */
  function currentTense() {
    return times[state.timeIdx].tense || 'present';
  }

  /* --- Get current verb --- */
  function currentVerb() {
    return verbs[state.verbIdx];
  }

  /* --- Filter objects compatible with current verb --- */
  function compatibleObjects() {
    const verb = currentVerb();
    if (!verb.objectTypes || verb.objectTypes.length === 0) return [];
    return objects.filter(o => verb.objectTypes.includes(o.category));
  }

  /* --- Get place particle based on verb --- */
  function placeParticle(place) {
    const verb = currentVerb();
    // Movement verbs (가다, 오다) use 에, action verbs use 에서
    return verb.placeParticle === 'e' ? place.formE : place.formEseo;
  }

  /* --- Get verb conjugation for current tense --- */
  function conjugatedVerb() {
    const verb = currentVerb();
    const tense = currentTense();
    return {
      kr: verb[tense],
      rom: verb[tense + 'Rom'],
      en: verb[tense + 'En'] || verb.en
    };
  }

  /* --- Render a block --- */
  function renderBlock(blockEl, kr, rom, en) {
    blockEl.querySelector('.block-kr').textContent = kr;
    blockEl.querySelector('.block-rom').textContent = rom;
    blockEl.querySelector('.block-en').textContent = en;
  }

  /* --- Update all blocks --- */
  function update() {
    const subj = subjects[state.subjectIdx];
    const time = times[state.timeIdx];
    const place = places[state.placeIdx];
    const verb = currentVerb();
    const conj = conjugatedVerb();
    const compat = compatibleObjects();

    renderBlock(blocks.subject, subj.kr, subj.rom, subj.en);
    renderBlock(blocks.time, time.kr, time.rom, time.en);

    // Place with appropriate particle
    const pForm = placeParticle(place);
    renderBlock(blocks.place, pForm.kr, pForm.rom, place.en);

    // Object (hide if verb takes no object)
    if (compat.length > 0) {
      // Clamp object index
      if (state.objectIdx >= compat.length) state.objectIdx = 0;
      const obj = compat[state.objectIdx];
      const particle = App.particleEulReul(obj.kr);
      renderBlock(blocks.object, obj.kr + particle, obj.rom, obj.en);
      blocks.object.classList.remove('hidden');
    } else {
      blocks.object.classList.add('hidden');
    }

    renderBlock(blocks.verb, conj.kr, conj.rom, conj.en);

    updateSentence();
  }

  /* --- Build and display full sentence --- */
  function updateSentence() {
    const subj = subjects[state.subjectIdx];
    const time = times[state.timeIdx];
    const place = places[state.placeIdx];
    const pForm = placeParticle(place);
    const conj = conjugatedVerb();
    const verb = currentVerb();
    const compat = compatibleObjects();

    let parts = [subj.kr, time.kr, pForm.kr];
    let enParts = [];

    if (compat.length > 0) {
      const obj = compat[state.objectIdx] || compat[0];
      const particle = App.particleEulReul(obj.kr);
      parts.push(obj.kr + particle);
      enParts = [subj.en, time.en + ',', 'at ' + place.en + ',', conj.en, obj.en];
    } else {
      const prep = verb.placeParticle === 'e' ? 'to' : 'at';
      enParts = [subj.en, time.en + ',', conj.en, prep + ' ' + place.en];
    }
    parts.push(conj.kr);

    document.getElementById('full-sentence').textContent = parts.join(' ');
    document.getElementById('translation').textContent = enParts.join(' ');
  }

  /* --- Block click handlers --- */
  blocks.subject.addEventListener('click', () => {
    state.subjectIdx = (state.subjectIdx + 1) % subjects.length;
    App.pulseBlock(blocks.subject);
    update();
  });

  blocks.time.addEventListener('click', () => {
    state.timeIdx = (state.timeIdx + 1) % times.length;
    App.pulseBlock(blocks.time);
    update();
  });

  blocks.place.addEventListener('click', () => {
    state.placeIdx = (state.placeIdx + 1) % places.length;
    App.pulseBlock(blocks.place);
    update();
  });

  blocks.object.addEventListener('click', () => {
    const compat = compatibleObjects();
    if (compat.length === 0) return;
    state.objectIdx = (state.objectIdx + 1) % compat.length;
    App.pulseBlock(blocks.object);
    update();
  });

  blocks.verb.addEventListener('click', () => {
    state.verbIdx = (state.verbIdx + 1) % verbs.length;
    App.pulseBlock(blocks.verb);
    update();
  });

  /* --- Add TTS buttons to blocks --- */
  function addTtsBtn(blockEl) {
    const btn = document.createElement('button');
    btn.className = 'block-tts-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 010 7.07" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.5" stroke-linecap="round"/></svg>';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const kr = blockEl.querySelector('.block-kr').textContent;
      App.speak(kr);
    });
    blockEl.appendChild(btn);
  }

  Object.values(blocks).forEach(addTtsBtn);

  /* --- Speak full sentence --- */
  document.getElementById('speak-btn').addEventListener('click', () => {
    const sentence = document.getElementById('full-sentence').textContent;
    App.speak(sentence);
  });

  /* --- Initial render --- */
  update();
})();
