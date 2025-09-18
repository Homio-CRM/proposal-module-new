import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ThemeExamples() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Color System Examples</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-700">Primary Colors</h3>
            <div className="flex gap-2">
              <div className="w-16 h-16 bg-primary-500 rounded"></div>
              <div className="w-16 h-16 bg-primary-600 rounded"></div>
              <div className="w-16 h-16 bg-primary-700 rounded"></div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary-700">Secondary Colors</h3>
            <div className="flex gap-2">
              <div className="w-16 h-16 bg-secondary-500 rounded"></div>
              <div className="w-16 h-16 bg-secondary-600 rounded"></div>
              <div className="w-16 h-16 bg-secondary-700 rounded"></div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-accent-700">Accent Colors</h3>
            <div className="flex gap-2">
              <div className="w-16 h-16 bg-accent-500 rounded"></div>
              <div className="w-16 h-16 bg-accent-600 rounded"></div>
              <div className="w-16 h-16 bg-accent-700 rounded"></div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-neutral-700">Neutral Colors</h3>
            <div className="flex gap-2">
              <div className="w-16 h-16 bg-neutral-500 rounded"></div>
              <div className="w-16 h-16 bg-neutral-600 rounded"></div>
              <div className="w-16 h-16 bg-neutral-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Button Examples</h2>
        <div className="flex gap-4 flex-wrap">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Skeleton Examples</h2>
        <div className="space-y-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Usage Instructions</h2>
        <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
          <p className="text-neutral-700">
            <strong>CSS Variables:</strong> Use <code className="bg-neutral-200 px-1 rounded">var(--primary-500)</code> in your CSS
          </p>
          <p className="text-neutral-700">
            <strong>Tailwind Classes:</strong> Use <code className="bg-neutral-200 px-1 rounded">bg-primary-500</code>, <code className="bg-neutral-200 px-1 rounded">text-primary-600</code>, etc.
          </p>
          <p className="text-neutral-700">
            <strong>Customization:</strong> Edit <code className="bg-neutral-200 px-1 rounded">lib/config/colors.ts</code> to change color values
          </p>
        </div>
      </div>
    </div>
  );
}
