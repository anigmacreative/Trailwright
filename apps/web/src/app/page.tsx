import Link from "next/link";
import { Button } from "@/ui";

export default function HomePage() {
  return (
    <div className="min-h-screen topo-background">
      <main className="container mx-auto px-6 py-16">
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
          <div className="max-w-4xl space-y-8">
            <h1 className="font-serif text-6xl font-bold leading-tight md:text-8xl">
              Plan your next{" "}
              <span className="italic text-olive">expedition</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-xl text-olive md:text-2xl">
              Adventure planning with minimal fuss. Collaborate seamlessly, 
              explore thoughtfully, journey deliberately.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="/app/trips">Start Planning</Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="/demo">Try Demo</Link>
              </Button>
            </div>
            
            <div className="pt-16">
              <div className="mx-auto aspect-video max-w-4xl rounded-2xl bg-clay/10 shadow-soft-lg">
                <div className="flex h-full items-center justify-center">
                  <p className="text-olive">Interactive Map Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <section className="py-32">
          <div className="grid gap-16 md:grid-cols-3">
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-2xl font-semibold">Collaborative</h3>
              <p className="text-olive">
                Invite your crew. Plan together. Everyone stays in sync with real-time updates.
              </p>
            </div>
            
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-2xl font-semibold">Intelligent</h3>
              <p className="text-olive">
                AI-powered suggestions and route optimization help craft the perfect itinerary.
              </p>
            </div>
            
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-2xl font-semibold">Exportable</h3>
              <p className="text-olive">
                Beautiful PDFs, calendar integration, and shareable links for every journey.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-clay/20 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-olive">
            © 2024 Trailwright. Every journey begins with a single step.
          </p>
        </div>
      </footer>
    </div>
  );
}