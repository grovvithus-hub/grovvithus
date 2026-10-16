import {
  ClipboardCheck, Clapperboard, Code2, Globe, Image as ImageIcon, LayoutTemplate, Megaphone, MessageSquareQuote, Palette, PenLine, Rocket, Search,
  Server, ShieldCheck, ShoppingBag, Smartphone, Sparkles, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  ClipboardCheck, Clapperboard, Code2, Globe, Image: ImageIcon, LayoutTemplate, Megaphone, MessageSquareQuote, Palette, PenLine, Rocket, Search,
  Server, ShieldCheck, ShoppingBag, Smartphone, Sparkles,
};

export function Icon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const Cmp = ICONS[name] || Globe;
  return <Cmp className={className} aria-hidden="true" />;
}
