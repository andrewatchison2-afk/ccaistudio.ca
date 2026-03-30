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

  'skater jumps':               null,  // search: "skater jumps lateral bounds exercise"
  'skater hops':                null,  // search: "skater jumps lateral bounds exercise"
  'lateral bounds':             null,  // search: "skater jumps lateral bounds exercise"

  'single-leg box jumps':       null,  // search: "single leg box jump tutorial"
  'single leg box jumps':       null,  // search: "single leg box jump tutorial"
  'box jumps':                  null,  // search: "box jump tutorial plyometric"

  'hip flexor stretch':         null,  // search: "hip flexor stretch tutorial"
  'hamstring stretch':          null,  // search: "hamstring stretch tutorial"
  'glute bridges':              null,  // search: "glute bridge exercise tutorial"
  'single-leg glute bridge':    null,  // search: "single leg glute bridge tutorial"
  'wall sits':                  null,  // search: "wall sit exercise tutorial"
  'squat jumps':                null,  // search: "squat jump plyometric tutorial"
  'jump squats':                null,  // search: "squat jump plyometric tutorial"
  'lunges':                     null,  // search: "lunge exercise tutorial hockey"
  'lateral lunges':             null,  // search: "lateral lunge tutorial"
  'split squats':               null,  // search: "split squat tutorial"
  'bulgarian split squats':     null,  // search: "bulgarian split squat tutorial"
  'resistance band squats':     null,  // search: "resistance band squat tutorial"
  'plank':                      null,  // search: "plank exercise tutorial core"
  'side plank':                 null,  // search: "side plank tutorial core"
  'dead bugs':                  null,  // search: "dead bug exercise core tutorial"
  'mountain climbers':          null,  // search: "mountain climbers exercise tutorial"
  'agility ladder':             null,  // search: "agility ladder drills hockey"
  'dot drills':                 null,  // search: "dot drills hockey agility"
  'stickhandling':              null,  // search: "hockey stickhandling drills off ice"
  'wrist shots':                null,  // search: "hockey wrist shot technique"

  // ── ON-ICE SKILLS ─────────────────────────────────────────────────────────

  'inside-outside edge slalom': null,  // search: "hockey edge work drills inside outside"
  'edge slalom':                null,  // search: "hockey edge work drills inside outside"
  'edge control':               null,  // search: "hockey edge control drills"

  'stop-and-explode starts':    null,  // search: "hockey stop and start skating drill"
  'stop and explode':           null,  // search: "hockey stop and start skating drill"
  'quick starts':               null,  // search: "hockey explosive starts skating"
  'first step quickness':       null,  // search: "hockey first step quickness skating"

  'c-cuts':                     null,  // search: "hockey c-cut skating drill"
  'sculling':                   null,  // search: "hockey sculling skating drill"
  'crossovers':                 null,  // search: "hockey crossover skating drill"
  'backwards skating':          null,  // search: "hockey backwards skating drill"
  'pivots':                     null,  // search: "hockey pivot skating drill"
  'tight turns':                null,  // search: "hockey tight turn skating drill"
  'mohawk turns':               null,  // search: "hockey mohawk turn skating"
  'power skating':              null,  // search: "hockey power skating drills"

  'puck protection':            null,  // search: "hockey puck protection drill"
  'stickhandling in tight spaces': null, // search: "hockey stickhandling tight spaces"
  'shooting off the pass':      null,  // search: "hockey shooting off pass drill"
  'backhand shots':             null,  // search: "hockey backhand shot technique"
  'one-timers':                 null,  // search: "hockey one timer shooting drill"
  'faceoffs':                   null,  // search: "hockey faceoff technique drill"
  'gap control':                null,  // search: "hockey gap control defense drill"
  'angling':                    null,  // search: "hockey angling defense technique"
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
