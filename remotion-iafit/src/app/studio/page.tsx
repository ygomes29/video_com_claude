"use client";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Film, Scissors } from "lucide-react";
import Link from "next/link";

/**
 * IAFIT Content Studio — product home.
 * Two modules: MOTION (existing Remotion editor) and CORTES (clipping engine).
 */
export default function StudioHomePage() {
  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      <header className="flex justify-between items-start py-8 px-12 shrink-0">
        <Header asLink />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          IAFIT Content Studio
        </h1>
        <p className="text-muted-foreground mb-12 text-center">
          Uma máquina única para criar, editar e renderizar conteúdo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <StudioCard
            icon={<Film className="w-6 h-6" />}
            title="Motion"
            description="Crie motion graphics com inteligência artificial."
            href="/studio/motion"
            cta="Abrir Motion"
          />
          <StudioCard
            icon={<Scissors className="w-6 h-6" />}
            title="Cortes"
            description="Transforme calls, treinamentos e reuniões em conteúdos."
            href="/studio/clips"
            cta="Criar Cortes"
          />
        </div>
      </div>
    </div>
  );
}

interface StudioCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}

function StudioCard({ icon, title, description, href, cta }: StudioCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-background-elevated p-8 transition-all hover:border-primary/60 hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/15 text-primary">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed flex-1">
        {description}
      </p>
      <Button
        variant="outline"
        className="self-start group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
      >
        {cta}
      </Button>
    </Link>
  );
}