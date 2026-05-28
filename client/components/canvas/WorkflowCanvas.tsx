'use client'

import { useMemo, useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { StepType } from '@wf/shared'
import { useWorkflowStore } from '@/store/workflowStore'
import { buildCanvas } from './layout'
import { StepNode, TriggerNode } from './nodes/StepNode'

const nodeTypes = {
  trigger: TriggerNode,
  delay: StepNode,
  send_email: StepNode,
  slack: StepNode,
  http: StepNode,
  branch: StepNode,
  loop: StepNode,
  create_record: StepNode,
  update_record: StepNode,
}

const STEP_PALETTE: StepType[] = [
  'delay',
  'send_email',
  'http',
  'branch',
  'loop',
  'create_record',
  'update_record',
]

const COMING_SOON: StepType[] = ['slack']

export function WorkflowCanvas() {
  const definition = useWorkflowStore((s) => s.definition)
  const addStep = useWorkflowStore((s) => s.addStep)
  const selectStep = useWorkflowStore((s) => s.selectStep)

  const { nodes, edges } = useMemo(() => buildCanvas(definition), [definition])

  const [gridColor, setGridColor] = useState('#2a2a30')
  useEffect(() => {
    const read = () =>
      setGridColor(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--grid')
          .trim() || '#2a2a30',
      )
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node: Node) => {
      if (node.id === 'trigger') {
        selectStep(null)
        return
      }
      selectStep(node.id)
    },
    [selectStep],
  )

  return (
    <div className="relative h-full w-full bg-[color:var(--background)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color={gridColor} gap={24} />
        <Controls />
      </ReactFlow>

      <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl p-3 text-xs w-[180px]">
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--muted-2)] px-2 pb-2">
          Add step
        </span>
        {STEP_PALETTE.map((type) => (
          <button
            key={type}
            onClick={() => addStep(type)}
            className="text-left px-3 py-1.5 rounded-lg text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)] transition-colors"
          >
            + {type}
          </button>
        ))}
        {COMING_SOON.map((type) => (
          <div
            key={type}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[color:var(--muted-2)] cursor-not-allowed select-none"
            title="Coming soon"
          >
            <span>+ {type}</span>
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[rgb(var(--brand-rgb)/0.1)] border border-[rgb(var(--brand-rgb)/0.25)] text-[color:var(--brand)]">
              Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
