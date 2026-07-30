import { useEffect, useState } from "react"

export type Config = {
  theme: keyof typeof themes
  radius: number
  gray: keyof typeof grays
}

export const themes = {
  primary: { label: "Default", activeColor: "hsl(0 0% 9%)", hsl: "0 0% 9%", foreground: "0 0% 98%" },
  red: { label: "Red", activeColor: "hsl(0 72.2% 50.6%)", hsl: "0 72.2% 50.6%", foreground: "0 0% 98%" },
  orange: { label: "Orange", activeColor: "hsl(24.6 95% 53.1%)", hsl: "24.6 95% 53.1%", foreground: "0 0% 98%" },
  amber: { label: "Amber", activeColor: "hsl(37.9 94.1% 52.7%)", hsl: "37.9 94.1% 52.7%", foreground: "0 0% 3.9%" },
  yellow: { label: "Yellow", activeColor: "hsl(47.9 95.8% 51.2%)", hsl: "47.9 95.8% 51.2%", foreground: "0 0% 3.9%" },
  lime: { label: "Lime", activeColor: "hsl(84.8 85.2% 44.5%)", hsl: "84.8 85.2% 44.5%", foreground: "0 0% 3.9%" },
  green: { label: "Green", activeColor: "hsl(142.1 76.2% 36.3%)", hsl: "142.1 76.2% 36.3%", foreground: "0 0% 98%" },
  emerald: { label: "Emerald", activeColor: "hsl(160.1 84.1% 39.4%)", hsl: "160.1 84.1% 39.4%", foreground: "0 0% 98%" },
  teal: { label: "Teal", activeColor: "hsl(173.4 80.4% 40%)", hsl: "173.4 80.4% 40%", foreground: "0 0% 98%" },
  cyan: { label: "Cyan", activeColor: "hsl(188.7 94.5% 42.7%)", hsl: "188.7 94.5% 42.7%", foreground: "0 0% 98%" },
  sky: { label: "Sky", activeColor: "hsl(198.6 93.8% 48.2%)", hsl: "198.6 93.8% 48.2%", foreground: "0 0% 98%" },
  blue: { label: "Blue", activeColor: "hsl(221.2 83.2% 53.3%)", hsl: "221.2 83.2% 53.3%", foreground: "0 0% 98%" },
  indigo: { label: "Indigo", activeColor: "hsl(239 84% 67%)", hsl: "239 84% 67%", foreground: "0 0% 98%" },
  violet: { label: "Violet", activeColor: "hsl(262.1 83.3% 57.8%)", hsl: "262.1 83.3% 57.8%", foreground: "0 0% 98%" },
  purple: { label: "Purple", activeColor: "hsl(271.5 81.3% 55.9%)", hsl: "271.5 81.3% 55.9%", foreground: "0 0% 98%" },
  fuchsia: { label: "Fuchsia", activeColor: "hsl(292.2 84.1% 60.6%)", hsl: "292.2 84.1% 60.6%", foreground: "0 0% 98%" },
  pink: { label: "Pink", activeColor: "hsl(322.2 93.9% 62.2%)", hsl: "322.2 93.9% 62.2%", foreground: "0 0% 98%" },
  rose: { label: "Rose", activeColor: "hsl(346.8 77.2% 49.8%)", hsl: "346.8 77.2% 49.8%", foreground: "0 0% 98%" },
}

export const grays = {
  zinc: { label: "Zinc", activeColor: "hsl(240 5.2% 33.9%)", hsl: "240 5.2% 33.9%" },
  slate: { label: "Slate", activeColor: "hsl(215.4 16.3% 46.9%)", hsl: "215.4 16.3% 46.9%" },
  stone: { label: "Stone", activeColor: "hsl(25 5.3% 44.7%)", hsl: "25 5.3% 44.7%" },
  gray: { label: "Gray", activeColor: "hsl(220 8.9% 46.1%)", hsl: "220 8.9% 46.1%" },
  neutral: { label: "Neutral", activeColor: "hsl(0 0% 45.1%)", hsl: "0 0% 45.1%" },
}

const defaultConfig: Config = {
  theme: "yellow",
  radius: 0.5,
  gray: "zinc",
}

export function useConfig() {
  const [config, setConfig] = useState<Config>(defaultConfig)

  useEffect(() => {
    const saved = localStorage.getItem("theme-config")
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse theme config", e)
      }
    }
  }, [])

  const updateConfig = (newConfig: Partial<Config>) => {
    const updated = { ...config, ...newConfig }
    setConfig(updated)
    localStorage.setItem("theme-config", JSON.stringify(updated))
  }

  return [config, updateConfig] as const
}
