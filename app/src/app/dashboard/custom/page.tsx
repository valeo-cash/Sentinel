"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { WIDGET_REGISTRY, getWidgetComponent } from "@/components/widgets";
import type { WidgetLayout } from "@/lib/api";
import { Plus, Save, RotateCcw, X, LayoutGrid } from "lucide-react";
import { GridLayout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";

const PRESETS: Record<string, { name: string; widgets: WidgetLayout[] }> = {
  cfo: {
    name: "CFO View",
    widgets: [
      { i: "w1", x: 0, y: 0, w: 3, h: 3, type: "spend-overview" },
      { i: "w2", x: 3, y: 0, w: 3, h: 3, type: "payment-count" },
      { i: "w3", x: 6, y: 0, w: 3, h: 3, type: "active-agents" },
      { i: "w4", x: 0, y: 3, w: 6, h: 4, type: "spend-over-time" },
      { i: "w5", x: 6, y: 3, w: 6, h: 4, type: "budget-usage" },
      { i: "w6", x: 0, y: 7, w: 6, h: 5, type: "top-endpoints" },
    ],
  },
  security: {
    name: "Security View",
    widgets: [
      { i: "w1", x: 0, y: 0, w: 6, h: 5, type: "alert-feed" },
      { i: "w2", x: 6, y: 0, w: 6, h: 5, type: "agent-leaderboard" },
      { i: "w3", x: 0, y: 5, w: 6, h: 5, type: "recent-payments" },
      { i: "w4", x: 6, y: 5, w: 3, h: 3, type: "active-agents" },
    ],
  },
  engineering: {
    name: "Engineering View",
    widgets: [
      { i: "w1", x: 0, y: 0, w: 3, h: 3, type: "active-agents" },
      { i: "w2", x: 3, y: 0, w: 3, h: 3, type: "payment-count" },
      { i: "w3", x: 0, y: 3, w: 6, h: 4, type: "spend-by-agent" },
      { i: "w4", x: 6, y: 0, w: 6, h: 4, type: "spend-by-network" },
      { i: "w5", x: 6, y: 4, w: 6, h: 4, type: "spend-by-category" },
    ],
  },
};

export default function CustomDashboardPage() {
  const { api } = useAuth();
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [name, setName] = useState("My Dashboard");
  const [widgets, setWidgets] = useState<WidgetLayout[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [loading]);

  useEffect(() => {
    api
      .getCustomDashboards()
      .then((dashboards) => {
        if (dashboards.length > 0) {
          const d = dashboards[0]!;
          setDashboardId(d.id);
          setName(d.name);
          setWidgets(d.layout ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (dashboardId) {
        await api.updateCustomDashboard(dashboardId, { name, layout: widgets });
      } else {
        const d = await api.createCustomDashboard({ name, layout: widgets });
        setDashboardId(d.id);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  }, [api, dashboardId, name, widgets]);

  const addWidget = useCallback(
    (type: string) => {
      const def = WIDGET_REGISTRY.find((w) => w.type === type);
      if (!def) return;
      const id = `w${Date.now()}`;
      setWidgets((prev) => [
        ...prev,
        { i: id, x: 0, y: Infinity, w: def.defaultW, h: def.defaultH, type },
      ]);
      setPickerOpen(false);
    },
    []
  );

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.i !== id));
  }, []);

  const handleLayoutChange = useCallback(
    (layout: readonly { i: string; x: number; y: number; w: number; h: number }[]) => {
      setWidgets((prev) =>
        prev.map((w) => {
          const l = layout.find((item) => item.i === w.i);
          return l ? { ...w, x: l.x, y: l.y, w: l.w, h: l.h } : w;
        })
      );
    },
    []
  );

  const loadPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setWidgets(preset.widgets);
    setName(preset.name);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-card-hover rounded" />
          <div className="h-64 bg-card-hover rounded" />
        </div>
      </div>
    );
  }

  // Empty state with preset options
  if (widgets.length === 0 && !pickerOpen) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-2">Custom Dashboard</h1>
        <p className="text-sm text-muted mb-8">
          Build your own dashboard by adding widgets, or start from a preset.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => loadPreset(key)}
              className="rounded-xl border border-border bg-card p-6 text-left hover:border-accent/40 transition-colors"
            >
              <LayoutGrid className="w-5 h-5 text-muted mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{preset.name}</h3>
              <p className="text-xs text-muted">{preset.widgets.length} widgets</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
          Start from scratch
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" ref={containerRef}>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xl font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 p-0"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Widget
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Layout"}
          </button>
          <button
            type="button"
            onClick={() => setWidgets([])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Widget picker modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl mx-4 rounded-xl border border-border bg-card p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Add Widget</h2>
              <button type="button" onClick={() => setPickerOpen(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {WIDGET_REGISTRY.map((w) => (
                <button
                  key={w.type}
                  type="button"
                  onClick={() => addWidget(w.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-background hover:border-accent/40 transition-colors"
                >
                  <w.icon className="w-5 h-5 text-muted" />
                  <span className="text-xs text-foreground font-medium">{w.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid layout */}
      <GridLayout
        cols={12}
        rowHeight={40}
        width={containerWidth}
        layout={widgets.map((w) => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h }))}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        isResizable
        isDraggable
      >
        {widgets.map((w) => {
          const Component = getWidgetComponent(w.type);
          return (
            <div key={w.i} className="widget-drag-handle cursor-grab active:cursor-grabbing">
              {Component ? <Component onRemove={() => removeWidget(w.i)} /> : null}
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
}
