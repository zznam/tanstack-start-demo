export type ScenarioReport = {
  title: string
  summary: string
  metrics: { label: string; value: string }[]
  steps: { label: string; detail: string }[]
}
