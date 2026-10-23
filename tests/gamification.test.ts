import test from 'node:test'
import assert from 'node:assert/strict'
import {
  answerQuestion,
  dailyChallenge,
  dueQuestions,
  emptyGameProgress,
  focusedQuestions,
  getRewards,
  localDay,
  parseGameProgress,
  practiceQuestions,
  practiceSummary,
  practiceHistory,
  recordAnswer,
  shiftDay,
  weeklySummary,
  toggleSavedQuestion,
} from '../src/utils/gamification.ts'
import { learningTopics } from '../src/utils/learningTopics.ts'

const today = '2026-10-23'

test('existing lesson completion earns deterministic XP without toggle or duplicate inflation', () => {
  assert.equal(getRewards([], []).xp, 0)
  assert.equal(getRewards(['routing', 'routing'], []).xp, 100)
  assert.equal(
    getRewards(['routing', 'middleware', 'caching'], ['url-state', 'url-state'])
      .xp,
    550,
  )
  const rewards = getRewards(['caching', 'optimistic'], [])
  assert.equal(rewards.level, 2)
  assert.equal(rewards.levelXp, 0)
  assert.equal(rewards.remainingXp, 500)
  assert.equal(getRewards(['caching'], []).xp, 250)
  const all = getRewards(
    learningTopics.map((topic) => topic.id),
    practiceQuestions.map((item) => item.id),
  )
  assert.equal(all.xp, 3100)
  assert.ok(all.badges.every((badge) => badge.current === badge.target))
})

test('incorrect answers award nothing; retries and repeated practice cannot multiply XP or daily count', () => {
  const empty = emptyGameProgress()
  assert.equal(answerQuestion(empty, 'url-state', 0, today), empty)
  const first = answerQuestion(empty, 'url-state', 1, today)
  assert.equal(getRewards([], first.mastered).xp, 50)
  assert.deepEqual(answerQuestion(first, 'url-state', 1, today), first)
  const nextDay = answerQuestion(first, 'url-state', 1, '2026-10-24')
  assert.equal(getRewards([], nextDay.mastered).xp, 50)
  assert.equal(practiceSummary(nextDay, '2026-10-24').streak, 2)
  assert.equal(practiceSummary(nextDay, '2026-10-24').todayCount, 1)
  assert.deepEqual(
    empty,
    emptyGameProgress(),
    'updates must not mutate the previous state',
  )
})

test('saved practice filters corrupt, unknown, duplicate, impossible, future and expired data', () => {
  for (const raw of [
    '',
    '{broken',
    'null',
    '[]',
    '{"version":2}',
    '{"version":1,"practiceDays":null}',
  ]) {
    assert.deepEqual(parseGameProgress(raw, today), emptyGameProgress())
  }
  const parsed = parseGameProgress(
    JSON.stringify({
      version: 1,
      dailyGoal: 99,
      mastered: ['url-state', 'url-state', 'unknown', 2],
      practiceDays: {
        '2026-02-30': ['url-state'],
        '2026-10-24': ['url-state'],
        '2025-10-22': ['url-state'],
        [today]: ['url-state', 'url-state', 'unknown'],
        '2026-10-22': {},
        __proto__: ['url-state'],
      },
    }),
    today,
  )
  assert.deepEqual(parsed, {
    saved: [],
    reviews: {},
    version: 1,
    dailyGoal: 2,
    weeklyGoal: 3,
    mastered: ['url-state'],
    practiceDays: { [today]: ['url-state'] },
  })
  for (const dailyGoal of [1, 2, 3])
    assert.equal(
      parseGameProgress(JSON.stringify({ version: 1, dailyGoal }), today)
        .dailyGoal,
      dailyGoal,
    )
})

test('review schedules advance only when due and never inflate rewards on early or repeated practice', () => {
  let state = recordAnswer(emptyGameProgress(), 'url-state', 1, today)
  assert.deepEqual(state.reviews['url-state'], {
    stage: 1,
    lastReviewed: today,
    due: '2026-10-24',
  })
  assert.deepEqual(recordAnswer(state, 'url-state', 1, today), state)
  assert.equal(dueQuestions(state, today).length, 0)
  assert.equal(dueQuestions(state, '2026-10-24').length, 1)
  state = recordAnswer(state, 'url-state', 1, '2026-10-24')
  assert.equal(state.reviews['url-state']?.due, '2026-10-27')
  const early = recordAnswer(state, 'url-state', 1, '2026-10-25')
  assert.deepEqual(early.reviews, state.reviews)
  assert.equal(early.practiceDays['2026-10-25']?.length, 1)
  for (const [day, due] of [
    ['2026-10-27', '2026-11-03'],
    ['2026-11-03', '2026-11-17'],
    ['2026-11-17', '2026-12-01'],
  ]) {
    state = recordAnswer(state, 'url-state', 1, day)
    assert.equal(state.reviews['url-state']?.due, due)
  }
  assert.equal(getRewards([], state.mastered).xp, 50)
  assert.deepEqual(dueQuestions(state, ''), [])
})

