(function () {
  var KEY = 'campusos-ai-items';
  var items = load();

  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var KNOWN = ['python', 'dsa', 'java', 'javascript', 'web dev', 'dbms', 'aptitude', 'sql', 'react', 'c++', 'machine learning', 'os'];
  var STOP = ['the', 'my', 'a', 'an', 'some', 'all', 'this', 'that', 'it', 'and', 'with', 'about'];
  // learning ladders: used to suggest the next step after what the user completed
  var LADDER = {
    'python': ['basics', 'loops', 'functions', 'lists', 'dictionaries', 'file handling', 'oop', 'modules'],
    'dsa': ['arrays', 'strings', 'linked list', 'stack', 'queue', 'trees', 'graphs', 'dp'],
    'web dev': ['html', 'css', 'javascript', 'dom', 'react', 'backend'],
    'dbms': ['er model', 'normalization', 'sql', 'joins', 'transactions', 'indexing'],
    'sql': ['select', 'joins', 'group by', 'subqueries', 'indexes']
  };

  function $(id) { return document.getElementById(id); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function daysLeft(str) { return Math.round((new Date(str + 'T00:00:00') - today()) / 86400000); }

  // ---------- 1. Understand dates ("Monday", "next Friday", "tomorrow", "in 3 days", "12 Dec", "15/12") ----------
  function parseDate(low) {
    var t = today(), m;
    var pre = '(?:(?:is\\s+|are\\s+)?(?:due\\s+|by\\s+|before\\s+|on\\s+|until\\s+))?';
    if ((m = low.match(new RegExp('\\b' + pre + '(today|tonight)\\b')))) return { date: ymd(t), match: m[0] };
    if ((m = low.match(new RegExp('\\b' + pre + 'tomorrow\\b')))) { t.setDate(t.getDate() + 1); return { date: ymd(t), match: m[0] }; }
    if ((m = low.match(new RegExp('\\b' + pre + 'in (\\d+) days?\\b')))) { t.setDate(t.getDate() + parseInt(m[1], 10)); return { date: ymd(t), match: m[0] }; }
    if ((m = low.match(new RegExp('\\b' + pre + '(next\\s+|this\\s+)?(sun|mon|tues|wednes|thurs|fri|satur)day\\b')))) {
      var target = DAYS.map(function (d) { return d.slice(0, 3); }).indexOf(m[2].slice(0, 3));
      var diff = (target - t.getDay() + 7) % 7; if (diff === 0) diff = 7;
      // "next friday" = the friday of next week if the upcoming one is still in this week
      if (m[1] && m[1].indexOf('next') === 0 && t.getDay() + diff <= 7) diff += 7;
      t.setDate(t.getDate() + diff); return { date: ymd(t), match: m[0] };
    }
    if ((m = low.match(new RegExp('\\b' + pre + '(\\d{1,2})(?:st|nd|rd|th)?\\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\b')))) {
      var d1 = new Date(t.getFullYear(), MONTHS.indexOf(m[2]), parseInt(m[1], 10));
      if (d1 < t) d1.setFullYear(d1.getFullYear() + 1); return { date: ymd(d1), match: m[0] };
    }
    if ((m = low.match(new RegExp('\\b' + pre + '(\\d{1,2})/(\\d{1,2})\\b')))) {
      var d2 = new Date(t.getFullYear(), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
      if (d2 < t) d2.setFullYear(d2.getFullYear() + 1); return { date: ymd(d2), match: m[0] };
    }
    return null;
  }

  // ---------- 2. Organize: decide the type ----------
  function detectType(low, hasDate) {
    if (/\b(completed|finished|done with|learned|learnt|solved|practiced|practised|studied|revised)\b/.test(low)) return 'progress';
    if (/\b(want to learn|wanna learn|need to learn|learning|learn|goal|get better at|master|improve)\b/.test(low)) return 'goal';
    if (/\b(project|presentation|hackathon|prototype|capstone)\b/.test(low)) return 'project';
    if (/\b(exam|test|quiz|interview|meeting|class|lecture|seminar|viva|event)\b/.test(low)) return 'event';
    if (/\b(assignment|homework|submit|due|deadline|report|lab|record|complete|finish|need to|have to|must|buy|call|pay)\b/.test(low) || hasDate) return 'task';
    return 'note';
  }

  function findTopic(low) {
    for (var i = 0; i < KNOWN.length; i++) { if (new RegExp('\\b' + KNOWN[i].replace('+', '\\+') + '\\b').test(low)) return KNOWN[i]; }
    return null;
  }
  function findGoal(low) {
    var g = items.filter(function (i) { return i.type === 'goal' && low.indexOf(i.topic) >= 0; });
    return g.length ? g[0] : null;
  }
  function cleanTitle(s, dateMatch) {
    var t = s;
    if (dateMatch) t = t.replace(new RegExp(dateMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    t = t.replace(/^\s*(my|i have to|i need to|i must|i should|i have|i am|i'm|please|remind me to)\s+/i, '')
         .replace(/^\s*(my)\s+/i, '');
    while (/\s+(is|are|was|due|by|on|before|until|and|at)\s*$/i.test(t)) t = t.replace(/\s+(is|are|was|due|by|on|before|until|and|at)\s*$/i, '');
    t = t.replace(/[,;:\s]+$/, '').trim();
    return cap(t) || cap(s);
  }

  // ---------- 3. Connect: build an item from one sentence ----------
  function makeItem(sentence) {
    var low = sentence.toLowerCase(), d = parseDate(low);
    var type = detectType(low, !!d), item = { id: 'a' + Date.now() + Math.floor(Math.random() * 1000), type: type,
      title: '', due: d ? d.date : null, status: 'open', parentId: null, topic: null, created: Date.now(), text: sentence };

    if (type === 'goal') {
      var m = low.match(/learn(?:ing)?\s+(?:about\s+)?(.+)$/), topic = findTopic(low) || (m ? m[1].replace(/[^a-z0-9+ ]/g, '').trim() : '');
      if (!topic) { item.type = 'note'; item.title = cleanTitle(sentence, d && d.match); return [item]; }
      var existing = findGoal(topic);
      if (existing) return [];                                     // goal already exists, do not duplicate
      item.topic = topic; item.title = 'Learn ' + cap(topic); return [item];
    }

    if (type === 'progress') {
      var rest = sentence.replace(/^.*?\b(completed|finished|done with|learned|learnt|solved|practiced|practised|studied|revised)\s+(with\s+|the\s+|my\s+)?/i, '')
                         .replace(/[.!?\s]+$/, '').trim();
      var tp = findTopic(low);
      if (!tp) { var w = rest.split(/\s+/)[0] || ''; if (w.length > 2 && !/^\d/.test(w) && STOP.indexOf(w.toLowerCase()) < 0) tp = w.toLowerCase(); }
      if (!rest || !tp) { item.type = 'note'; item.title = cleanTitle(sentence, d && d.match); return [item]; }
      var out = [], goal = findGoal(tp);
      if (!goal) {                                                  // user never said the goal, so create it
        goal = { id: 'a' + (Date.now() + 1), type: 'goal', title: 'Learn ' + cap(tp), due: null, status: 'open', parentId: null,
                 topic: tp, created: Date.now(), text: '(auto-created)' };
        out.push(goal);
      }
      var detail = rest.replace(new RegExp('^' + tp.replace('+', '\\+') + '\\s*', 'i'), '').trim();
      item.title = cap(detail || rest); item.status = 'done'; item.parentId = goal.id; item.topic = tp;
      out.push(item); return out;
    }

    item.title = cleanTitle(sentence, d && d.match);
    if (type !== 'note') { var g = findGoal(low); if (g) item.parentId = g.id; }
    return [item];
  }

  function categorize(text) {
    var added = 0;
    text.split(/[.!?\n]+/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (s) {
      makeItem(s).forEach(function (it) { items.push(it); added++; });
    });
    return added;
  }

  // ---------- 4. Suggest: next learning step + today's plan ----------
  function goalSteps(goal) { return items.filter(function (i) { return i.parentId === goal.id && i.type === 'progress'; }); }
  function nextStep(goal) {
    var ladder = LADDER[goal.topic];
    var done = goalSteps(goal).map(function (s) { return s.title.toLowerCase(); });
    if (!ladder) return 'keep practicing ' + cap(goal.topic);
    var far = -1;
    ladder.forEach(function (st, i) {
      var re = new RegExp('\\b' + st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');   // whole word only
      if (done.some(function (d) { return re.test(d); })) far = i;
    });
    return far + 1 < ladder.length ? ladder[far + 1] : 'revision and a mini project';
  }
  function dueText(due) {
    if (!due) return 'no deadline';
    var n = daysLeft(due);
    return n < 0 ? 'overdue by ' + (-n) + (n === -1 ? ' day' : ' days') : n === 0 ? 'due today' : n === 1 ? 'due tomorrow' : 'due in ' + n + ' days (' + due + ')';
  }
  function loggedToday() {
    try { return (JSON.parse(localStorage.getItem('campusos-logs')) || []).some(function (l) { return l.date === ymd(new Date()); }); }
    catch (e) { return true; }
  }

  function showPlan() {
    var box = $('aiSuggestion'), open = items.filter(function (i) { return i.status !== 'done' && ['task', 'project', 'event'].indexOf(i.type) >= 0; });
    open.sort(function (a, b) { return (a.due || '9999-12-31') < (b.due || '9999-12-31') ? -1 : 1; });
    var high = [], med = [], low = [];
    open.forEach(function (i) {
      var n = i.due ? daysLeft(i.due) : 999;
      (n <= 2 ? high : n <= 7 ? med : low).push(i);
    });
    function list(arr) { return '<ul class="plain-list">' + arr.map(function (i) {
      return '<li><strong>' + esc(i.title) + '</strong> <span class="meta">&middot; ' + cap(i.type) + ' &middot; ' + dueText(i.due) + '</span></li>'; }).join('') + '</ul>'; }

    var h = '<h2>Your plan for today</h2>';
    if (!open.length && !items.some(function (i) { return i.type === 'goal'; })) {
      h += '<p class="hint">Nothing stored yet. Tell me about your tasks and goals first.</p>';
    }
    if (high.length) h += '<p><b>High priority</b></p>' + list(high);
    if (med.length) h += '<p><b>Medium priority</b></p>' + list(med);
    if (low.length) h += '<p><b>Later</b></p>' + list(low);
    var goals = items.filter(function (i) { return i.type === 'goal' && i.status !== 'done'; });
    if (goals.length) {
      h += '<p><b>Learning</b></p><ul class="plain-list">' + goals.map(function (g) {
        var steps = goalSteps(g), last = steps.length ? steps[steps.length - 1].title : null;
        return '<li><strong>' + esc(g.title) + '</strong>: ' + (last ? 'you completed ' + esc(last.toLowerCase()) + '. ' : 'not started yet. ') +
               'Next: <b>' + esc(nextStep(g)) + '</b></li>'; }).join('') + '</ul>';
    }
    if (!loggedToday()) h += '<p class="hint">You have not logged any skill progress today. Add a log in the Skills tab to keep your streak.</p>';
    if (open.length) {
      var first = open[0];
      h += '<p class="hint"><b>Start with:</b> ' + esc(first.title) + ' (' + dueText(first.due) + ').</p>';
    }
    box.innerHTML = h; box.classList.remove('hidden');
  }

  // ---------- 5. Render the saved items as cards ----------
  function render() {
    var shown = items.filter(function (i) { return i.type !== 'progress'; }).sort(function (a, b) { return b.created - a.created; });
    $('aiCards').innerHTML = shown.length ? shown.map(function (i) {
      var h = '<div class="card" style="' + (i.status === 'done' ? 'opacity:.55' : '') + '">' +
        '<span class="flair">' + cap(i.type) + '</span><h3 style="margin:8px 0 4px;font-size:16px;' + (i.status === 'done' ? 'text-decoration:line-through' : '') + '">' + esc(i.title) + '</h3>';
      if (i.due) {
        var n = daysLeft(i.due), red = n < 0 && i.status !== 'done';
        h += '<div class="meta"' + (red ? ' style="color:#f87171"' : '') + '>' + dueText(i.due) + '</div>';
      }
      if (i.parentId) {
        var p = items.filter(function (x) { return x.id === i.parentId; })[0];
        if (p) h += '<div class="meta">Linked to: ' + esc(p.title) + '</div>';
      }
      if (i.type === 'goal') {
        var steps = goalSteps(i);
        h += '<div class="meta">' + steps.length + ' step' + (steps.length === 1 ? '' : 's') + ' completed' +
             (steps.length ? ': ' + steps.map(function (s) { return esc(s.title); }).join(', ') : '') + '</div>' +
             '<div class="meta">Next: <b>' + esc(nextStep(i)) + '</b></div>';
      }
      h += '<div class="row">';
      if (i.type !== 'note') h += '<button class="endorse" data-act="done" data-id="' + i.id + '">' + (i.status === 'done' ? 'Undo' : 'Mark done') + '</button>';
      h += '<button class="endorse" data-act="del" data-id="' + i.id + '">Delete</button></div></div>';
      return h;
    }).join('') : '<p class="hint">Nothing here yet. Type something above and press Categorize.</p>';
  }

  // ---------- Buttons ----------
  $('aiSubmit').addEventListener('click', function () {
    var text = $('aiInput').value.trim();
    if (!text) { toast('Type something first'); return; }
    var n = categorize(text); save(); render();
    $('aiInput').value = '';
    toast(n ? n + ' item' + (n === 1 ? '' : 's') + ' added' : 'Already saved');
  });
  $('aiInput').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('aiSubmit').click(); });
  $('aiToday').addEventListener('click', showPlan);
  $('aiClear').addEventListener('click', function () {
    if (!items.length || !confirm('Delete all AI Assistant items?')) return;
    items = []; save(); render(); $('aiSuggestion').classList.add('hidden');
  });
  $('aiCards').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var it = items.filter(function (x) { return x.id === b.dataset.id; })[0]; if (!it) return;
    if (b.dataset.act === 'done') it.status = it.status === 'done' ? 'open' : 'done';
    else items = items.filter(function (x) { return x.id !== it.id && x.parentId !== it.id; }); // delete item and its progress steps
    save(); render();
    if (!$('aiSuggestion').classList.contains('hidden')) showPlan();
  });

  render();
})();
