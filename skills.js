// Skills tab: logging, points, rank, streak, leaderboard, calendar, peer verification.
// Data is saved in the browser (localStorage). No backend in this prototype.
(function () {
  var KEY = 'campusos-logs';
  var MATES = ['Rahul', 'Neha', 'Aman'];                       // demo classmates
  var FRIENDS = [{ name: 'Rahul', points: 320 }, { name: 'Neha', points: 210 }, { name: 'Aman', points: 90 }];
  var logs = load();
  var picked = ymd(new Date());
  var selYear = new Date().getFullYear();

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(logs)); } catch (e) {} }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function $(id) { return document.getElementById(id); }

  // trust level: peers + proof decide the badge
  function trust(l) {
    var e = l.endorsements.length;
    if (e >= 2 && l.proof) return { label: '\u2713 Verified by ' + e + ' classmates', cls: 'ok' };
    if (l.proof) return { label: '\uD83D\uDCCE Proof attached', cls: 'mid' };
    return { label: 'Unverified', cls: 'dim' };
  }
  function points(l) { var p = Math.min(l.amount, 25) * 2; if (trust(l).cls === 'ok') p += 10; return p; }
  function rank(p) { return p >= 700 ? 'Diamond' : p >= 300 ? 'Gold' : p >= 100 ? 'Silver' : 'Bronze'; }
  function streak() {
    var days = {}; logs.forEach(function (l) { days[l.date] = 1; });
    var d = new Date(); if (!days[ymd(d)]) d.setDate(d.getDate() - 1);
    var n = 0; while (days[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function total() { return logs.reduce(function (s, l) { return s + points(l); }, 0); }

  function renderStats() {
    var p = total(), s = streak(), r = rank(p);
    $('statPoints').textContent = p; $('statRank').textContent = r; $('statStreak').textContent = s + (s === 1 ? ' day' : ' days');
    $('profPoints').textContent = p; $('profRank').textContent = r; $('profStreak').textContent = s + (s === 1 ? ' day' : ' days');
    var ach = [logs.length >= 1, s >= 3, p >= 100, logs.some(function (l) { return trust(l).cls === 'ok'; })];
    $('achCount').textContent = ach.filter(Boolean).length;
  }

  function renderBoard() {
    var rows = FRIENDS.concat([{ name: 'You', points: total() }]).sort(function (a, b) { return b.points - a.points; });
    $('leaderboard').innerHTML = rows.map(function (r) {
      return '<li><strong>' + esc(r.name) + '</strong> &middot; ' + r.points + ' pts &middot; ' + rank(r.points) + '</li>';
    }).join('');
  }

  function logHtml(l, withActions) {
    var t = trust(l);
    var h = '<li><strong>' + esc(l.skill) + '</strong>: ' + esc(l.note) + ' (' + l.amount + ') <span class="badge ' + t.cls + '">' + t.label + '</span>' +
            '<div class="meta">' + l.date + ' &middot; +' + points(l) + ' pts</div>';
    if (withActions) {
      h += '<div class="log-actions">';
      if (l.proof) h += '<a href="' + esc(l.proof) + '" target="_blank" rel="noopener noreferrer">View proof</a>';
      h += '<button class="endorse" data-id="' + l.id + '">Demo: classmate endorses (' + l.endorsements.length + ')</button></div>';
    }
    return h + '</li>';
  }

  function renderList() {
    var recent = logs.slice().reverse().slice(0, 8);
    $('skillLogList').innerHTML = recent.length ? recent.map(function (l) { return logHtml(l, true); }).join('')
      : '<li class="hint">No logs yet. Add your first one above.</li>';
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function maxStreak() {
    var ds = Object.keys(logs.reduce(function (o, l) { o[l.date] = 1; return o; }, {})).sort();
    var best = 0, run = 0, prev = null;
    ds.forEach(function (s) {
      var d = new Date(s + 'T00:00:00');
      if (prev && Math.round((d - prev) / 86400000) === 1) run++; else run = 1;
      if (run > best) best = run; prev = d;
    });
    return best;
  }
  // Heatmap for one selected year: each month is its own block, with a year picker (GitHub style)
  function renderCal() {
    var cur = new Date().getFullYear(), now = ymd(new Date()), count = {}, inYear = 0, active = 0, grid = '';
    logs.forEach(function (l) { count[l.date] = (count[l.date] || 0) + 1; });
    for (var m = 0; m < 12; m++) {
      var first = new Date(selYear, m, 1).getDay(), n = new Date(selYear, m + 1, 0).getDate();
      var weeks = Math.ceil((first + n) / 7), cols = '';
      for (var w = 0; w < weeks; w++) {
        var col = '';
        for (var r = 0; r < 7; r++) {
          var day = w * 7 + r - first + 1;
          if (day < 1 || day > n) { col += '<span class="heat-cell blank"></span>'; continue; }
          var key = selYear + '-' + pad(m + 1) + '-' + pad(day), c = count[key] || 0, future = key > now;
          if (c) { inYear += c; active++; }
          col += '<button type="button" class="heat-cell' + (future ? ' future' : '') + (c ? ' l' + Math.min(c, 4) : '') +
                 (key === now ? ' today' : '') + (key === picked ? ' picked' : '') + '" data-date="' + key +
                 '" title="' + c + ' log' + (c === 1 ? '' : 's') + ' on ' + key + '"></button>';
        }
        cols += '<div class="heat-week">' + col + '</div>';
      }
      grid += '<div class="heat-month" data-m="' + m + '"><div class="heat-weeks">' + cols + '</div><div class="heat-label">' + MONTHS[m] + '</div></div>';
    }
    $('calGrid').innerHTML = grid;
    $('heatYear').textContent = selYear; $('heatTotal').textContent = inYear;
    $('heatDays').textContent = active; $('heatMax').textContent = maxStreak();

    var minY = logs.reduce(function (a, l) { return Math.min(a, parseInt(l.date.slice(0, 4), 10)); }, cur - 2), yl = '';
    for (var y = cur; y >= minY; y--) yl += '<button type="button" class="year-btn' + (y === selYear ? ' active' : '') + '" data-year="' + y + '">' + y + '</button>';
    $('yearList').innerHTML = yl;

    var sc = $('heatScroll'), el = selYear === cur ? sc.querySelector('.heat-month[data-m="' + new Date().getMonth() + '"]') : null;
    sc.scrollLeft = el ? Math.max(0, el.offsetLeft + el.offsetWidth - sc.clientWidth) : 0;

    var day = logs.filter(function (l) { return l.date === picked; });
    $('calDayTitle').textContent = 'Activity on ' + picked;
    $('calDayList').innerHTML = day.length ? day.map(function (l) { return logHtml(l, false); }).join('') : '<li class="hint">Nothing logged on this day.</li>';
  }

  function renderAll() { renderStats(); renderBoard(); renderList(); renderCal(); }

  $('skillForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var proof = $('skillProof').value.trim();
    if (proof) { try { var u = new URL(proof); if (u.protocol !== 'http:' && u.protocol !== 'https:') throw 0; } catch (x) { toast('Proof must be an http(s) link'); return; } }
    logs.push({ id: 'l' + Date.now(), skill: $('skillName').value, note: $('skillNote').value.trim(),
      amount: Math.max(1, parseInt($('skillAmount').value, 10) || 1), date: ymd(new Date()), proof: proof, endorsements: [] });
    save(); this.reset(); picked = ymd(new Date()); renderAll(); toast('Log added');
  });

  $('skillLogList').addEventListener('click', function (e) {
    var b = e.target.closest('.endorse'); if (!b) return;
    var l = logs.filter(function (x) { return x.id === b.dataset.id; })[0]; if (!l) return;
    var next = MATES.filter(function (m) { return l.endorsements.indexOf(m) < 0; })[0];
    if (!next) { toast('All demo classmates already endorsed'); return; }
    l.endorsements.push(next); save(); renderAll();
  });

  $('calGrid').addEventListener('click', function (e) {
    var b = e.target.closest('.heat-cell'); if (!b) return; picked = b.dataset.date; renderCal();
  });

  $('yearList').addEventListener('click', function (e) {
    var b = e.target.closest('.year-btn'); if (!b) return;
    selYear = parseInt(b.dataset.year, 10);
    picked = selYear === new Date().getFullYear() ? ymd(new Date()) : selYear + '-01-01';
    renderCal();
  });

  renderAll();
})();