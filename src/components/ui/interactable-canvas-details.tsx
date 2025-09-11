"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the InteractableCanvasDetails component
 */
export interface InteractableCanvasDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The selected interactable component details */
  selectedComponent?: {
    id: string;
    name: string;
    props?: Record<string, unknown>;
    description?: string;
  };
}

/**
 * A component that displays details about the currently selected interactable component.
 * This provides a detailed view of component properties and allows for inspection.
 */
export const InteractableCanvasDetails = React.forwardRef<
  HTMLDivElement,
  InteractableCanvasDetailsProps
>(({ className, selectedComponent, children, ...props }, ref) => {
  if (!selectedComponent && !children) {
    return (
      <div
        ref={ref}
        className={cn(
          "p-4 bg-muted/50 border border-border rounded-lg",
          "flex items-center justify-center min-h-[200px]",
          className
        )}
        {...props}
      >
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">No Component Selected</p>
          <p className="text-xs">Select an interactable component to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "p-4 bg-background border border-border rounded-lg space-y-4",
        className
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        selectedComponent && (
          <>
            {/* Component Header */}
            <div className="border-b border-border pb-3">
              <h3 className="font-semibold text-foreground">
                {selectedComponent.name}
              </h3>
              {selectedComponent.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedComponent.description}
                </p>
              )}
            </div>

            {/* Component ID */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Component ID
              </label>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">
                {selectedComponent.id}
              </p>
            </div>

            {/* Component Props */}
            {selectedComponent.props && Object.keys(selectedComponent.props).length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Properties
                </label>
                <div className="mt-2 space-y-2">
                  {Object.entries(selectedComponent.props).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        {key}
                      </span>
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">
                        {typeof value === 'object' 
                          ? JSON.stringify(value, null, 2)
                          : String(value)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
});

InteractableCanvasDetails.displayName = "InteractableCanvasDetails";

export default InteractableCanvasDetails;