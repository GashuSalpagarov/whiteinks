import { Footer } from "@/components/scenes/Footer";
import { Hero } from "@/components/scenes/Hero";
import { Scene2 } from "@/components/scenes/Scene2";
import { Scene3 } from "@/components/scenes/Scene3";
import { Scene4 } from "@/components/scenes/Scene4";
import { Scene5 } from "@/components/scenes/Scene5";
import { Scene6 } from "@/components/scenes/Scene6";

export default function Home() {
  return (
    <main>
      <Hero />
      <Scene2 />
      <Scene3 />
      <Scene4 />
      <Scene5 />
      <Scene6 />
      <Footer />
    </main>
  );
}
