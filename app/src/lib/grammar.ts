/**
 * Grammar feedback for short writing. LanguageTool's public endpoint is free and
 * answers cross-origin, so the learner gets a correction without any server of ours.
 * If it is unreachable, the caller still has the model answer to compare against.
 */

export type Miss = { message: string; offset: number; length: number; better: string[] }

const ENDPOINT = 'https://api.languagetool.org/v2/check'

export async function checkEnglish(text: string): Promise<{ matches: Miss[]; failed: boolean }> {
  const body = new URLSearchParams({ text, language: 'en-US' })
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) return { matches: [], failed: true }
    const data = (await res.json()) as { matches?: { message: string; offset: number; length: number; replacements?: { value: string }[] }[] }
    const matches = (data.matches ?? []).map((m) => ({
      message: m.message,
      offset: m.offset,
      length: m.length,
      better: (m.replacements ?? []).slice(0, 2).map((r) => r.value),
    }))
    return { matches, failed: false }
  } catch {
    return { matches: [], failed: true }
  }
}
