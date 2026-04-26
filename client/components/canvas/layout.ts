import type { Edge, Node } from '@xyflow/react'
import type { Step, WorkflowDefinition } from '@wf/shared'

const ROW_HEIGHT = 120
const COL_WIDTH = 280

export interface CanvasData {
  nodes: Node[]
  edges: Edge[]
}

interface LayoutCursor {
  nodes: Node[]
  edges: Edge[]
  y: number
}

/** Flatten the step tree into a vertical layout with branch/loop fanning right. */
export function buildCanvas(def: WorkflowDefinition): CanvasData {
  const cursor: LayoutCursor = { nodes: [], edges: [], y: 0 }

  // Trigger node at top
  const triggerId = 'trigger'
  cursor.nodes.push({
    id: triggerId,
    type: 'trigger',
    position: { x: 0, y: cursor.y },
    data: { trigger: def.trigger },
    draggable: false,
  })
  cursor.y += ROW_HEIGHT

  let parent = triggerId
  for (const step of def.steps) {
    parent = addStep(cursor, step, 0, parent)
  }

  return { nodes: cursor.nodes, edges: cursor.edges }
}

function addStep(c: LayoutCursor, step: Step, depth: number, parentId: string): string {
  const x = depth * COL_WIDTH
  const y = c.y
  c.nodes.push({
    id: step.id,
    type: step.type,
    position: { x, y },
    data: { step },
  })
  c.edges.push({ id: `e-${parentId}-${step.id}`, source: parentId, target: step.id })
  c.y += ROW_HEIGHT

  if (step.type === 'branch') {
    let yesTail = step.id
    for (const child of step.yesBranch ?? []) {
      yesTail = addStep(c, child, depth + 1, yesTail)
    }
    let noTail = step.id
    for (const child of step.noBranch ?? []) {
      noTail = addStep(c, child, depth + 1, noTail)
    }
    return yesTail
  }

  if (step.type === 'loop') {
    let loopTail = step.id
    for (const child of step.loopSteps ?? []) {
      loopTail = addStep(c, child, depth + 1, loopTail)
    }
    return loopTail
  }

  return step.id
}
