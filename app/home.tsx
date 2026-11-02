import type { ReactNode } from "react";
import { CaseLayer } from "@/components/case";
import { PageLayer } from "@/components/page/PageLayer";
import { Footer } from "@/components/scenes/Footer";
import { Hero } from "@/components/scenes/Hero";
import { Scene2 } from "@/components/scenes/Scene2";
import { Scene3 } from "@/components/scenes/Scene3";
import { Scene4 } from "@/components/scenes/Scene4";
import { Scene5 } from "@/components/scenes/Scene5";
import { Scene6 } from "@/components/scenes/Scene6";
import { PathMap } from "@/components/ui/PathMap";
import { SceneLabel } from "@/components/ui/SceneLabel";
import type { Page } from "@/lib/caseRoute";

// Главная: сцены и слои поверх них. Весь сайт — одно приложение: главная смонтирована всегда, остальные
// адреса — слои над ней (PageLayer — список работ, документы, 404; CaseLayer — кейс) со сменой адреса
// через history.pushState. Статические страницы этих адресов рисуют её же с уже открытым слоем.
export function HomeMain({
  caseSlug,
  page,
  children,
}: {
  caseSlug?: string;
  page?: Page;
  children?: ReactNode;
}) {
  return (
    <>
      <main>
        {children}
        <Hero />
        {/* Подпись сцены в шапке — сразу за шапкой и меню (они в Hero), до сцен и футера: футер
            закрывает её вместе с шапкой. */}
        <SceneLabel />
        {/* Карта пути слева — тоже до сцен: Tab идёт шапка → карта → сцены. */}
        <PathMap />
        <Scene2 />
        <Scene3 />
        <Scene4 />
        <Scene5 />
        <Scene6 />
        <Footer />
      </main>
      <PageLayer initial={page} />
      <CaseLayer initial={caseSlug} />
    </>
  );
}