test('misses schedule a retry without XP or activity; recovery restarts spacing without removing mastery', () => {
  const empty = emptyGameProgress()
  for (const choice of [-1, 3, 0.5, NaN])
    assert.equal(recordAnswer(empty, 'url-state', choice, today), empty)
  assert.equal(recordAnswer(empty, 'url-state', 1, ''), empty)
  const missed = recordAnswer(empty, 'url-state', 0, today)
  assert.deepEqual(missed.practiceDays, {})
  assert.equal(getRewards([], missed.mastered).xp, 0)
  assert.equal(dueQuestions(missed, today)[0]?.id, 'url-state')
  const recovered = recordAnswer(missed, 'url-state', 1, today)
  assert.equal(recovered.reviews['url-state']?.due, '2026-10-24')
  const missedAgain = recordAnswer(recovered, 'url-state', 0, '2026-10-24')
  assert.equal(getRewards([], missedAgain.mastered).xp, 50)
  assert.equal(missedAgain.practiceDays['2026-10-24'], undefined)
  assert.equal(missedAgain.reviews['url-state']?.stage, 0)
  assert.deepEqual(empty, emptyGameProgress())
})

test('saved lists and schedules survive reload while old or corrupt saves retain earned progress', () => {
  const old = { version: 1, mastered: ['url-state'], dailyGoal: 1 }
  const migrated = parseGameProgress(JSON.stringify(old), today)
  assert.equal(dueQuestions(migrated, today)[0]?.id, 'url-state')
  assert.deepEqual(migrated.saved, [])
  const saved = toggleSavedQuestion(migrated, 'server-boundary')
  assert.equal(
    focusedQuestions(saved, today, 'saved')[0]?.id,
    'server-boundary',
  )
  assert.deepEqual(toggleSavedQuestion(saved, 'server-boundary').saved, [])
  assert.deepEqual(migrated.saved, [])
  const state = recordAnswer(saved, 'url-state', 1, today)
  assert.deepEqual(parseGameProgress(JSON.stringify(state), today), state)
  for (const entry of [
    null,
    [],
    { stage: -1 },
    { stage: 1, lastReviewed: '2026-02-30', due: '2026-03-01' },
    { stage: 1, lastReviewed: '2026-10-24', due: '2026-10-25' },
    { stage: 1.5, lastReviewed: today, due: '2026-10-24' },
    { stage: 1, lastReviewed: today, due: '2099-01-01' },
  ]) {
    const parsed = parseGameProgress(
      JSON.stringify({
        ...old,
        saved: ['url-state', 'unknown', 'url-state'],
        reviews: { 'url-state': entry, unknown: state.reviews['url-state'] },
      }),
      today,
    )
    assert.deepEqual(parsed.reviews, {})
    assert.deepEqual(parsed.saved, ['url-state'])
    assert.deepEqual(parsed.mastered, ['url-state'])
  }
})

test('practice calendar covers 28 local dates across boundaries and excludes activity outside its range', () => {
  const state = emptyGameProgress()
  state.practiceDays = {
    '2025-12-04': ['url-state'],
    '2025-12-05': ['url-state'],
    '2026-01-01': ['url-state', 'server-boundary'],
    '2026-01-02': ['url-state'],
  }
  const days = practiceHistory(state, '2026-01-01')
  assert.equal(days.length, 28)
  assert.deepEqual(days[0], { day: '2025-12-05', questions: ['url-state'] })
  assert.equal(days[1].questions.length, 0)
  assert.equal(days.at(-1)?.questions.length, 2)
  assert.equal(
    days.reduce((sum, day) => sum + day.questions.length, 0),
    3,
  )
  assert.ok(
    practiceHistory(state, '2024-03-01').some(
      ({ day }) => day === '2024-02-29',
    ),
  )
  assert.deepEqual(practiceHistory(state, ''), [])
})

test('streaks allow today to be unfinished, reset after a missed day and cross month/year/leap boundaries', () => {
  let state = emptyGameProgress()
  for (const day of ['2025-12-31', '2026-01-01', '2026-01-02'])
    state = answerQuestion(state, 'url-state', 1, day)
  assert.equal(practiceSummary(state, '2026-01-02').streak, 3)
  assert.equal(practiceSummary(state, '2026-01-03').streak, 3)
  assert.equal(practiceSummary(state, '2026-01-03').todayCount, 0)
  assert.equal(practiceSummary(state, '2026-01-04').streak, 0)
  assert.equal(practiceSummary(state, '2026-01-03').week.length, 7)
  assert.equal(shiftDay('2024-03-01', -1), '2024-02-29')
  assert.equal(shiftDay('2026-03-09', -1), '2026-03-08')
  assert.equal(localDay(new Date(2026, 9, 23, 23, 59)), today)
  assert.deepEqual(practiceSummary(state, ''), {
    streak: 0,
    todayCount: 0,
    week: [],
  })
})

