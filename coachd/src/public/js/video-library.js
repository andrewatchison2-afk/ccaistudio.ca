// ─── COACHD VIDEO LIBRARY ────────────────────────────────────────────────────
// Curated YouTube video IDs for exercises and drills.
//
// HOW TO ADD A VIDEO:
// 1. Search YouTube using the hint in the comment next to each entry
// 2. Open the video, copy the ID from the URL: youtube.com/watch?v=XXXXXXX
// 3. Paste the ID (just the ID, not the full URL) as the value below
// 4. Save and deploy
//
// Leave as null to show no video for that exercise.
// ─────────────────────────────────────────────────────────────────────────────

var COACHD_VIDEO_LIBRARY = {

  // ── OFF-ICE EXERCISES ─────────────────────────────────────────────────────

  'lateral banded walks':       'HW9xLHrLhxI',
  'banded lateral walks':       'HW9xLHrLhxI',
  'lateral band walks':         'HW9xLHrLhxI',

  'skater jumps':               'Rs1zxDgyUXA',
  'skater hops':                'Rs1zxDgyUXA',
  'lateral bounds':             'Rs1zxDgyUXA',

  'single-leg box jumps':       'XRVSx_xr1_M',
  'single leg box jumps':       'XRVSx_xr1_M',
  'box jumps':                  'XRVSx_xr1_M',

  'hip flexor stretch':         '2PNT-FFKLgY',
  'hamstring stretch':          'T_l0AyZywjU',
  'glute bridges':              'X_IGw8U_e38',
  'single-leg glute bridge':    'n1IZ168x2Bw',
  'single leg glute bridge':    'n1IZ168x2Bw',
  'wall sits':                  'mDdLC-yKudY',
  'wall sit':                   'mDdLC-yKudY',
  'squat jumps':                '5xv0DKqe5XQ',
  'jump squats':                '5xv0DKqe5XQ',
  'lunges':                     'R0xGkawNULw',
  'lateral lunges':             'TnOkq6KfHsM',
  'split squats':               'SGHnCftrZkA',
  'bulgarian split squats':     'Fmjj7wFJWRE',
  'resistance band squats':     'ExfeIVSC1HU',
  'plank':                      'pvIjsG5Svck',
  'side plank':                 'N_s9em1xTqU',
  'dead bugs':                  'Aoipu_fl3HA',
  'dead bug':                   'Aoipu_fl3HA',
  'mountain climbers':          'hZb6jTbCLeE',
  'mountain climber':           'hZb6jTbCLeE',
  'agility ladder':             '5pQ0M0-DQ8o',
  'dot drills':                 'EXh_DLRSs8s',
  'stickhandling':              'HylGXDf8l2g',
  'wrist shots':                'HQY14pYYWuQ',
  'wrist shot':                 'HQY14pYYWuQ',

  // ── ON-ICE SKILLS ─────────────────────────────────────────────────────────

  'inside-outside edge slalom': 'vvK7vDyt_Nk',
  'edge slalom':                'vvK7vDyt_Nk',
  'edge control':               'MPrerhyHllA',

  'stop-and-explode starts':    '0S9WY7TDQ6s',
  'stop and explode':           '0S9WY7TDQ6s',
  'quick starts':               '2gjDjiWysok',
  'explosive starts':           '2gjDjiWysok',
  'first step quickness':       'hk6L2a8ORgQ',

  'c-cuts':                     'J31_vNGLhEY',
  'c cuts':                     'J31_vNGLhEY',
  'sculling':                   null,  // search: "hockey sculling skating drill"
  'crossovers':                 '72V8Rjg9HCE',
  'backwards skating':          'iTbZ8ANiNjs',
  'backward skating':           'iTbZ8ANiNjs',
  'pivots':                     'hYwW6-tM20s',
  'pivot':                      'hYwW6-tM20s',
  'tight turns':                'o7TrmZqMNLE',
  'tight turn':                 'o7TrmZqMNLE',
  'mohawk turns':               null,  // search: "hockey mohawk turn skating"
  'power skating':              '6vwJY204dMM',

  'puck protection':            'aS3K2ElKo7g',
  'stickhandling in tight spaces': 'x16lZM7wJZs',
  'shooting off the pass':      'PCgQecgPwq0',
  'backhand shots':             'SzDwv42yo1w',
  'backhand shot':              'SzDwv42yo1w',
  'one-timers':                 'ontouu7GfS4',
  'one timers':                 'ontouu7GfS4',
  'one-timer':                  'ontouu7GfS4',
  'faceoffs':                   'SA9J-J6QMuQ',
  'faceoff':                    'SA9J-J6QMuQ',
  'gap control':                'me2WaE5IoTk',
  'angling':                    'J60uvvgMZcY',
};

// ─── MATCHING LOGIC ──────────────────────────────────────────────────────────
window.coachd = window.coachd || {};
window.coachd.getVideo = function (exerciseName) {
  if (!exerciseName) return null;
  var normalized = exerciseName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // 1. Direct match
  for (var key in COACHD_VIDEO_LIBRARY) {
    if (normalized === key && COACHD_VIDEO_LIBRARY[key]) {
      return COACHD_VIDEO_LIBRARY[key];
    }
  }

  // 2. Keyword match — require at least 2 words in common (or full single-word match)
  for (var key in COACHD_VIDEO_LIBRARY) {
    if (!COACHD_VIDEO_LIBRARY[key]) continue;
    var keyWords = key.split(' ').filter(function (w) { return w.length > 3; });
    if (keyWords.length === 0) continue;
    var matches = keyWords.filter(function (w) { return normalized.indexOf(w) !== -1; });
    if (matches.length >= Math.min(2, keyWords.length)) {
      return COACHD_VIDEO_LIBRARY[key];
    }
  }

  return null;
};
