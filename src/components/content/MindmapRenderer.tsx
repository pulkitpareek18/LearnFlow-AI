'use client';

import { useState } from 'react';
import { GitBranch, ChevronRight, Info } from 'lucide-react';
import Card from '@/components/ui/Card';

interface MindmapRendererProps {
  visual: {
    type: 'diagram' | 'flowchart' | 'mindmap' | 'infographic';
    description: string;
    svgContent?: string;
  };
}

interface MindmapNode {
  title: string;
  children?: string[];
}

export default function MindmapRenderer({ visual }: MindmapRendererProps) {
  const [showDescription, setShowDescription] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([0]));

  // Parse description to extract mind map structure if formatted correctly
  const parseMindmapStructure = (description: string): MindmapNode[] => {
    const lines = description.split('\n').filter((l) => l.trim());
    const nodes: MindmapNode[] = [];

    let currentNode: MindmapNode | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Check if it's a main node (no indentation or starts with -)
      if (!trimmed.startsWith('  ') && !trimmed.startsWith('\t')) {
        if (currentNode) {
          nodes.push(currentNode);
        }
        currentNode = {
          title: trimmed.replace(/^[-•*]\s*/, ''),
          children: [],
        };
      } else if (currentNode) {
        // It's a child node
        currentNode.children!.push(trimmed.replace(/^[-•*\s]+/, ''));
      }
    });

    if (currentNode) {
      nodes.push(currentNode);
    }

    // If no structure detected, create a simple single-node mindmap
    if (nodes.length === 0) {
      nodes.push({ title: description, children: [] });
    }

    return nodes;
  };

  const nodes = parseMindmapStructure(visual.description);

  const toggleNode = (index: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* Mind Map Visualization */}
      {visual.svgContent ? (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20 p-8">
          <div
            className="w-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: visual.svgContent }}
          />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20 p-6">
          {/* Central Concept */}
          {nodes.length > 0 && (
            <div className="space-y-4">
              {/* Main Node */}
              <div className="flex justify-center mb-6">
                <div className="bg-primary text-white px-6 py-3 rounded-full font-semibold text-center max-w-md shadow-lg">
                  {nodes[0].title}
                </div>
              </div>

              {/* Branch Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nodes.slice(1).map((node, index) => {
                  const nodeIndex = index + 1;
                  const isExpanded = expandedNodes.has(nodeIndex);

                  return (
                    <div key={index} className="space-y-2">
                      {/* Branch Header */}
                      <button
                        onClick={() => toggleNode(nodeIndex)}
                        className="w-full group"
                      >
                        <div className="flex items-center gap-3">
                          <GitBranch className="w-5 h-5 text-secondary flex-shrink-0" />
                          <div className="flex-1 bg-secondary/20 hover:bg-secondary/30 transition-colors rounded-lg px-4 py-2 text-left border border-secondary/40">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground text-sm">
                                {node.title}
                              </span>
                              {node.children && node.children.length > 0 && (
                                <ChevronRight
                                  className={`w-4 h-4 text-muted transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Branch Children */}
                      {isExpanded && node.children && node.children.length > 0 && (
                        <div className="ml-8 space-y-2">
                          {node.children.map((child, childIndex) => (
                            <div
                              key={childIndex}
                              className="flex items-start gap-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                              <Card variant="bordered" className="flex-1 bg-background">
                                <div className="p-2 px-3">
                                  <p className="text-sm text-foreground">
                                    {child}
                                  </p>
                                </div>
                              </Card>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Center Connection Line Visual Effect */}
              <div className="flex justify-center">
                <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle Description Button */}
      <div className="text-center">
        <button
          onClick={() => setShowDescription(!showDescription)}
          className="text-sm text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          {showDescription ? 'Hide' : 'Show'} Detailed Description
        </button>
      </div>

      {/* Full Description */}
      {showDescription && (
        <Card variant="bordered" className="bg-background">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Mind Map Description
            </h4>
            <div className="text-sm text-foreground leading-relaxed space-y-2">
              {visual.description.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <div className="text-xs text-muted italic text-center">
        Click on branches to expand/collapse. Explore connections between concepts.
      </div>
    </div>
  );
}