test('retained history is bounded without losing all-time mastery', () => {
  const state = emptyGameProgress()
  for (let offset = 0; offset < 500; offset++)
    state.practiceDays[shiftDay(today, -offset)] = ['url-state']
  state.mastered = ['url-state']
  const parsed = parseGameProgress(JSON.stringify(state), today)
  assert.equal(Object.keys(parsed.practiceDays).length, 366)
  assert.deepEqual(parsed.mastered, ['url-state'])
})

test('each knowledge check has a real lesson, distinct options and a valid answer', () => {
  assert.equal(
    new Set(practiceQuestions.map((item) => item.id)).size,
    practiceQuestions.length,
  )
  for (const question of practiceQuestions) {
    assert.ok(learningTopics.some((topic) => topic.id === question.topic))
    assert.ok(question.answer >= 0 && question.answer < question.options.length)
    assert.equal(new Set(question.options).size, question.options.length)
  }
})

test('weekly settings migrate old saves and reject unsupported targets without losing progress', () => {
  const old = {
    version: 1,
    dailyGoal: 1,
    mastered: ['url-state'],
    practiceDays: { [today]: ['url-state'] },
  }
  for (const weeklyGoal of [undefined, null, 0, 4, 99, '5']) {
    const parsed = parseGameProgress(
      JSON.stringify({ ...old, weeklyGoal }),
      today,
    )
    assert.equal(parsed.weeklyGoal, 3)
    assert.equal(parsed.dailyGoal, 1)
    assert.deepEqual(parsed.mastered, ['url-state'])
    assert.deepEqual(parsed.practiceDays, old.practiceDays)
  }
  for (const weeklyGoal of [3, 5, 7]) {
    assert.equal(
      parseGameProgress(JSON.stringify({ ...old, weeklyGoal }), today)
        .weeklyGoal,
      weeklyGoal,
    )
  }
})

test('weekly missions count active days once, roll over on Monday, and retain best streaks', () => {
  let state = emptyGameProgress()
  for (const day of [
    '2026-10-15',
    '2026-10-16',
    '2026-10-17',
    '2026-10-18',
    '2026-10-20',
    '2026-10-22',
    today,
  ]) {
    state = answerQuestion(state, 'url-state', 1, day)
  }
  state = answerQuestion(state, 'server-boundary', 0, today)
  assert.deepEqual(weeklySummary(state, today), {
    start: '2026-10-19',
    end: '2026-10-25',
    activeDays: 3,
    checks: 4,
    bestStreak: 4,
  })
  assert.equal(weeklySummary(state, '2026-10-25').activeDays, 3)
  assert.equal(weeklySummary(state, '2026-10-26').activeDays, 0)
  assert.equal(weeklySummary(state, '2026-10-26').bestStreak, 4)
  assert.equal(weeklySummary(state, '2027-01-01').start, '2026-12-28')
  assert.equal(weeklySummary(state, '2027-01-01').end, '2027-01-03')
  assert.deepEqual(weeklySummary(state, ''), {
    start: '',
    end: '',
    activeDays: 0,
    checks: 0,
    bestStreak: 0,
  })
  assert.equal(weeklySummary(state, '2028-01-01').bestStreak, 0)
})

test('daily challenges are stable, rotate through the full bank and never duplicate checks', () => {
  assert.deepEqual(dailyChallenge(''), [])
  assert.deepEqual(dailyChallenge('2026-02-30'), [])
  const seen = new Set<string>()
  for (let index = 0; index < practiceQuestions.length; index++) {
    const day = shiftDay(today, index)
    const round = dailyChallenge(day)
    assert.equal(round.length, 3)
    assert.equal(new Set(round.map((question) => question.id)).size, 3)
    assert.deepEqual(dailyChallenge(day), round)
    assert.notDeepEqual(dailyChallenge(shiftDay(day, 1)), round)
    round.forEach((question) => seen.add(question.id))
  }
  assert.equal(seen.size, practiceQuestions.length)
  let state = emptyGameProgress()
  for (let replay = 0; replay < 3; replay++) {
    for (const question of dailyChallenge(today))
      state = answerQuestion(state, question.id, question.answer, today)
  }
  assert.equal(getRewards([], state.mastered).xp, 150)
  assert.equal(practiceSummary(state, today).todayCount, 3)
})

test('focused practice distinguishes mastery from today and recovers empty queues tomorrow', () => {
  const state = answerQuestion(emptyGameProgress(), 'url-state', 1, today)
  assert.equal(focusedQuestions(state, today, 'all').length, 6)
  assert.equal(focusedQuestions(state, today, 'unmastered').length, 5)
  assert.equal(focusedQuestions(state, today, 'today').length, 5)
  assert.equal(focusedQuestions(state, shiftDay(today, 1), 'today').length, 6)
  assert.equal(
    focusedQuestions(state, shiftDay(today, 1), 'unmastered').length,
    5,
  )
  let complete = state
  for (const question of practiceQuestions)
    complete = answerQuestion(complete, question.id, question.answer, today)
  assert.deepEqual(focusedQuestions(complete, today, 'unmastered'), [])
  assert.deepEqual(focusedQuestions(complete, today, 'today'), [])
  assert.equal(
    focusedQuestions(complete, shiftDay(today, 1), 'today').length,
    6,
  )
})
