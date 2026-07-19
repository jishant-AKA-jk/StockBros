"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Input, EyebrowLabel } from "@/components";

export default function DesignPreviewPage() {
  const [syncToggle, setSyncToggle] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle the signature cross-fade toggle
  const handleToggle = () => {
    setIsTransitioning(true);
    setSyncToggle(!syncToggle);
  };

  // Remove transition state after the animation duration (200ms)
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-16">
      
      {/* Header */}
      <header className="space-y-2 border-b border-hairline pb-8">
        <h1 className="font-display text-4xl font-bold">Design System Preview</h1>
        <p className="text-ink-light">Ledger / field notebook theme validation.</p>
      </header>

      {/* Colors & Typography */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <EyebrowLabel>Typography Scale</EyebrowLabel>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-ink-light mb-1">Display (Bitter)</p>
              <h2 className="font-display text-3xl font-semibold">The Quick Brown Fox</h2>
            </div>
            <div>
              <p className="text-sm text-ink-light mb-1">Body (Work Sans)</p>
              <p className="font-sans text-base">The quick brown fox jumps over the lazy dog. Used for all general reading text.</p>
            </div>
            <div>
              <p className="text-sm text-ink-light mb-1">Data / Numeric (JetBrains Mono)</p>
              <p className="font-mono text-sm tracking-tight">1,234.56 | +4.52% | AAPL</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <EyebrowLabel>Color Tokens</EyebrowLabel>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-paper border border-hairline rounded-sm">
              <span className="text-sm font-medium">Paper (bg)</span>
            </div>
            <div className="p-4 bg-surface border border-hairline rounded-sm">
              <span className="text-sm font-medium">Surface (cards)</span>
            </div>
            <div className="p-4 bg-primary text-white rounded-sm">
              <span className="text-sm font-medium">Primary Ink-Blue</span>
            </div>
            <div className="p-4 bg-signature text-white rounded-sm">
              <span className="text-sm font-medium">Signature Wax-Seal</span>
            </div>
            <div className="p-4 bg-data-up/10 text-data-up border border-data-up/20 rounded-sm font-mono text-sm">
              Data Up
            </div>
            <div className="p-4 bg-data-down/10 text-data-down border border-data-down/20 rounded-sm font-mono text-sm">
              Data Down
            </div>
          </div>
        </div>
      </section>

      {/* Primitives */}
      <section className="space-y-6 border-t border-hairline pt-12">
        <EyebrowLabel>UI Primitives</EyebrowLabel>
        
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="signature">Signature Action</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Badge variant="default">Neutral Tag</Badge>
          <Badge variant="up">+2.4%</Badge>
          <Badge variant="down">-1.2%</Badge>
        </div>

        <div className="max-w-xs">
          <Input placeholder="Enter ticker symbol..." />
        </div>
      </section>

      {/* Signature Interaction Demo */}
      <section className="space-y-6 border-t border-hairline pt-12 pb-24">
        <div className="flex justify-between items-end">
          <div>
            <EyebrowLabel>Signature Interaction Demo</EyebrowLabel>
            <p className="font-sans text-sm text-ink-light mt-1">
              Click the global sync toggle to trigger the synchronized cross-fade transition.
            </p>
          </div>
          <Button variant="signature" onClick={handleToggle}>
            Toggle Global Sync
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dummy Card 1 */}
          <Card>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-hairline">
              <span className="font-display font-semibold text-lg">AAPL</span>
              <Badge variant={syncToggle ? "up" : "down"}>
                {syncToggle ? "+1.2%" : "-0.4%"}
              </Badge>
            </div>
            <div 
              className={`h-32 bg-paper rounded flex items-center justify-center signature-transition ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              style={{ transition: 'opacity 150ms ease-in-out' }}
            >
              <span className="font-mono text-xs text-ink-light">
                {syncToggle ? "Weekly Timeframe View" : "Daily Timeframe View"}
              </span>
            </div>
          </Card>

          {/* Dummy Card 2 */}
          <Card>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-hairline">
              <span className="font-display font-semibold text-lg">MSFT</span>
              <Badge variant={syncToggle ? "up" : "down"}>
                {syncToggle ? "+0.8%" : "-1.1%"}
              </Badge>
            </div>
            <div 
              className={`h-32 bg-paper rounded flex items-center justify-center signature-transition ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              style={{ transition: 'opacity 150ms ease-in-out' }}
            >
              <span className="font-mono text-xs text-ink-light">
                {syncToggle ? "Weekly Timeframe View" : "Daily Timeframe View"}
              </span>
            </div>
          </Card>
        </div>
      </section>

    </div>
  );
}
