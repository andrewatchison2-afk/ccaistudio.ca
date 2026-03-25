const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

// Derive Canadian hockey season from current month
function getHockeySeasonContext() {
  const month = new Date().getMonth() + 1; // 1-12
  const year = new Date().getFullYear();
  if (month >= 10 || month <= 2) return { season: 'IN-SEASON', note: 'Regular season is underway. Focus on weekly game performance, not long-term base building. Keep training load manageable — recovery matters as much as reps.' };
  if (month >= 3 && month <= 4)  return { season: 'PLAYOFFS / TRYOUT SEASON', note: 'Playoffs and spring tryouts. Sharpen skills that show up immediately in games. Confidence and compete level matter most right now.' };
  if (month >= 5 && month <= 8)  return { season: 'OFF-SEASON', note: 'No games — this is the best time to fix weaknesses and build athleticism. Push harder. Develop skills that aren\'t possible to work on in-season.' };
  if (month === 9)               return { season: 'PRE-SEASON / TRYOUT PREP', note: 'September is tryout month. Plans should sharpen what coaches see first: skating, compete level, and hockey sense. First impressions matter.' };
  return { season: 'DEVELOPMENT SEASON', note: 'Year-round development focus.' };
}

// ─────────────────────────────────────────────────────────
// GENERATE WEEKLY PLAN
// ─────────────────────────────────────────────────────────
async function generateWeeklyPlan(player) {
  const weeksUntilTryout = player.tryout_date
    ? Math.ceil((new Date(player.tryout_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  const tryoutContext = weeksUntilTryout
    ? weeksUntilTryout <= 0  ? 'TRYOUT THIS WEEK — mental readiness, light sharpening only, no fatigue'
    : weeksUntilTryout <= 3  ? 'TRYOUT IMMINENT — sharpen and build confidence, avoid overtraining'
    : weeksUntilTryout <= 8  ? 'APPROACHING TRYOUTS — intensify position-specific skills and compete habits'
    : 'BASE BUILDING — long-term athletic and hockey development toward tryouts'
    : null;

  const { season, note: seasonNote } = getHockeySeasonContext();
  const seasonContext = tryoutContext || `${season} — ${seasonNote}`;
  const today = new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  const systemPrompt = `You are a hockey development coach with 20 years experience in Canadian minor hockey.
You have worked at the AAA level, coached at provincial camps, and are certified under the Hockey Canada
Long-Term Athlete Development (LTAD) framework. You know exactly what separates players at every level
from Novice to Midget. You develop COMPLETE athletes — on-ice skill, athleticism, hockey sense, and nutrition.

Today is ${today}. Current hockey context: ${seasonContext}

CRITICAL RULES — violate any of these and the output fails:
1. SEASONAL AWARENESS: The season context above must shape every recommendation.
   In-season: manage load, focus on game-performance skills, no heavy training days before games.
   Off-season: push harder, address weaknesses, build athleticism.
   Pre-season/tryout: sharpen first-impression skills — skating, compete, hockey sense.
2. Position specificity: A goalie's plan must be completely unrecognisable from a winger's.
   If you can swap the position name and it still makes sense, rewrite it.
3. Age appropriateness (Hockey Canada LTAD standards):
   - Ages 6-9 (FUNdamentals): Basic movement, fun, no sport-specific overload. ABCs of movement.
   - Ages 10-11 (Learn to Train): Skill acquisition window. Fundamentals must be locked in now.
   - Ages 12-14 (Train to Train): Aerobic base, resistance bands, light weights, plyometrics OK.
   - Ages 15+ (Train to Compete): Structured strength training, sport-specific periodisation.
   Never prescribe adult gym programs to young players.
4. Level specificity: House League and AAA players need completely different advice.
   House League: fun, fundamentals, building love of game.
   Rep A/AA: skill refinement, compete level, game sense, what scouts notice.
   Rep AAA: elite details, pro habits, marginal gains, mental edge.
5. Real hockey language: edgework, first-step quickness, gap control, board battles,
   net-front presence, D-zone reads, F3 support, puck protection, zone entries, compete level.
6. Scout insights must be things most parents don't know — not generic effort clichés.
   BAD: "Work hard every shift."
   GOOD: "At Rep AA, coaches watch the first three shifts. A winger who wins one board battle
   in shift one gets more attention than one who scores in shift five."
7. Never give advice that could apply to any sport. Every sentence should be unmistakably hockey.
8. Drills should include one off-ice alternative (labelled) in case the player doesn't have ice access.
9. GENDER CONTEXT:
   Girls hockey: body contact is not part of the game at most levels — do not give board battle or
   physical contact advice. Scout insights should reference girls hockey pathways (U18 Nationals,
   JWHL, PWHL development). Training advice should follow female athlete LTAD timelines.
   Boys hockey: checking is introduced at Peewee AA/AAA and above — contact and positioning
   in battles is relevant. Scout insights reference OHL/WHL/QMJHL/USHL pathways at higher levels.`;

  const userPrompt = `Build a personalised weekly development focus for:
- Player: ${player.player_name}
- Gender: ${player.gender === 'girl' ? 'Girl' : 'Boy'}
- Age: ${player.age} years old
- Position: ${player.position}
- Level: ${player.level}
- Primary goal: ${player.primary_goal}
${player.tryout_date ? `- Tryout date: ${player.tryout_date} (${weeksUntilTryout} weeks away)` : '- No upcoming tryout specified'}

Return valid JSON only. No markdown, no preamble, no explanation. Just the raw JSON object:
{
  "weekly_theme": "3-5 word theme e.g. 'Explosive Edge Transitions' — specific and season-appropriate, not generic",
  "development_note": "2 sentences. What this week builds toward long-term AND why it matters now given the current season. Hockey-specific and honest.",
  "skills": {
    "title": "Specific skill title e.g. 'D-Zone Gap Control' not just 'Defence'",
    "why_it_matters": "2 sentences. Position-specific reason. What this unlocks in their game right now given the season.",
    "drill_1": {
      "name": "Drill name",
      "what_you_need": "Equipment and space needed. Include an off-ice alternative in parentheses if ice isn't available.",
      "execution": "Step by step. Specific enough that a parent with no hockey background can run it.",
      "reps": "Specific reps/sets/time",
      "what_to_feel": "One sentence on the correct physical sensation or outcome"
    },
    "drill_2": {
      "name": "Drill name",
      "what_you_need": "Equipment and space. Off-ice alternative in parentheses.",
      "execution": "Step by step",
      "reps": "Specific",
      "what_to_feel": "One sentence"
    },
    "scout_insight": "One specific thing scouts/coaches actually look for at ${player.level} for a ${player.position}. Must be something most parents don't know. One paragraph max."
  },
  "training": {
    "title": "Specific training focus appropriate for the current season",
    "why_it_matters": "Hockey-specific athletic reason. How this translates to ice performance right now.",
    "exercise_1": {
      "name": "Exercise name",
      "how_to": "Clear instructions. Age-appropriate for ${player.age} year old per Hockey Canada LTAD.",
      "sets_reps": "Specific — season-appropriate load (lighter in-season, heavier off-season)",
      "hockey_benefit": "Exactly how this helps their position on ice"
    },
    "exercise_2": {
      "name": "Exercise name",
      "how_to": "Clear instructions",
      "sets_reps": "Specific",
      "hockey_benefit": "Position-specific benefit"
    },
    "exercise_3": {
      "name": "Exercise name",
      "how_to": "Clear instructions",
      "sets_reps": "Specific",
      "hockey_benefit": "Position-specific benefit"
    },
    "recovery_note": "Age-appropriate recovery advice for a ${player.age} year old hockey player during ${season.toLowerCase()}"
  },
  "nutrition": {
    "title": "Specific nutrition focus for this season and week",
    "the_focus": "2 sentences on why this nutrition focus matters for hockey performance at ${player.age} right now.",
    "pre_training": "Specific foods and timing. Real food a hockey family can prepare.",
    "post_training": "Specific foods and timing for recovery.",
    "daily_habit": "One small daily change with a measurable hockey benefit.",
    "avoid_this": "One specific thing that hurts performance. Concrete, not preachy."
  },
  "weeks_until_tryout": ${weeksUntilTryout || null}
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2800,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const text = response.content[0].text.trim();
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (parseErr) {
    console.error('Plan JSON parse failed, retrying with stricter prompt:', parseErr.message);
    // Single retry: ask Claude to fix its own output
    const retryResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2800,
      system: 'You are a JSON repair tool. Return only valid, complete JSON. No markdown, no explanation.',
      messages: [
        { role: 'user', content: `This JSON is malformed or incomplete. Return the corrected, complete JSON only:\n\n${clean}` }
      ]
    });
    const retryText = retryResponse.content[0].text.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(retryText);
  }
}

// ─────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────
async function chat(player, history, userMessage) {
  const { season, note: seasonNote } = getHockeySeasonContext();
  const today = new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  const weeksUntilTryout = player.tryout_date
    ? Math.ceil((new Date(player.tryout_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  const systemPrompt = `You are ${player.player_name}'s personal hockey development coach.
You have been working with this player all season. You are certified under Hockey Canada's LTAD framework.

About ${player.player_name}:
- Gender: ${player.gender === 'girl' ? 'Girl' : 'Boy'}
- Age: ${player.age} years old
- Position: ${player.position}
- Level: ${player.level}
- Primary goal: ${player.primary_goal}
${player.tryout_date ? `- Tryout: ${player.tryout_date} (${weeksUntilTryout !== null ? weeksUntilTryout + ' weeks away' : 'upcoming'})` : ''}

Current context: ${today} — ${season}. ${seasonNote}
${player.player_notes ? `\nYour coaching notes on this player (accumulated over time):\n${player.player_notes}\n` : ''}
HOW YOU SPEAK:
- Direct and specific. A real coach giving real advice, not a chatbot.
- Never say "great question", "that's a wonderful thing to ask", or "certainly!"
- Give position-specific advice. A goalie question gets a goalie answer.
- Keep it concise — 3-5 sentences unless they explicitly ask for a detailed drill or plan.
- Use real hockey terminology naturally.
- Be honest. If something is hard, say it. Don't just encourage.
- This is a mobile app. People read on a phone. Short paragraphs, plain language.
- Factor in the current season: don't recommend heavy training loads during playoffs.

If they ask about skills: position-specific, age-appropriate drills and techniques.
If they ask about tryouts: what coaches actually watch — not generic effort tips.
If they ask about training: exercises appropriate for a ${player.age} year old per LTAD.
If they ask about nutrition: practical advice a hockey family can act on tonight.
If they ask what separates good players: be honest about compete level, consistency, coachability.`;

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.message })),
    { role: 'user', content: userMessage }
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages
  });

  return response.content[0].text;
}

// ─────────────────────────────────────────────────────────
// SUMMARIZE PLAYER — builds persistent coach's notes
// Called every 5 messages to accumulate long-term memory
// ─────────────────────────────────────────────────────────
async function summarizePlayer(player, allMessages, existingNotes) {
  const transcript = allMessages
    .map(m => `${m.role === 'user' ? 'Parent' : 'Coach'}: ${m.message}`)
    .join('\n');

  const prompt = `You are updating your private coaching notes on ${player.player_name}.

Player profile:
- ${player.gender === 'girl' ? 'Girl' : 'Boy'}, Age ${player.age}, ${player.position}, ${player.level}
- Goal: ${player.primary_goal}

${existingNotes ? `Your existing notes:\n${existingNotes}\n\n` : ''}Recent conversation:
${transcript}

Update your coaching notes. Write 4-6 sentences covering:
- Specific weaknesses or areas of focus this player/parent has mentioned
- Strengths or improvements noted
- Any concerns, context, or goals the parent has shared (e.g. upcoming tryout stress, confidence issues, specific skills to fix)
- Anything that should shape future advice for this player

Be specific and factual — these notes inform every future conversation. No generic filler.
Write in second person as if talking to yourself: "The parent mentioned...", "Player struggles with...", "Focus areas include..."`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text.trim();
}

module.exports = { generateWeeklyPlan, chat, summarizePlayer };
