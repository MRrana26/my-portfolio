import Hero from "@/components/Hero";
import ProjectsHomePage from "./projects/page";
import TechStack from "./techStack/page";
import ExperienceHomePage from "./experience/page";


export default function Home() {
  return (
    <div>
      <Hero />
      <ProjectsHomePage />
      <TechStack />
      <ExperienceHomePage />
    </div>
  );
}
