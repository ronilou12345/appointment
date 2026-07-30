import React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface StepperItem {
  title: string
  description: string
  icon?: React.ReactNode
}

interface StepperProps {
  items: StepperItem[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function Stepper({ items, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onStepClick?.(index)}
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-full border-2 transition-all",
                  index < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "border-primary bg-white text-primary"
                      : "border-muted bg-muted text-muted-foreground"
                )}
              >
                {item.icon ? (
                  <span className="size-5 flex items-center justify-center">{item.icon}</span>
                ) : index < currentStep ? (
                  <Check className="size-6" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}

                {index < currentStep && (
                  <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </span>
                )}
              </button>
              <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>

            {/* Connector Line */}
            {index < items.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2 mb-6 rounded transition-all",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
