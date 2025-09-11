"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the ComponentsCanvas component
 */
export interface ComponentsCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional title for the canvas */
  title?: string;
}

/**
 * A canvas component for displaying AI-generated components.
 * This component provides a dedicated space for Tambo AI to render dynamic components.
 * It includes the data-canvas-space attribute that other components detect.
 */
const ComponentsCanvas = React.forwardRef<HTMLDivElement, ComponentsCanvasProps>(
  ({ className, title = "Components Canvas", children, ...props }, ref) => {
    const [components, setComponents] = React.useState<Array<{
      id: string;
      component: React.ReactNode;
    }>>([]);

    // Listen for tambo:showComponent events
    React.useEffect(() => {
      const handleShowComponent = (event: CustomEvent) => {
        const { messageId, component } = event.detail;
        setComponents(prev => {
          // Remove existing component with same messageId if it exists
          const filtered = prev.filter(c => c.id !== messageId);
          // Add new component
          return [...filtered, { id: messageId, component }];
        });
      };

      window.addEventListener('tambo:showComponent', handleShowComponent as EventListener);
      
      return () => {
        window.removeEventListener('tambo:showComponent', handleShowComponent as EventListener);
      };
    }, []);

    return (
      <div
        ref={ref}
        className={cn(
          "h-full flex flex-col bg-background border-l border-border",
          "overflow-hidden",
          className
        )}
        data-canvas-space="true"
        {...props}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/50">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated components will appear here
          </p>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children ? (
            children
          ) : components.length > 0 ? (
            <div className="space-y-4">
              {components.map(({ id, component }) => (
                <div
                  key={id}
                  className="p-4 border border-border rounded-lg bg-background shadow-sm"
                >
                  {component}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <svg 
                    className="w-8 h-8" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1">Canvas Ready</p>
                <p className="text-xs">Components will appear here when generated</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ComponentsCanvas.displayName = "ComponentsCanvas";

export default ComponentsCanvas;
export { ComponentsCanvas };