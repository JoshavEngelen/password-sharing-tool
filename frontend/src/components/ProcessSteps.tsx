import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProcessStepsProps {
  title: string
  description: string
  steps: readonly string[]
  icon?: React.ReactNode
}

export function ProcessSteps({ title, description, steps }: ProcessStepsProps) {
  return (
    <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-slate-300">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => (
          <div key={step} className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-sky-50">
              {index + 1}
            </div>
            <p className="text-sm text-slate-300">{step}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
