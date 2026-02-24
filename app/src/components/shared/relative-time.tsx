"use client";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const parsed = new Date(date);
  const relative = formatDistanceToNow(parsed, { addSuffix: true });
  const absolute = parsed.toISOString();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <time
            dateTime={absolute}
            className={cn("cursor-default", className)}
          >
            {relative}
          </time>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {absolute}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
