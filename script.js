(() => {
  const STORAGE_KEY = "kids_english_tool_v1";
  // 当前内存中加载的题库
  let currentBankData = null;
  // 题库索引列表
  let bankIndexList = [];
  const KIND_NAME = { word: "单词", sentence: "句子", grammar: "语法" };
  // 中文输入法常见标点 → 英文标点映射，句子默写时中文标点不判错
  const PUNCT_MAP = { "，": ",", "。": ".", "！": "!", "？": "?", "；": ";", "：": ":", "‘": "'", "’": "'", "“": '"', "”": '"' };
  // 句子默写允许的英文标点
  const EN_PUNCT = /[.,!?;:'"]/;
  const els = {
    tabs: [...document.querySelectorAll(".tab")],
    bankSelect: document.getElementById("bankSelect"),
    loadBankBtn: document.getElementById("loadBankBtn"),
    resetBtn: document.getElementById("resetBtn"),
    soundBtn: document.getElementById("soundBtn"),
    skipBtn: document.getElementById("skipBtn"),
    mainToolbar: document.getElementById("mainToolbar"),
    reviewToolbar: document.getElementById("reviewToolbar"),
    chips: [...document.querySelectorAll(".chip")],
    hint: document.getElementById("hint"),
    prompt: document.getElementById("prompt"),
    phonetic: document.getElementById("phonetic"),
    letters: document.getElementById("letters"),
    feedback: document.getElementById("feedback"),
    grammarBox: document.getElementById("grammarBox"),
    grammarMeta: document.getElementById("grammarMeta"),
    grammarQuestion: document.getElementById("grammarQuestion"),
    grammarQuestionZh: document.getElementById("grammarQuestionZh"),
    grammarOptions: document.getElementById("grammarOptions"),
    grammarExplain: document.getElementById("grammarExplain"),
    grammarNext: document.getElementById("grammarNext"),
    reviewList: document.getElementById("reviewList"),
    emptyState: document.getElementById("emptyState"),
    hiddenInput: document.getElementById("hiddenInput"),
    statWpm: document.getElementById("statWpm"),
    statAcc: document.getElementById("statAcc"),
    statDone: document.getElementById("statDone"),
    statProgress: document.getElementById("statProgress")
  };
  const defaultState = () => ({
    tab: "word",
    bankFilename: "",
    reviewFilter: "all",
    practiceQueue: null,
    typed: "",
    locking: false,
    grammarPicked: null,
    stats: {
      startedAt: 0,
      correctChars: 0,
      totalChars: 0,
      completed: 0
    },
    progress: {},
    mistakes: { word: [], sentence: [], grammar: [] }
  });
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const saved = JSON.parse(raw);
      const base = defaultState();
      return {
        ...base,
        ...saved,
        stats: { ...base.stats, ...(saved.stats || {}) },
        progress: saved.progress ?? {},
        mistakes: {
          word: (saved.mistakes && saved.mistakes.word) || [],
          sentence: (saved.mistakes && saved.mistakes.sentence) || [],
          grammar: (saved.mistakes && saved.mistakes.grammar) || []
        },
        typed: "",
        locking: false,
        grammarPicked: null,
        practiceQueue: saved.practiceQueue || null
      };
    } catch {
      return defaultState();
    }
  }
  function save() {
    const toSave = {
      tab: state.tab,
      bankFilename: state.bankFilename,
      reviewFilter: state.reviewFilter,
      stats: state.stats,
      progress: state.progress,
      mistakes: state.mistakes
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }
  function isDesktop() {
    return window.matchMedia("(pointer: fine)").matches && !("ontouchstart" in window);
  }
  function getCurrentProgressKey() {
    return state.bankFilename;
  }
  function getProgressForBank() {
    const key = getCurrentProgressKey();
    if (!state.progress[key]) {
      state.progress[key] = { word: 0, sentence: 0, grammar: 0 };
    }
    return state.progress[key];
  }
  function currentTarget() {
    if (state.practiceQueue && state.practiceQueue.length) {
      return state.practiceQueue[0];
    }
    if (!currentBankData) return null;
    const prog = getProgressForBank();
    if (state.tab === "word") {
      const list = currentBankData.words;
      const i = prog.word % list.length;
      return { kind: "word", ...list[i] };
    }
    if (state.tab === "sentence") {
      const list = currentBankData.sentences;
      const i = prog.sentence % list.length;
      return { kind: "sentence", ...list[i] };
    }
    if (state.tab === "grammar") {
      const list = currentBankData.grammar;
      const i = prog.grammar % list.length;
      return { kind: "grammar", ...list[i] };
    }
    return null;
  }
  function expectedText(item) {
    if (!item) return "";
    if (item.kind === "word" || item.word) return item.word;
    return item.en || "";
  }
  function speak(text) {
    if (!text) return;
    if (!window.speechSynthesis) {
      console.warn("当前浏览器不支持语音合成");
      alert("当前浏览器不支持发音，请用Chrome或Edge浏览器");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    console.log("可用声音数量:", voices.length);
    const us = voices.find((v) => /en-US/i.test(v.lang) && /Google|Microsoft|Samantha|Jenny/i.test(v.name))
      || voices.find((v) => /en-US/i.test(v.lang))
      || voices.find((v) => /^en/i.test(v.lang));
    if (us) {
      u.voice = us;
      console.log("使用声音:", us.name);
    } else {
      console.warn("没找到英文声音，使用默认");
    }
    u.onend = () => console.log("播放完成");
    u.onerror = (e) => console.error("播放出错:", e);
    // Chrome bug: cancel() 后立刻 speak() 会被吞掉，加个小延迟
    setTimeout(() => window.speechSynthesis.speak(u), 100);
  }
  function markMistake(item) {
    if (!item) return;
    const kind = item.kind;
    const list = state.mistakes[kind];
    const key = kind === "word" ? item.word : kind === "sentence" ? item.en : item.question;
    const exists = list.some((x) => (x.word || x.en || x.question) === key);
    if (!exists) {
      const copy = JSON.parse(JSON.stringify(item));
      copy.kind = kind;
      list.push(copy);
      save();
    }
  }
  function removeMistake(item) {
    const kind = item.kind;
    const key = kind === "word" ? item.word : kind === "sentence" ? item.en : item.question;
    state.mistakes[kind] = state.mistakes[kind].filter((x) => (x.word || x.en || x.question) !== key);
    save();
  }
  function bumpProgress(kind) {
    if (!currentBankData) return;
    const prog = getProgressForBank();
    let size;
    if (kind === "word") size = currentBankData.words.length;
    else if (kind === "sentence") size = currentBankData.sentences.length;
    else size = currentBankData.grammar.length;
    prog[kind] = (prog[kind] + 1) % size;
    state.stats.completed += 1;
    save();
  }
  function touchTimer() {
    if (!state.stats.startedAt) {
      state.stats.startedAt = Date.now();
      save();
    }
  }
  function updateStats() {
    const minutes = Math.max((Date.now() - (state.stats.startedAt || Date.now())) / 60000, 1 / 60);
    const wpm = state.stats.startedAt ? Math.round((state.stats.correctChars / 5) / minutes) : 0;
    const acc = state.stats.totalChars
      ? Math.round((state.stats.correctChars / state.stats.totalChars) * 100)
      : 100;
    els.statWpm.textContent = String(wpm);
    els.statAcc.textContent = `${acc}%`;
    els.statDone.textContent = String(state.stats.completed);
    let total = 0;
    let idx = 0;
    if (state.tab === "review") {
      total = allMistakes().length;
      els.statProgress.textContent = `${total} 题`;
    } else if (currentBankData) {
      const prog = getProgressForBank();
      if (state.tab === "word") {
        total = currentBankData.words.length;
        idx = prog.word % total;
      } else if (state.tab === "sentence") {
        total = currentBankData.sentences.length;
        idx = prog.sentence % total;
      } else if (state.tab === "grammar") {
        total = currentBankData.grammar.length;
        idx = prog.grammar % total;
      }
      els.statProgress.textContent = `${Math.min(idx + 1, total)}/${total}`;
    } else {
      els.statProgress.textContent = "-/-";
    }
  }
  function allMistakes() {
    return [
      ...state.mistakes.word.map((x) => ({ ...x, kind: "word" })),
      ...state.mistakes.sentence.map((x) => ({ ...x, kind: "sentence" })),
      ...state.mistakes.grammar.map((x) => ({ ...x, kind: "grammar" }))
    ];
  }
  function filteredMistakes() {
    const all = allMistakes();
    if (state.reviewFilter === "all") return all;
    return all.filter((x) => x.kind === state.reviewFilter);
  }
  function renderLetters(target, typed, bad) {
    els.letters.innerHTML = "";
    const chars = [...target];
    chars.forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "letter";
      if (ch === " ") span.classList.add("space");
      if (i < typed.length) {
        span.textContent = ch === " " ? " " : typed[i];
        span.classList.add(bad && i === typed.length - 1 ? "bad" : "ok");
      } else {
        const punct = /[.,!?;:'"]/.test(ch);
        span.textContent = ch === " " ? " " : punct ? ch : "";
        if (i === typed.length) span.classList.add("current");
      }
      els.letters.appendChild(span);
    });
  }
  function setTypingVisible(show) {
    els.prompt.classList.toggle("hidden", !show);
    els.letters.classList.toggle("hidden", !show);
    els.feedback.classList.toggle("hidden", !show);
  }
  function render() {
    document.body.classList.toggle("is-desktop", isDesktop());
    const itemNow = currentTarget();
    const typing = (state.tab === "word" || state.tab === "sentence"
      || (state.practiceQueue && itemNow && itemNow.kind !== "grammar"))
      && !(state.tab === "review" && !state.practiceQueue);
    document.body.classList.toggle("is-typing", typing);
    els.tabs.forEach((t) => {
      const on = t.dataset.tab === state.tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    els.chips.forEach((c) => c.classList.toggle("is-active", c.dataset.filter === state.reviewFilter));
    const inReviewList = state.tab === "review" && !state.practiceQueue;
    els.mainToolbar.classList.toggle("hidden", inReviewList);
    els.reviewToolbar.classList.toggle("hidden", state.tab !== "review");
    els.soundBtn.classList.toggle("hidden", state.tab === "grammar" || inReviewList);
    els.skipBtn.classList.toggle("hidden", inReviewList);
    els.grammarBox.classList.add("hidden");
    els.reviewList.classList.add("hidden");
    els.emptyState.classList.add("hidden");
    els.phonetic.classList.add("hidden");
    els.feedback.textContent = "";
    setTypingVisible(false);
    if (state.tab === "review" && !state.practiceQueue) {
      renderReview();
      updateStats();
      return;
    }
    if (!currentBankData) {
      els.emptyState.textContent = "请先从上方下拉选择题库，点击【加载题库】";
      els.emptyState.classList.remove("hidden");
      updateStats();
      return;
    }
    const item = currentTarget();
    if (!item) {
      els.emptyState.textContent = "当前没有题目。";
      els.emptyState.classList.remove("hidden");
      updateStats();
      return;
    }
    if (item.kind === "grammar") {
      renderGrammar(item);
    } else {
      renderDictation(item);
    }
    updateStats();
  }
  function renderDictation(item) {
    const isWord = item.kind === "word";
    els.hint.textContent = isWord
      ? "看中文释义，用键盘输入对应英文单词"
      : "看中文句子，完整敲出对应的英文句子（含空格和标点）";
    els.prompt.textContent = isWord ? item.meaning : item.zh;
    if (isWord) {
      els.phonetic.textContent = item.phonetic;
      els.phonetic.classList.remove("hidden");
    }
    setTypingVisible(true);
    renderLetters(expectedText(item), state.typed, false);
    focusInput();
  }
  function renderGrammar(item) {
    els.hint.textContent = "单项选择题，选完立即显示答案和解析";
    els.grammarBox.classList.remove("hidden");
    els.grammarMeta.textContent = item.category;
    els.grammarQuestion.textContent = item.question;
    // 语法题中文翻译（BUG-011）：避免题目看不懂只能猜选项
    els.grammarQuestionZh.textContent = item.question_zh || "";
    els.grammarQuestionZh.classList.toggle("hidden", !item.question_zh);
    els.grammarOptions.innerHTML = "";
    item.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.textContent = `${String.fromCharCode(65 + i)}.  ${opt}`;
      if (state.grammarPicked !== null) {
        btn.disabled = true;
        if (i === item.answer) btn.classList.add("correct");
        if (i === state.grammarPicked && i !== item.answer) btn.classList.add("wrong");
      } else {
        btn.addEventListener("click", () => onGrammarPick(i));
      }
      els.grammarOptions.appendChild(btn);
    });
    if (state.grammarPicked === null) {
      els.grammarExplain.classList.add("hidden");
      els.grammarNext.classList.add("hidden");
    } else {
      const ok = state.grammarPicked === item.answer;
      els.grammarExplain.classList.remove("hidden");
      els.grammarExplain.innerHTML = `<strong>${ok ? "回答正确" : "回答错误"}</strong><br>正确答案：${item.options[item.answer]}<br>${item.explain}`;
      els.grammarNext.classList.remove("hidden");
    }
  }
  function renderReview() {
    els.hint.textContent = "错题本会自动收集单词、句子和语法错题，可点进去再练";
    const items = filteredMistakes();
    if (!items.length) {
      els.emptyState.textContent = "暂无错题，继续保持！";
      els.emptyState.classList.remove("hidden");
      return;
    }
    els.reviewList.classList.remove("hidden");
    els.reviewList.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "review-card";
      let body = "";
      if (item.kind === "word") {
        body = `<p><strong>${item.meaning}</strong> · ${item.word}</p><p class="muted">${item.phonetic || ""}</p>`;
      } else if (item.kind === "sentence") {
        body = `<p><strong>${item.zh}</strong></p><p class="muted">${item.en}</p>`;
      } else {
        body = `<p><strong>${item.question}</strong></p><p class="muted">答案：${item.options[item.answer]} · ${item.explain}</p>`;
      }
      card.innerHTML = `<span class="kind">${KIND_NAME[item.kind]}</span>${body}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "practice-btn";
      btn.textContent = "再练一次";
      btn.addEventListener("click", () => {
        state.practiceQueue = [item];
        state.typed = "";
        state.grammarPicked = null;
        state.tab = "review";
        render();
      });
      card.appendChild(btn);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "practice-btn";
      del.style.marginLeft = "8px";
      del.style.background = "var(--bad-bg)";
      del.style.color = "var(--bad)";
      del.textContent = "移出";
      del.addEventListener("click", () => {
        removeMistake(item);
        render();
      });
      card.appendChild(del);
      els.reviewList.appendChild(card);
    });
  }
  function finishItem(item, correct) {
    if (state.practiceQueue) {
      if (correct) removeMistake(item);
      state.practiceQueue = null;
      state.tab = "review";
    } else {
      bumpProgress(item.kind);
    }
    state.typed = "";
    state.grammarPicked = null;
    state.locking = false;
    render();
  }
  function onGrammarPick(i) {
    const item = currentTarget();
    if (!item || state.grammarPicked !== null) return;
    state.grammarPicked = i;
    const ok = i === item.answer;
    if (!ok) markMistake(item);
    if (ok) state.stats.correctChars += 1;
    state.stats.totalChars += 1;
    save();
    render();
  }
  function handleChar(ch) {
    if (state.locking) return;
    const item = currentTarget();
    if (!item || item.kind === "grammar" || (state.tab === "review" && !state.practiceQueue)) return;
    const target = expectedText(item);
    if (!target) return;
    // 中文标点转英文标点（句子默写时中文输入法打出的标点不判错）
    if (PUNCT_MAP[ch]) ch = PUNCT_MAP[ch];
    // 只接受 字母、空格、句子标点；其余字符（汉字、数字、符号、输入法组合等）一律忽略，不判错
    if (!/^[a-zA-Z]$/.test(ch) && ch !== " " && !EN_PUNCT.test(ch)) return;
    touchTimer();
    state.stats.totalChars += 1;
    const next = target[state.typed.length];
    if (ch === next) {
      state.typed += ch;
      state.stats.correctChars += 1;
      save();
      renderLetters(target, state.typed, false);
      if (state.typed === target) {
        els.feedback.textContent = "正确！";
        els.feedback.style.color = "var(--ok)";
        state.locking = true;
        setTimeout(() => finishItem(item, true), 420);
      }
    } else {
      // 记录错题
      markMistake(item);
      // 临时把错误字母标红展示
      const errTyped = state.typed + ch;
      renderLetters(target, errTyped, true);
      els.feedback.textContent = "输错了一个字母，从当前单词重新输入";
      els.feedback.style.color = "var(--bad)";
      state.locking = true;
      // 定位错误字母所在单词：回退到它前面最近一个空格之后（即该单词开头）
      // 单词默写（无空格）则回退到开头；句子则只回退到出错的那个单词，不用整句重来
      const errPos = state.typed.length;
      let spaceIdx = -1;
      for (let i = errPos - 1; i >= 0; i--) {
        if (target[i] === " ") { spaceIdx = i; break; }
      }
      const keepLen = spaceIdx + 1;
      setTimeout(() => {
        state.typed = target.slice(0, keepLen);
        state.locking = false;
        els.feedback.textContent = "";
        renderLetters(target, state.typed, false);
        els.hiddenInput.value = "";
        focusInput();
      }, 500);
    }
    updateStats();
  }
  function focusInput() {
    if (state.tab === "grammar" && !state.practiceQueue) return;
    if (state.tab === "review" && !state.practiceQueue) return;
    els.hiddenInput.focus({ preventScroll: true });
  }
  function playCurrent() {
    const item = currentTarget();
    if (!item) return;
    if (item.kind === "word") speak(item.word);
    else if (item.kind === "sentence") speak(item.en);
  }
  function skipCurrent() {
    const item = currentTarget();
    if (!item) return;
    if (state.practiceQueue) {
      state.practiceQueue = null;
      state.tab = "review";
    } else if (item.kind) {
      bumpProgress(item.kind);
    }
    state.typed = "";
    state.grammarPicked = null;
    render();
  }
  // 加载题库索引清单
  async function loadBankIndex() {
    try {
      const res = await fetch("./question_bank/index_list.json");
      bankIndexList = await res.json();
      renderBankSelect();
      // 如果本地保存了上次的题库文件名，自动选中下拉
      if(state.bankFilename){
        const found = bankIndexList.find(b=>b.filename === state.bankFilename);
        if(found) els.bankSelect.value = found.filename;
      }
    }catch(e){
      console.warn("加载题库索引失败，请确认question_bank/index_list.json存在",e);
    }
  }
  function renderBankSelect(){
    els.bankSelect.innerHTML = "";
    bankIndexList.forEach(item=>{
      const opt = document.createElement("option");
      opt.innerText = item.name;
      opt.value = item.filename;
      els.bankSelect.appendChild(opt);
    })
  }
  // 点击加载题库按钮，懒加载对应的json题库
  async function doLoadBank(filename){
    try{
      const resp = await fetch(`./question_bank/${filename}`);
      currentBankData = await resp.json();
      state.bankFilename = filename;
      state.typed = "";
      state.grammarPicked = null;
      state.practiceQueue = null;
      save();
      render();
    }catch(err){
      alert("题库加载失败，请确认json文件存在："+filename);
      console.error(err);
    }
  }
  els.loadBankBtn.addEventListener("click",async ()=>{
    const selFile = els.bankSelect.value;
    await doLoadBank(selFile);
  })
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.tab = tab.dataset.tab;
      state.typed = "";
      state.grammarPicked = null;
      state.practiceQueue = null;
      save();
      render();
    });
  });
  els.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.reviewFilter = chip.dataset.filter;
      state.practiceQueue = null;
      save();
      render();
    });
  });
  els.soundBtn.addEventListener("click", playCurrent);
  els.skipBtn.addEventListener("click", skipCurrent);
  els.grammarNext.addEventListener("click", () => {
    const item = currentTarget();
    if (!item) return;
    const ok = state.grammarPicked === item.answer;
    finishItem(item, ok);
  });
  els.resetBtn.addEventListener("click", () => {
    if (!confirm("确定清空学习进度、统计和错题本吗？")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    currentBankData=null;
    render();
  });
  els.hiddenInput.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (state.tab === "grammar" && state.grammarPicked !== null) els.grammarNext.click();
      return;
    }
    if ((e.ctrlKey && !e.altKey && e.key.length === 1) || e.key === "Control") {
      e.preventDefault();
      playCurrent();
      return;
    }
    // 普通字符不在 keydown 处理：让 input 事件统一接收，避免同一字母被处理两次（BUG-010）
  });
  els.hiddenInput.addEventListener("input", (e) => {
    if (e.isComposing) return; // 中文输入法组合输入中，不处理
    const value = els.hiddenInput.value;
    els.hiddenInput.value = "";
    if (!value) return;
    for (const ch of value) handleChar(ch);
  });
  document.addEventListener("keydown", (e) => {
    if (e.target === els.hiddenInput) return;
    if ((e.ctrlKey && !e.altKey && e.key.length === 1) || e.key === "Control") {
      e.preventDefault();
      playCurrent();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      handleChar(e.key);
    }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("button, select, a, .option, .chip, .tab")) return;
    focusInput();
  });
  window.speechSynthesis?.getVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {});
  }

// 初始化：先读取题库索引
(async function(){
    await loadBankIndex();
    render();
})();

})();

