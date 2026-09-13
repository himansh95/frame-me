import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StepCard({
  step,
  title,
  description,
  done,
  className,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  done?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("w-full text-left", className)}>
      <CardHeader className="flex-row items-center gap-3 border-b pb-4">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
            done
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          {done ? <Check className="size-4" /> : step}
        </span>
        <div className="flex flex-col gap-0.5">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
