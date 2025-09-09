"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardGroupProps {
  children: React.ReactNode;
  title?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function CardGroup({
  children,
  title,
  columns = 2,
  className,
}: CardGroupProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  // Handle dynamic loading state in Tambo - children can be empty initially
  const validChildren = React.Children.toArray(children).filter(
    (child) => {
      if (React.isValidElement(child)) {
        return true;
      }
      // In Tambo, objects might be passed during loading - handle gracefully
      if (typeof child === 'object' && child !== null) {
        return false;
      }
      return false;
    }
  );

  // Show loading state when no children are present (common in Tambo)
  if (validChildren.length === 0) {
    return (
      <div className={cn("grid gap-4", className)}>
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        <div className="text-center text-muted-foreground py-8">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      <div className={cn("grid gap-4", gridCols[columns])}>
        {validChildren}
      </div>
    </div>
  );
}

// Legacy export for backward compatibility
export { CardGroup as RepoCardGroup };

// Convenience wrapper for repositories
interface RepoCardGroupProps {
  repositories?: any[];
  title?: string;
  columns?: 1 | 2 | 3;
  className?: string;
  renderCard: (repo: any, index: number) => React.ReactNode;
}

export function RepoCardGroupWrapper({
  repositories = [],
  title,
  columns = 2,
  className,
  renderCard,
}: RepoCardGroupProps) {
  if (repositories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No repositories found.
      </div>
    );
  }

  return (
    <CardGroup title={title} columns={columns} className={className}>
      {repositories.map((repo, index) => renderCard(repo, index))}
    </CardGroup>
  );
}