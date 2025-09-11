"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for individual tab items
 */
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

/**
 * Props for the InteractableTabs component
 */
export interface InteractableTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab ID */
  activeTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Default tab to show if no activeTab is provided */
  defaultTab?: string;
  /** Orientation of tabs */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * A flexible tabs component for organizing interactable content.
 * Supports both horizontal and vertical orientations with keyboard navigation.
 */
export const InteractableTabs = React.forwardRef<HTMLDivElement, InteractableTabsProps>(
  ({ 
    className, 
    tabs, 
    activeTab, 
    onTabChange, 
    defaultTab, 
    orientation = 'horizontal',
    ...props 
  }, ref) => {
    const [internalActiveTab, setInternalActiveTab] = React.useState<string>(
      activeTab || defaultTab || tabs[0]?.id || ''
    );

    const currentActiveTab = activeTab || internalActiveTab;

    const handleTabChange = React.useCallback((tabId: string) => {
      if (tabs.find(tab => tab.id === tabId && !tab.disabled)) {
        setInternalActiveTab(tabId);
        onTabChange?.(tabId);
      }
    }, [tabs, onTabChange]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent, tabId: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTabChange(tabId);
      }
    }, [handleTabChange]);

    if (tabs.length === 0) {
      return (
        <div
          ref={ref}
          className={cn("p-4 text-center text-muted-foreground", className)}
          {...props}
        >
          No tabs available
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === 'vertical' ? "flex-row h-full" : "flex-col",
          className
        )}
        {...props}
      >
        {/* Tab List */}
        <div
          className={cn(
            "flex",
            orientation === 'vertical' 
              ? "flex-col border-r border-border min-w-[200px]" 
              : "flex-row border-b border-border",
            "bg-muted/50"
          )}
          role="tablist"
          aria-orientation={orientation}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === currentActiveTab;
            const isDisabled = tab.disabled;
            
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                disabled={isDisabled}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  orientation === 'vertical' 
                    ? "text-left justify-start w-full" 
                    : "text-center",
                  isActive
                    ? "bg-background text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                )}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div
          className={cn(
            "flex-1 overflow-auto",
            orientation === 'vertical' ? "" : "min-h-0"
          )}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              id={`tabpanel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              className={cn(
                "h-full",
                tab.id === currentActiveTab ? "block" : "hidden"
              )}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

InteractableTabs.displayName = "InteractableTabs";

/**
 * Hook for managing tab state externally
 */
export function useInteractableTabs(initialTab?: string) {
  const [activeTab, setActiveTab] = React.useState<string>(initialTab || '');
  
  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return {
    activeTab,
    onTabChange: handleTabChange,
    setActiveTab,
  };
}

export default InteractableTabs;