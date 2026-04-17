import { NextRequest } from 'next/server'
import { evidenceQueue, matchingQueue, exportQueue, QUEUE_NAMES } from '@/lib/queues'

type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'unknown'

interface JobStatusResponse {
  jobId:       string
  queue:       string | null
  status:      JobStatus
  result:      unknown | null
  failReason:  string | null
  progress:    number | null
}

async function getJobFromQueue(queue: typeof evidenceQueue, queueName: string, jobId: string) {
  try {
    const job = await queue.getJob(jobId)
    if (!job) return null

    const state      = await job.getState()
    const rawStatus  = state as string
    const status: JobStatus =
      rawStatus === 'waiting'   ? 'waiting'   :
      rawStatus === 'active'    ? 'active'     :
      rawStatus === 'completed' ? 'completed'  :
      rawStatus === 'failed'    ? 'failed'     :
      'unknown'

    return {
      jobId:      jobId,
      queue:      queueName,
      status,
      result:     job.returnvalue ?? null,
      failReason: job.failedReason ?? null,
      progress:   typeof job.progress === 'number' ? job.progress : null,
    } satisfies JobStatusResponse
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  // Check all three queues in parallel
  const [evidenceResult, matchingResult, exportResult] = await Promise.all([
    getJobFromQueue(evidenceQueue, QUEUE_NAMES.EVIDENCE, jobId),
    getJobFromQueue(matchingQueue, QUEUE_NAMES.MATCHING, jobId),
    getJobFromQueue(exportQueue,   QUEUE_NAMES.EXPORT,   jobId),
  ])

  const found = evidenceResult ?? matchingResult ?? exportResult

  if (!found) {
    const unknown: JobStatusResponse = {
      jobId,
      queue:      null,
      status:     'unknown',
      result:     null,
      failReason: null,
      progress:   null,
    }
    return Response.json(unknown)
  }

  return Response.json(found)
}
