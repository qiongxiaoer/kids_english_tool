(() => {
  const STORAGE_KEY = "kids_english_tool_v1";
  // 当前内存中加载的题库
  let currentBankData = null;
  // 题库索引列表
  let bankIndexList = [];
  const KIND_NAME = { word: "单词", sentence: "句子", grammar: "语法" };
  // 中文输入法常见标点 → 英文标点映射，句子默写时中文标点不判错
  const PUNCT_MAP = { "，": ",", "。": ".", "！": "!", "？": "?", "；": ";", "：": ":", "‘": "'", "’": "'", "“": '"', "”": '"' };
  const els = {
    tabs: [...document.querySelectorAll(".tab")],
    categorySelect: document.getElementById("categorySelect"),
    categorySelectTrigger: document.getElementById("categorySelectTrigger"),
    categorySelectMenu: document.getElementById("categorySelectMenu"),
    categorySelectValue: document.querySelector("#categorySelect .select-value"),
    bankSelect: document.getElementById("bankSelect"),
    bankSelectTrigger: document.getElementById("bankSelectTrigger"),
    bankSelectMenu: document.getElementById("bankSelectMenu"),
    bankSelectValue: document.querySelector("#bankSelect .select-value"),
    loadBankBtn: document.getElementById("loadBankBtn"),
    resetBtn: document.getElementById("resetBtn"),
    soundBtn: document.getElementById("soundBtn"),
    hintBtn: document.getElementById("hintBtn"),
    skipBtn: document.getElementById("skipBtn"),
    mainToolbar: document.getElementById("mainToolbar"),
    reviewToolbar: document.getElementById("reviewToolbar"),
    dueReviewBtn: document.getElementById("dueReviewBtn"),
    dueCount: document.getElementById("dueCount"),
    chips: [...document.querySelectorAll(".chip")],
    hint: document.getElementById("hint"),
    prompt: document.getElementById("prompt"),
    phonetic: document.getElementById("phonetic"),
    letters: document.getElementById("letters"),
    feedback: document.getElementById("feedback"),
    grammarBox: document.getElementById("grammarBox"),
    lessonBox: document.getElementById("lessonBox"),
    lessonBar: document.getElementById("lessonBar"),
    lessonBody: document.getElementById("lessonBody"),
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
    reviewSession: false,
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
  // 艾宾浩斯记忆曲线：答对后下一次复习的间隔（天），走完即毕业移出错题本
  const REVIEW_INTERVALS = [1, 2, 4, 7, 15];
  const DAY_MS = 86400000;
  const mistakeKey = (x) => x.word || x.en || x.question;
  // 旧版本错题无调度字段：补充默认值，全部视为"已到期"，纳入今日复习
  function normalizeMistakes(arr) {
    return (arr || []).map((x) => ({
      ...x,
      addedAt: x.addedAt || Date.now(),
      stage: x.stage || 0,
      dueAt: x.dueAt || 0
    }));
  }
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
          word: normalizeMistakes(saved.mistakes && saved.mistakes.word),
          sentence: normalizeMistakes(saved.mistakes && saved.mistakes.sentence),
          grammar: normalizeMistakes(saved.mistakes && saved.mistakes.grammar)
        },
        typed: "",
        locking: false,
        grammarPicked: null,
        practiceQueue: saved.practiceQueue || null,
        reviewSession: false
      };
    } catch {
      return defaultState();
    }
  }
  function save() {
    // 隐私模式 / 禁用 Cookie / file:// 配额受限时 localStorage.setItem 可能抛异常，
    // 用 try/catch 兜底，保证练习流程不被存储失败打断（仅本次进度无法持久化）
    try {
      const toSave = {
        tab: state.tab,
        bankFilename: state.bankFilename,
        reviewFilter: state.reviewFilter,
        stats: state.stats,
        progress: state.progress,
        mistakes: state.mistakes
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("进度无法保存到本地（浏览器禁用了本地存储）：", e);
    }
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
    const exists = list.find((x) => (x.word || x.en || x.question) === key);
    if (exists) {
      // 再次答错：记忆曲线重置，当天重新到期
      exists.stage = 0;
      exists.dueAt = Date.now();
      save();
      return;
    }
    const copy = JSON.parse(JSON.stringify(item));
    copy.kind = kind;
    copy.addedAt = Date.now();
    copy.stage = 0;          // 复习阶段：0 起，每答对一次升一级
    copy.dueAt = Date.now(); // 新错题当天即可复习
    list.push(copy);
    save();
  }
  function findMistakeRecord(kind, key) {
    return state.mistakes[kind].find((x) => mistakeKey(x) === key);
  }
  // 复习答对：升入下一个间隔；走完全部间隔则毕业移出错题本
  function advanceMistake(item) {
    const rec = findMistakeRecord(item.kind, mistakeKey(item));
    if (!rec) return;
    rec.stage = (rec.stage || 0) + 1;
    if (rec.stage > REVIEW_INTERVALS.length) {
      removeMistake(item);
      return;
    }
    rec.dueAt = Date.now() + REVIEW_INTERVALS[rec.stage - 1] * DAY_MS;
    save();
  }
  // 复习答错：重置回 1 天间隔，明天再复习
  function scheduleMistakeTomorrow(item) {
    const rec = findMistakeRecord(item.kind, mistakeKey(item));
    if (!rec) return;
    rec.stage = 0;
    rec.dueAt = Date.now() + DAY_MS;
    save();
  }
  // 今日到期的错题（按到期时间升序）
  function dueMistakes() {
    return allMistakes()
      .filter((x) => (x.dueAt || 0) <= Date.now())
      .sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
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
      total = state.practiceQueue ? state.practiceQueue.length : allMistakes().length;
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
        const punct = /[.,!?;:'"-]/.test(ch);
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
    els.hintBtn.classList.toggle("hidden", state.tab === "grammar" || inReviewList);
    els.grammarBox.classList.add("hidden");
    els.lessonBox.classList.add("hidden");
    els.reviewList.classList.add("hidden");
    els.emptyState.classList.add("hidden");
    els.phonetic.classList.add("hidden");
    els.dueReviewBtn.classList.add("hidden");
    els.feedback.textContent = "";
    setTypingVisible(false);
    if (state.tab === "review" && !state.practiceQueue) {
      const dueCount = dueMistakes().length;
      els.dueCount.textContent = String(dueCount);
      els.dueReviewBtn.classList.toggle("hidden", dueCount === 0);
      renderReview();
      updateStats();
      return;
    }
    // 复习队列中的题目自带完整内容，不依赖已加载的题库
    // 第一次打开（没有上次题库记录）时的引导：用三步说明代替单句提示
    if (!currentBankData && !state.practiceQueue) {
      els.emptyState.innerHTML =
        "第一次使用？三步就能开始：<br>" +
        "① 确认上方的题库（默认已选「小学 · 三年级上册」）<br>" +
        "② 点击【加载题库】<br>" +
        "③ 看中文意思，用键盘敲出对应英文";
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
  // 语法讲解卡：按当前题所属单元，从题库 lessons 中取出对应讲解卡渲染
  function renderLesson(item) {
    const box = els.lessonBox;
    const lessons = currentBankData && currentBankData.lessons;
    const lesson = lessons && item.unit ? lessons.find((l) => l.unit === item.unit) : null;
    if (!lesson) {
      box.classList.add("hidden");
      return;
    }
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const rows = (list) => (list || []).map((r) =>
      `<li>${r.tag ? `<span class="lesson-tag">${esc(r.tag)}</span>` : ""}<span class="lesson-en">${esc(r.en)}</span>${r.zh ? `<span class="lesson-zh">${esc(r.zh)}</span>` : ""}</li>`
    ).join("");
    els.lessonBar.textContent = `语法讲解 · ${lesson.unit} ${lesson.title}`;
    els.lessonBody.innerHTML =
      (lesson.summary ? `<p class="lesson-summary">${esc(lesson.summary)}</p>` : "")
      + (lesson.structure && lesson.structure.length
        ? `<p class="lesson-label">句型</p><ul class="lesson-list">${rows(lesson.structure)}</ul>` : "")
      + (lesson.example && lesson.example.length
        ? `<p class="lesson-label">例句</p><ul class="lesson-list">${rows(lesson.example)}</ul>` : "")
      + (lesson.mistake
        ? `<p class="lesson-mistake"><span class="lesson-label">易错</span>${esc(lesson.mistake)}</p>` : "");
    box.classList.remove("hidden");
  }
  function renderGrammar(item) {
    els.hint.textContent = "单项选择题，选完立即显示答案和解析";
    els.grammarBox.classList.remove("hidden");
    renderLesson(item);
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
      const days = Math.ceil(((item.dueAt || 0) - Date.now()) / DAY_MS);
      const dueP = document.createElement("p");
      dueP.className = "muted due-line" + (days <= 0 ? " is-due" : "");
      dueP.textContent = days <= 0 ? "下次复习：今天到期" : `下次复习：${days} 天后`;
      card.appendChild(dueP);
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
      if (correct) {
        advanceMistake(item);
      } else {
        scheduleMistakeTomorrow(item);
        // 复习会话中答错：队尾补一份，稍后重练，直到队列清空
        if (state.reviewSession && state.practiceQueue.length > 1) {
          state.practiceQueue.push(JSON.parse(JSON.stringify(item)));
        }
      }
      state.practiceQueue.shift();
      if (!state.practiceQueue.length) {
        state.practiceQueue = null;
        state.reviewSession = false;
      }
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
    // 只接受 字母；符号（- . 空格 标点等）由自动填充处理，孩子只需敲字母（BUG-012）
    if (!/^[a-zA-Z]$/.test(ch)) return;
    touchTimer();
    state.stats.totalChars += 1;
    // 自动填充：跳过并直接显示目标中当前遇到的非字母符号（空格/标点/连字符等），免输入
    while (state.typed.length < target.length && !/[a-zA-Z]/.test(target[state.typed.length])) {
      state.typed += target[state.typed.length];
    }
    renderLetters(target, state.typed, false);
    const next = target[state.typed.length];
    if (ch === next) {
      state.typed += ch;
      state.stats.correctChars += 1;
      // 再次自动填充该字母之后的非字母符号（句末标点/空格等），免输入即完成
      while (state.typed.length < target.length && !/[a-zA-Z]/.test(target[state.typed.length])) {
        state.typed += target[state.typed.length];
      }
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
      state.practiceQueue.shift();
      if (!state.practiceQueue.length) {
        state.practiceQueue = null;
        state.reviewSession = false;
      }
      state.tab = "review";
    } else if (item.kind) {
      bumpProgress(item.kind);
    }
    state.typed = "";
    state.grammarPicked = null;
    render();
  }
  // 加载题库索引清单（优先用内置数据，兼容 file:// 直接打开；fetch 作为备用）
  // 索引为分级结构：[{category, categoryId, banks:[{name, filename, available}]}]
  async function loadBankIndex() {
    try {
      if (window.__EMBEDDED_BANK_INDEX) {
        bankIndexList = window.__EMBEDDED_BANK_INDEX;
      } else {
        const res = await fetch("./question_bank/index_list.json");
        bankIndexList = await res.json();
      }
      renderCategorySelect();
      // 自动定位上次题库所属大类（找不到则默认第一个大类）
      if (state.bankFilename) {
        const catId = findCategoryForBank(state.bankFilename);
        if (catId) selectedCategory = catId;
      }
      if (!selectedCategory && bankIndexList.length) {
        selectedCategory = bankIndexList[0].categoryId;
      }
      setCategorySelect(selectedCategory);
    }catch(e){
      console.warn("加载题库索引失败，请确认question_bank/index_list.json存在",e);
    }
  }
  // 大类与题库的查找工具
  function findCategoryForBank(filename){
    for (const cat of bankIndexList) {
      if (cat.banks.some(b => b.filename === filename)) return cat.categoryId;
    }
    return "";
  }
  function banksOfCategory(categoryId){
    const cat = bankIndexList.find(c => c.categoryId === categoryId);
    return cat ? cat.banks : [];
  }
  function findBank(filename){
    for (const cat of bankIndexList) {
      const b = cat.banks.find(x => x.filename === filename);
      if (b) return b;
    }
    return null;
  }
  // 大类下拉
  let selectedCategory = "";
  function setCategorySelect(categoryId){
    selectedCategory = categoryId;
    const cat = bankIndexList.find(c => c.categoryId === categoryId);
    els.categorySelectValue.innerText = cat ? cat.category : "请选择大类";
    els.categorySelectMenu.querySelectorAll("li").forEach(li=>{
      li.classList.toggle("is-selected", li.dataset.categoryId === categoryId);
    });
    // 大类切换后，重新填充题库下拉，并默认选第一个可用题库
    renderBankSelect();
  }
  function renderCategorySelect(){
    els.categorySelectMenu.innerHTML = "";
    bankIndexList.forEach(cat=>{
      const li = document.createElement("li");
      li.setAttribute("role","option");
      li.innerText = cat.category;
      li.dataset.categoryId = cat.categoryId;
      els.categorySelectMenu.appendChild(li);
    });
  }
  // 题库下拉：当前选中项（与 state.bankFilename 保持一致，默认取第一个可用项）
  let selectedBankFile = state.bankFilename || "";
  function setBankSelect(filename){
    selectedBankFile = filename;
    const found = findBank(filename);
    els.bankSelectValue.innerText = found ? found.name : "请选择题库";
    els.bankSelectMenu.querySelectorAll("li").forEach(li=>{
      li.classList.toggle("is-selected", li.dataset.filename === filename);
    });
  }
  function renderBankSelect(){
    els.bankSelectMenu.innerHTML = "";
    const list = banksOfCategory(selectedCategory);
    list.forEach(item=>{
      const li = document.createElement("li");
      li.setAttribute("role","option");
      li.innerText = item.available ? item.name : `${item.name}（即将上线）`;
      li.dataset.filename = item.filename;
      if (!item.available) li.classList.add("is-disabled");
      els.bankSelectMenu.appendChild(li);
    })
    // 当前选中题库不在该大类下或不可用时，默认选第一个可用题库
    const stillValid = list.some(b => b.filename === selectedBankFile && b.available);
    if (!stillValid) {
      const firstAvailable = list.find(b => b.available);
      selectedBankFile = firstAvailable ? firstAvailable.filename : "";
    }
    setBankSelect(selectedBankFile);
  }
  // 点击加载题库按钮，懒加载对应的json题库（优先内置数据，fetch 备用）
  // silent=true 时用于启动自动恢复：失败只 console.warn，不弹 alert 打扰用户
  async function doLoadBank(filename, silent){
    try{
      let data;
      if (window.__EMBEDDED_BANKS && window.__EMBEDDED_BANKS[filename]) {
        data = window.__EMBEDDED_BANKS[filename];
      } else {
        const resp = await fetch(`./question_bank/${filename}`);
        data = await resp.json();
      }
      currentBankData = data;
      state.bankFilename = filename;
      state.typed = "";
      state.grammarPicked = null;
      state.practiceQueue = null;
      save();
      render();
    }catch(err){
      if (silent) {
        console.warn("自动恢复上次题库失败：", filename, err);
      } else {
        alert("题库加载失败，请确认json文件存在："+filename);
        console.error(err);
      }
    }
  }
  els.loadBankBtn.addEventListener("click",async ()=>{
    if(!selectedBankFile) return;
    await doLoadBank(selectedBankFile);
  })
  // 今日待复习：把到期错题排成连续复习队列
  els.dueReviewBtn.addEventListener("click",()=>{
    const queue = dueMistakes();
    if (!queue.length) return;
    state.reviewSession = true;
    state.practiceQueue = queue;
    state.typed = "";
    state.grammarPicked = null;
    render();
  })
  // 自定义下拉交互：点击开合、选择选项、点击外部关闭（大类与题库两个下拉互斥，避免同时打开）
  function closeBankMenu(){
    els.bankSelect.classList.remove("is-open");
    els.bankSelectTrigger.setAttribute("aria-expanded","false");
  }
  function closeCategoryMenu(){
    els.categorySelect.classList.remove("is-open");
    els.categorySelectTrigger.setAttribute("aria-expanded","false");
  }
  els.bankSelectTrigger.addEventListener("click",(e)=>{
    e.stopPropagation();
    closeCategoryMenu();
    const open = els.bankSelect.classList.toggle("is-open");
    els.bankSelectTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  els.bankSelectMenu.addEventListener("click",(e)=>{
    const li = e.target.closest("li[data-filename]");
    if(!li) return;
    if (li.classList.contains("is-disabled")) return; // 即将上线题库不可选
    setBankSelect(li.dataset.filename);
    closeBankMenu();
  });
  els.categorySelectTrigger.addEventListener("click",(e)=>{
    e.stopPropagation();
    closeBankMenu();
    const open = els.categorySelect.classList.toggle("is-open");
    els.categorySelectTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  els.categorySelectMenu.addEventListener("click",(e)=>{
    const li = e.target.closest("li[data-category-id]");
    if(!li) return;
    setCategorySelect(li.dataset.categoryId);
    closeCategoryMenu();
  });
  document.addEventListener("click",(e)=>{
    if(!els.bankSelect.contains(e.target)) closeBankMenu();
    if(!els.categorySelect.contains(e.target)) closeCategoryMenu();
  });
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
  els.hintBtn.addEventListener("click", () => {
    const item = currentTarget();
    if (!item || item.kind === "grammar" || (state.tab === "review" && !state.practiceQueue)) return;
    const target = expectedText(item);
    if (!target || state.locking) return;
    // 用过提示的单词/句子自动加入错题本
    markMistake(item);
    // 立即显示完整答案
    state.locking = true;
    renderLetters(target, target, false);
    els.feedback.textContent = "已显示答案，请记住后输入";
    els.feedback.style.color = "var(--accent)";
    // 3 秒后自动恢复遮挡状态，供输入
    setTimeout(() => {
      state.locking = false;
      els.feedback.textContent = "";
      renderLetters(target, state.typed, false);
      focusInput();
    }, 3000);
  });
  els.grammarNext.addEventListener("click", () => {
    const item = currentTarget();
    if (!item) return;
    const ok = state.grammarPicked === item.answer;
    finishItem(item, ok);
  });
  els.resetBtn.addEventListener("click", () => {
    if (!confirm("确定清空学习进度、统计和错题本吗？")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* 本地存储不可用时忽略 */ }
    state = defaultState();
    currentBankData=null;
    render();
  });
  // 全局键盘输入：不依赖 hiddenInput 聚焦，只要窗口激活即可输入（修复"必须按住鼠标才能输入"）
  window.addEventListener("keydown", (e) => {
    if (e.isComposing) return; // 中文输入法组合输入中，交给 input 事件处理
    const item = currentTarget();
    const isTypingTarget = item && item.kind !== "grammar"
      && !(state.tab === "review" && !state.practiceQueue);
    // 语音快捷键：Ctrl+单字符 或 单独的 Ctrl
    if ((e.ctrlKey && !e.altKey && e.key.length === 1) || e.key === "Control") {
      e.preventDefault();
      playCurrent();
      return;
    }
    if (!isTypingTarget) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (state.tab === "grammar" && state.grammarPicked !== null) els.grammarNext.click();
      return;
    }
    // 普通字符：阻止默认输入（防止与 input 事件重复），直接交给 handleChar
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleChar(e.key);
    }
  });
  // 兜底：input 事件仍接收（如移动端软键盘、中文输入法组合后的实际字符）
  els.hiddenInput.addEventListener("input", (e) => {
    if (e.isComposing) return; // 中文输入法组合输入中，不处理
    const value = els.hiddenInput.value;
    els.hiddenInput.value = "";
    if (!value) return;
    for (const ch of value) handleChar(ch);
  });
  // 点击页面空白处自动聚焦输入框（移动端软键盘需要）
  document.addEventListener("click", (e) => {
    if (e.target.closest("button, select, a, .option, .chip, .tab")) return;
    focusInput();
  });
  // 预热语音列表（Safari 的 speechSynthesis 不是 EventTarget，没有 addEventListener，
  // 只能用 onvoiceschanged 属性赋值，且需 try/catch 兜底，否则抛错会中断整个脚本初始化）
  try {
    if (window.speechSynthesis && typeof window.speechSynthesis.getVoices === "function") {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  } catch (e) {
    console.warn("语音引擎初始化失败：", e);
  }

// 初始化：先读取题库索引；若上次学过，自动恢复该题库与进度，开箱即学
(async function(){
    await loadBankIndex();
    const bank = state.bankFilename && findBank(state.bankFilename);
    if (bank && bank.available) {
      await doLoadBank(state.bankFilename, true);
    }
    render();
})();

})();

