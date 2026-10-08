(() => {
  const STORAGE_KEY = "kids_english_tool_v1";

  const WORDS = {
    primary: [
      { word: "apple", phonetic: "/ˈæpl/", meaning: "苹果" },
      { word: "book", phonetic: "/bʊk/", meaning: "书" },
      { word: "cat", phonetic: "/kæt/", meaning: "猫" },
      { word: "dog", phonetic: "/dɔːɡ/", meaning: "狗" },
      { word: "egg", phonetic: "/eɡ/", meaning: "鸡蛋" },
      { word: "fish", phonetic: "/fɪʃ/", meaning: "鱼" },
      { word: "happy", phonetic: "/ˈhæpi/", meaning: "快乐的" },
      { word: "jump", phonetic: "/dʒʌmp/", meaning: "跳" },
      { word: "like", phonetic: "/laɪk/", meaning: "喜欢" },
      { word: "school", phonetic: "/skuːl/", meaning: "学校" },
      { word: "water", phonetic: "/ˈwɔːtər/", meaning: "水" },
      { word: "friend", phonetic: "/frend/", meaning: "朋友" }
    ],
    junior: [
      { word: "beautiful", phonetic: "/ˈbjuːtɪfl/", meaning: "美丽的" },
      { word: "because", phonetic: "/bɪˈkɔːz/", meaning: "因为" },
      { word: "careful", phonetic: "/ˈkerfl/", meaning: "小心的" },
      { word: "decide", phonetic: "/dɪˈsaɪd/", meaning: "决定" },
      { word: "enough", phonetic: "/ɪˈnʌf/", meaning: "足够的" },
      { word: "famous", phonetic: "/ˈfeɪməs/", meaning: "著名的" },
      { word: "however", phonetic: "/haʊˈevər/", meaning: "然而" },
      { word: "important", phonetic: "/ɪmˈpɔːrtnt/", meaning: "重要的" },
      { word: "knowledge", phonetic: "/ˈnɑːlɪdʒ/", meaning: "知识" },
      { word: "practice", phonetic: "/ˈpræktɪs/", meaning: "练习" }
    ],
    senior: [
      { word: "abandon", phonetic: "/əˈbændən/", meaning: "放弃" },
      { word: "academic", phonetic: "/ˌækəˈdemɪk/", meaning: "学术的" },
      { word: "ambitious", phonetic: "/æmˈbɪʃəs/", meaning: "有雄心的" },
      { word: "circumstance", phonetic: "/ˈsɜːrkəmstæns/", meaning: "情况；环境" },
      { word: "consequently", phonetic: "/ˈkɑːnsɪkwentli/", meaning: "因此" },
      { word: "demonstrate", phonetic: "/ˈdemənstreɪt/", meaning: "证明；展示" },
      { word: "environment", phonetic: "/ɪnˈvaɪrənmənt/", meaning: "环境" },
      { word: "fundamental", phonetic: "/ˌfʌndəˈmentl/", meaning: "基本的" }
    ]
  };

  const SENTENCES = {
    primary: [
      { en: "I like apples.", zh: "我喜欢苹果。" },
      { en: "This is my book.", zh: "这是我的书。" },
      { en: "The cat is cute.", zh: "这只猫很可爱。" },
      { en: "I have a dog.", zh: "我有一只狗。" },
      { en: "She is happy.", zh: "她很开心。" },
      { en: "We go to school.", zh: "我们去上学。" },
      { en: "Drink some water.", zh: "喝一些水。" },
      { en: "He is my friend.", zh: "他是我的朋友。" }
    ],
    junior: [
      { en: "She is a beautiful girl.", zh: "她是一个美丽的女孩。" },
      { en: "I stayed at home because it rained.", zh: "因为下雨，我待在家里。" },
      { en: "Please be careful.", zh: "请小心。" },
      { en: "We need to decide now.", zh: "我们现在需要做决定。" },
      { en: "This is important knowledge.", zh: "这是重要的知识。" },
      { en: "Practice makes perfect.", zh: "熟能生巧。" }
    ],
    senior: [
      { en: "Never abandon your dreams.", zh: "永远不要放弃你的梦想。" },
      { en: "The academic report is well written.", zh: "这份学术报告写得很好。" },
      { en: "He is ambitious and hard-working.", zh: "他既有抱负又勤奋。" },
      { en: "Under no circumstance should you give up.", zh: "在任何情况下你都不应该放弃。" },
      { en: "The environment is fundamental to our life.", zh: "环境对我们的生活至关重要。" }
    ]
  };

  const GRAMMAR = {
    primary: [
      {
        category: "冠词",
        question: "I have ___ apple on the table.",
        options: ["a", "an", "the", "some"],
        answer: 1,
        explain: "apple 以元音音素 /æ/ 开头，不定冠词用 an。"
      },
      {
        category: "冠词",
        question: "She is ___ teacher.",
        options: ["a", "an", "the", "/"],
        answer: 0,
        explain: "teacher 以辅音音素开头，表示“一名老师”用 a。"
      },
      {
        category: "介词",
        question: "The book is ___ the desk.",
        options: ["in", "on", "at", "to"],
        answer: 1,
        explain: "表示“在物体表面上”用介词 on。"
      },
      {
        category: "时态",
        question: "I ___ a student.",
        options: ["am", "is", "are", "be"],
        answer: 0,
        explain: "主语是 I，be 动词用 am。"
      },
      {
        category: "现在进行",
        question: "They ___ playing football now.",
        options: ["am", "is", "are", "be"],
        answer: 2,
        explain: "现在进行时：be + doing。主语 they 用 are。"
      },
      {
        category: "一般过去",
        question: "I ___ to school yesterday.",
        options: ["go", "goes", "went", "going"],
        answer: 2,
        explain: "yesterday 表示过去，go 的过去式是 went。"
      }
    ],
    junior: [
      {
        category: "冠词",
        question: "___ sun rises in the east.",
        options: ["A", "An", "The", "/"],
        answer: 2,
        explain: "世界上独一无二的事物（太阳、月亮等）前用 the。"
      },
      {
        category: "介词",
        question: "She has lived here ___ 2019.",
        options: ["for", "since", "in", "at"],
        answer: 1,
        explain: "since 后接时间点；for 后接时间段。"
      },
      {
        category: "现在进行",
        question: "Listen! The baby ___ crying.",
        options: ["cry", "cries", "is crying", "cried"],
        answer: 2,
        explain: "Listen! 提示动作正在发生，用现在进行时 is crying。"
      },
      {
        category: "一般过去",
        question: "He ___ his homework last night.",
        options: ["do", "does", "did", "doing"],
        answer: 2,
        explain: "last night 是过去时间，谓语用过去式 did。"
      },
      {
        category: "时态",
        question: "If it ___ tomorrow, we will stay at home.",
        options: ["rain", "rains", "rained", "will rain"],
        answer: 1,
        explain: "主将从现：if 从句用一般现在时，主语 it 用 rains。"
      }
    ],
    senior: [
      {
        category: "冠词",
        question: "He is ___ honest man.",
        options: ["a", "an", "the", "/"],
        answer: 1,
        explain: "honest 以元音音素 /ɒ/ 开头，虽然首字母是 h，仍用 an。"
      },
      {
        category: "介词",
        question: "The success came ___ hard work.",
        options: ["from", "through", "by", "with"],
        answer: 1,
        explain: "through 可表示“通过某种过程或努力而达成”。"
      },
      {
        category: "时态",
        question: "By the time we arrived, the film ___ already.",
        options: ["started", "has started", "had started", "was starting"],
        answer: 2,
        explain: "“到达”是过去，电影开始发生在那之前，用过去完成时 had started。"
      },
      {
        category: "现在进行",
        question: "I ___ a letter now, so I can't go out.",
        options: ["write", "wrote", "am writing", "have written"],
        answer: 2,
        explain: "now 表示此刻正在写信，用现在进行时 am writing。"
      },
      {
        category: "一般过去",
        question: "They ___ in London for five years before they moved.",
        options: ["live", "lived", "have lived", "are living"],
        answer: 1,
        explain: "moved 之前的一段过去经历，用一般过去时 lived。"
      }
    ]
  };

  const LEVEL_NAME = { primary: "小学", junior: "初中", senior: "高考" };
  const KIND_NAME = { word: "单词", sentence: "句子", grammar: "语法" };

  const els = {
    tabs: [...document.querySelectorAll(".tab")],
    dictSelect: document.getElementById("dictSelect"),
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
    dict: "primary",
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
    progress: {
      word: { primary: 0, junior: 0, senior: 0 },
      sentence: { primary: 0, junior: 0, senior: 0 },
      grammar: { primary: 0, junior: 0, senior: 0 }
    },
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
        progress: {
          word: { ...base.progress.word, ...(saved.progress && saved.progress.word) },
          sentence: { ...base.progress.sentence, ...(saved.progress && saved.progress.sentence) },
          grammar: { ...base.progress.grammar, ...(saved.progress && saved.progress.grammar) }
        },
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
      dict: state.dict,
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

  function currentTarget() {
    if (state.practiceQueue && state.practiceQueue.length) {
      return state.practiceQueue[0];
    }
    if (state.tab === "word") {
      const list = WORDS[state.dict];
      const i = state.progress.word[state.dict] % list.length;
      return { kind: "word", dict: state.dict, ...list[i] };
    }
    if (state.tab === "sentence") {
      const list = SENTENCES[state.dict];
      const i = state.progress.sentence[state.dict] % list.length;
      return { kind: "sentence", dict: state.dict, ...list[i] };
    }
    if (state.tab === "grammar") {
      const list = GRAMMAR[state.dict];
      const i = state.progress.grammar[state.dict] % list.length;
      return { kind: "grammar", dict: state.dict, ...list[i] };
    }
    return null;
  }

  function expectedText(item) {
    if (!item) return "";
    if (item.kind === "word" || item.word) return item.word;
    return item.en || "";
  }

  function speak(text) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const us = voices.find((v) => /en-US/i.test(v.lang) && /Google|Microsoft|Samantha|Jenny/i.test(v.name))
      || voices.find((v) => /en-US/i.test(v.lang))
      || voices.find((v) => /^en/i.test(v.lang));
    if (us) u.voice = us;
    window.speechSynthesis.speak(u);
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
    const dict = state.dict;
    const size = kind === "word" ? WORDS[dict].length
      : kind === "sentence" ? SENTENCES[dict].length
      : GRAMMAR[dict].length;
    state.progress[kind][dict] = (state.progress[kind][dict] + 1) % size;
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
    if (state.tab === "word") {
      total = WORDS[state.dict].length;
      idx = state.progress.word[state.dict] % total;
    } else if (state.tab === "sentence") {
      total = SENTENCES[state.dict].length;
      idx = state.progress.sentence[state.dict] % total;
    } else if (state.tab === "grammar") {
      total = GRAMMAR[state.dict].length;
      idx = state.progress.grammar[state.dict] % total;
    } else {
      total = allMistakes().length;
      idx = 0;
    }
    els.statProgress.textContent = state.tab === "review"
      ? `${total} 题`
      : `${Math.min(idx + 1, total)}/${total}`;
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
    els.dictSelect.value = state.dict;
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
    els.grammarMeta.textContent = `${LEVEL_NAME[item.dict || state.dict]} · ${item.category}`;
    els.grammarQuestion.textContent = item.question;
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
      state.typed += ch;
      markMistake(item);
      save();
      renderLetters(target, state.typed, true);
      els.feedback.textContent = "输入错误，请重新输入";
      els.feedback.style.color = "var(--bad)";
      state.locking = true;
      setTimeout(() => {
        state.typed = "";
        state.locking = false;
        els.feedback.textContent = "";
        renderLetters(target, "", false);
        els.hiddenInput.value = "";
        focusInput();
      }, 380);
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
      const dict = state.dict;
      const size = item.kind === "word" ? WORDS[dict].length
        : item.kind === "sentence" ? SENTENCES[dict].length
        : GRAMMAR[dict].length;
      state.progress[item.kind][dict] = (state.progress[item.kind][dict] + 1) % size;
      save();
    }
    state.typed = "";
    state.grammarPicked = null;
    render();
  }

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

  els.dictSelect.addEventListener("change", () => {
    state.dict = els.dictSelect.value;
    state.typed = "";
    state.grammarPicked = null;
    state.practiceQueue = null;
    save();
    render();
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
    if (e.ctrlKey && !e.altKey && e.key.length === 1) {
      e.preventDefault();
      playCurrent();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleChar(e.key);
    }
  });

  els.hiddenInput.addEventListener("input", () => {
    const value = els.hiddenInput.value;
    els.hiddenInput.value = "";
    if (!value) return;
    for (const ch of value) handleChar(ch);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target === els.hiddenInput) return;
    if (e.ctrlKey && !e.altKey && e.key.length === 1) {
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

  render();
})();
