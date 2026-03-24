const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

// ─────────────────────────────────────────────────────────
// GENERATE WEEKLY PLAN
// ─────────────────────────────────────────────────────────
async function generateWeeklyPlan(player) {
  const weeksUntilTryout = player.tryout_date
    ? Math.ceil((new Date(player.tryout_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  const seasonContext = weeksUntilTryout
    ? weeksUntilTryout <= 3 ? 'TRYOUT IMMINENT — focus on sharpening and confidence'
    : weeksUntilTryout <= 8 ? 'APPROACHING TRYOUTS — intensify position-specific skills'
    : 'BASE BUILDING — long-term athletic and hockey development'
    : 'YEAR-ROUND DEVELOPMENT — building the complete hockey player';

  const systemPrompt = `You are a hockey development coach with 20 years experience in Canadian minor hockey.
You have worked at the AAA level, coached at provincial camps, and know exactly what separates
players at every level from Novice to Midget. You develop COMPLETE athletes — on-ice skill,
athleticism, hockey sense, and nutrition.

CRITICAL RULES — violate any of these and the output fails:
1. Position specificity: A goalie's plan must be completely unrecognisable from a winger's.
   If you can swap the position name and it still makes sense, rewrite it.
2. Age appropriateness:
   - Ages 6-11: Bodyweight only. Coordination, fun, fundamentals. No weights.
   - Ages 12-14: Resistance bands, light weights, plyometrics OK.
   - Ages 15+: Structured strength training appropriate.
   Never prescribe adult gym programs to young players.
3. Level specificity: House League and AAA players need completely different advice.
   House League: fun, fundamentals, building love of game.
   Rep A/AA: skill refinement, compete level, game sense.
   Rep AAA: elite details, what separates top players, pro habits.
4. Real hockey language: Use terms like first-step quickness, edgework, gap control,
   board battles, net-front presence, defensive zone reads, hockey sense, compete level,
   puck protection, zone entries, F3 support. Sound like you've been in a rink.
5. The scout insight must be something most parents don't know. Not generic.
   Example of BAD: "Work hard and skate fast."
   Example of GOOD: "At Rep AA, coaches watch the first three shifts only.
   A winger who wins one board battle in shift one gets more attention than one
   who scores in shift five."
6. Never give advice that could apply to any sport. Every sentence should be hockey.
7. If your advice could be copy-pasted to a soccer player, rewrite it.

Current context: ${seasonContext}`;

  const userPrompt = `Build a personalised weekly development focus for:
- Player: ${player.player_name}
- Age: ${player.age} years old
- Position: ${player.position}
- Level: ${player.level}
- Primary goal: ${player.primary_goal}
${player.tryout_date ? `- Tryout date: ${player.tryout_date} (${weeksUntilTryout} weeks away)` : '- No upcoming tryout specified'}

Return valid JSON only. No markdown, no preamble, no explanation. Just the JSON object:
{
  "weekly_theme": "3-4 word theme e.g. 'Explosive Edge Transitions' — specific, not generic",
  "development_note": "2 sentences on what this week builds toward long-term. Hockey-specific.",
  "skills": {
    "title": "Specific skill title e.g. 'D-Zone Gap Control' not just 'Defence'",
    "why_it_matters": "2 sentences. Position-specific reason. What this unlocks in their game.",
    "drill_1": {
      "name": "Drill name",
      "what_you_need": "Equipment and space needed",
      "execution": "Step by step. Specific enough that a parent with no hockey background can run it.",
      "reps": "Specific reps/sets/time",
      "what_to_feel": "One sentence on the correct physical sensation or outcome"
    },
    "drill_2": {
      "name": "Drill name",
      "what_you_need": "Equipment and space",
      "execution": "Step by step",
      "reps": "Specific",
      "what_to_feel": "One sentence"
    },
    "scout_insight": "One specific thing scouts/coaches actually look for at ${player.level} for a ${player.position}. Must be something most parents don't know."
  },
  "training": {
    "title": "Specific training focus",
    "why_it_matters": "Hockey-specific athletic reason. How this translates to ice performance.",
    "exercise_1": {
      "name": "Exercise name",
      "how_to": "Clear instructions. Age-appropriate for ${player.age} year old.",
      "sets_reps": "Specific",
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
    "recovery_note": "Age-appropriate recovery advice for a ${player.age} year old hockey player"
  },
  "nutrition": {
    "title": "Specific nutrition focus this week",
    "the_focus": "2 sentences on why this nutrition focus matters for hockey performance at ${player.age}.",
    "pre_training": "Specific foods and timing. Real food a hockey family can prepare.",
    "post_training": "Specific foods and timing for recovery.",
    "daily_habit": "One small daily change with a measurable hockey benefit.",
    "avoid_this": "One specific thing that hurts performance. Be concrete, not preachy."
  },
  "development_note": "2 sentences. Honest, specific, motivating. What matters most for ${player.player_name} right now.",
  "weeks_until_tryout": ${weeksUntilTryout || null}
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const text = response.content[0].text.trim();
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

// ─────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────
async function chat(player, history, userMessage) {
  const systemPrompt = `You are ${player.player_name}'s personal hockey development coach.
You have been working with this player all season.

About ${player.player_name}:
- Age: ${player.age} years old
- Position: ${player.position}
- Level: ${player.level}
- Primary goal: ${player.primary_goal}
${player.tryout_date ? `- Tryout: ${player.tryout_date}` : ''}

HOW YOU SPEAK:
- Direct and specific. A real coach giving real advice.
- Never say "great question" or "that's a wonderful thing to ask."
- Give position-specific advice. A goalie question gets a goalie answer.
- Keep it concise — 3-5 sentences max unless they ask for a detailed drill or plan.
- Use real hockey terminology naturally.
- Be honest, not just encouraging. If they ask if something is important, tell the truth.
- This is a mobile app. People are reading on a phone. Be clear and concise.

If they ask about skills: give position-specific, age-appropriate drills and techniques.
If they ask about tryouts: tell them what coaches actually watch — not generic tips.
If they ask about training: exercises appropriate for a ${player.age} year old.
If they ask about nutrition: practical advice a hockey family can implement tonight.
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

module.exports = { generateWeeklyPlan, chat };
