import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  icon,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10", className)}>
      <div>
        {icon && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              {icon}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-4">
          {actions}
        </div>
      )}
    </div>
  );
}
