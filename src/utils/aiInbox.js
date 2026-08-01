/**
 * AI Inbox extraction service.
 *
 * Deterministic placeholder extractor so the UI/review workflow can ship
 * without an LLM. Replace internals (or inject a provider) later — keep the
 * return shape stable for UI compatibility.
 */

import { getTodayLocalDate, toLocalDateKey } from './dates'
import { addDays } from './planner'
import { UNCATEGORIZED_PROJECT_ID } from './projects'

export const AI_INBOX_PROVIDER = 'placeholder-v1'

const PRIORITY_HINTS = {
  High: /\b(urgent|asap|critical|immediately|eod|blocker)\b/i,
  Medium: /\b(important|priority|soon)\b/i,
  Low: /\b(whenever|someday|low priority|nice to have)\b/i,
}

function splitCandidateLines(text) {
  return String(text || '')
    .split(/\r?\n|[•●▪]|;(?=\s)/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function looksLikeAction(line) {
  if (line.length < 4 || line.length > 180) {
    return false
  }
  if (
    /^(hi|hello|hey|thanks|thank you|regards|best|from:|to:|subject:)/i.test(
      line,
    )
  ) {
    return false
  }
  return (
    /^(todo|task|action|follow[- ]?up|please|need to|we should|i('ll| will)|schedule|send|review|prepare|update|call|email|finish|complete|create|write|fix|pay|buy|drink|submit)\b/i.test(
      line,
    ) ||
    /^[-*]\s+/.test(line) ||
    /^\d+[.)]\s+/.test(line)
  )
}

function cleanTitle(line) {
  return line
    .replace(/^[-*•]+\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^(todo|task|action item|action)\s*[:\-–]\s*/i, '')
    .trim()
}

function suggestPriority(line) {
  if (PRIORITY_HINTS.High.test(line)) return 'High'
  if (PRIORITY_HINTS.Low.test(line)) return 'Low'
  if (PRIORITY_HINTS.Medium.test(line)) return 'Medium'
  return 'Medium'
}

function fromToday(todayKey) {
  const [y, m, d] = todayKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function suggestDueDate(line, today = getTodayLocalDate()) {
  if (/\btoday\b/i.test(line)) {
    return today
  }
  if (/\btomorrow\b/i.test(line)) {
    return toLocalDateKey(addDays(fromToday(today), 1))
  }
  if (/\bnext week\b/i.test(line)) {
    return toLocalDateKey(addDays(fromToday(today), 7))
  }
  const inDays = line.match(/\bin (\d+)\s*days?\b/i)
  if (inDays) {
    return toLocalDateKey(addDays(fromToday(today), Number(inDays[1])))
  }
  return null
}

function suggestProjectId(line, projects = []) {
  const lower = line.toLowerCase()
  const match = projects.find((project) => {
    if (!project?.name || project.archived || project.deleted) return false
    return lower.includes(String(project.name).toLowerCase())
  })
  return match?.id || UNCATEGORIZED_PROJECT_ID
}

/**
 * Extract reviewable task suggestions from freeform text.
 */
export function extractActionItems(rawText, { projects = [] } = {}) {
  const text = String(rawText || '').trim()
  if (!text) {
    return { provider: AI_INBOX_PROVIDER, suggestions: [] }
  }

  const today = getTodayLocalDate()
  const lines = splitCandidateLines(text)
  const suggestions = []
  const seen = new Set()

  lines.forEach((line, index) => {
    if (!looksLikeAction(line)) {
      return
    }
    const title = cleanTitle(line)
    if (!title || seen.has(title.toLowerCase())) {
      return
    }
    seen.add(title.toLowerCase())
    suggestions.push({
      id: `ai-suggestion-${Date.now()}-${index}`,
      title,
      priority: suggestPriority(line),
      dueDate: suggestDueDate(line, today),
      projectId: suggestProjectId(line, projects),
      sourceText: line,
      confidence: 0.72,
    })
  })

  if (suggestions.length === 0 && text.length <= 120 && !/\n/.test(text)) {
    suggestions.push({
      id: `ai-suggestion-${Date.now()}-0`,
      title: cleanTitle(text),
      priority: suggestPriority(text),
      dueDate: suggestDueDate(text, today),
      projectId: suggestProjectId(text, projects),
      sourceText: text,
      confidence: 0.45,
    })
  }

  return {
    provider: AI_INBOX_PROVIDER,
    suggestions,
  }
}
