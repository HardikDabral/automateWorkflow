'use client'

import { useMemo, useCallback } from 'react'
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
  'slack',
  'http',
  'branch',
  'loop',
  'create_record',
  'update_record',
]

export function WorkflowCanvas() {
  const definition = useWorkflowStore((s) => s.definition)
  const addStep = useWorkflowStore((s) => s.addStep)
  const selectStep = useWorkflowStore((s) => s.selectStep)

  const { nodes, edges } = useMemo(() => buildCanvas(definition), [definition])

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
        <Background color="#2a2a30" gap={24} />
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
            className="text-left px-3 py-1.5 rounded-lg text-[color:var(--muted)] hover:text-white hover:bg-[color:var(--surface-2)] transition-colors"
          >
            + {type}
          </button>
        ))}
      </div>
    </div>
  )
}
