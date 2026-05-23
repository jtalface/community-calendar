import type { ReactNode } from "react";

const styles = {
  green: "bg-leaf/10 text-leaf border-leaf/20",
  peach: "bg-peach/15 text-[#9b432b] border-peach/25",
  yellow: "bg-lemon/30 text-[#7c5b00] border-lemon/50",
  gray: "bg-white text-ink/70 border-ink/10",
  red: "bg-red-100 text-red-700 border-red-200"
};

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof styles }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}
