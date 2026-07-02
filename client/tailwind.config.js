/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Los formularios (REG-SIS-011 / REG-SIS-007) usan `font-serif`. Lo fijamos a
      // Times New Roman para que TODO el documento use la misma tipografía (como el
      // formulario oficial) y no se mezclen fuentes.
      fontFamily: {
        serif: ['"Times New Roman"', 'Times', 'serif'],
      },
      // ── Tokens shadcn/ui — namespaced con prefijo --sh- para no colisionar
      //    con las variables legacy (--primary/--border/--secondary) del tema actual.
      colors: {
        border: "hsl(var(--sh-border))",
        input: "hsl(var(--sh-input))",
        ring: "hsl(var(--sh-ring))",
        background: "hsl(var(--sh-background))",
        foreground: "hsl(var(--sh-foreground))",
        primary: {
          DEFAULT: "hsl(var(--sh-primary))",
          foreground: "hsl(var(--sh-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--sh-secondary))",
          foreground: "hsl(var(--sh-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--sh-destructive))",
          foreground: "hsl(var(--sh-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--sh-muted))",
          foreground: "hsl(var(--sh-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--sh-accent))",
          foreground: "hsl(var(--sh-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--sh-popover))",
          foreground: "hsl(var(--sh-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--sh-card))",
          foreground: "hsl(var(--sh-card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--sh-radius)",
        md: "calc(var(--sh-radius) - 2px)",
        sm: "calc(var(--sh-radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('daisyui'),
  ],
  daisyui: {
    themes: ["light"], // Keeping it light by default to not clash heavily with custom css
  },
}
