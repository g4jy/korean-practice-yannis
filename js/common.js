/* === Korean Practice — Common Utilities === */

const App = (() => {
  let vocabData = null;
  let audioManifest = null;
  const audioBasePath = 'audio/tts/';

  /* --- Data Loading --- */
  async function loadVocab() {
    if (vocabData) return vocabData;
    const resp = await fetch('data/vocab.json');
    vocabData = await resp.json();
    return vocabData;
  }

  /* --- TTS with Pre-generated Audio + Web Speech API Fallback --- */
  async function loadAudioManifest() {
    try {
      const resp = await fetch(audioBasePath + 'manifest.json');
      if (resp.ok) {
        audioManifest = await resp.json();
        console.log(`Loaded ${Object.keys(audioManifest).length} audio files`);
      }
    } catch (e) {
      console.log('No pre-generated audio, using Web Speech API');
    }
  }

  function speak(text) {
    if (audioManifest && audioManifest[text]) {
      const audio = new Audio(audioBasePath + audioManifest[text]);
      audio.play().catch(() => speakWebAPI(text));
      return;
    }
    speakWebAPI(text);
  }

  function speakWebAPI(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 0.85;
    const voices = speechSynthesis.getVoices();
    const ko = voices.find(v => v.lang.startsWith('ko'));
    if (ko) utter.voice = ko;
    speechSynthesis.speak(utter);
  }

  /* --- Korean Particle Helpers --- */
  function hasJongseong(char) {
    if (!char) return false;
    const code = char.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7AF) return false;
    return (code - 0xAC00) % 28 !== 0;
  }

  function particleIGa(word) {
    return hasJongseong(word[word.length - 1]) ? '이' : '가';
  }

  function particleEulReul(word) {
    return hasJongseong(word[word.length - 1]) ? '을' : '를';
  }

  /* --- Block Animation --- */
  function pulseBlock(el) {
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  /* --- Romanization Toggle --- */
  function initRomToggle() {
    const btn = document.getElementById('toggle-rom');
    if (!btn) return;
    const stored = localStorage.getItem('showRom');
    if (stored === 'false') {
      document.body.classList.add('hide-rom');
      btn.textContent = 'Aa Show Romanization';
      btn.classList.remove('active');
    } else {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      const hidden = document.body.classList.toggle('hide-rom');
      btn.textContent = hidden ? 'Aa Show Romanization' : 'Aa Hide Romanization';
      btn.classList.toggle('active', !hidden);
      localStorage.setItem('showRom', !hidden);
    });
  }

  /* --- Init --- */
  async function init() {
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
    }
    await loadAudioManifest();
    initRomToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    loadVocab,
    speak,
    hasJongseong,
    particleIGa,
    particleEulReul,
    pulseBlock
  };
})();
