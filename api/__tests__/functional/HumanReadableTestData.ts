import Permission from '../../src/enums/Permission'

const values = {
  exams: [
    'AWS Certified Developer Associate',
    'AWS Certified Solutions Architect Professional',
    'AWS Certified SysOps Administrator Associate',
    'AWS Certified DevOps Engineer Professional',
    'Certified Kubernetes Administrator',
    'Microsoft Azure Administrator Associate',
  ],
  questions: [
    'Which AWS service provides durable object storage?',
    'Which design improves availability across an AWS Region?',
    'What is the safest way to grant an application access to AWS resources?',
    'Which Kubernetes object maintains the desired number of application replicas?',
    'Which metric is most useful when diagnosing API latency?',
    'What should be checked first after a failed deployment?',
  ],
  tags: [ 'AWS', 'Cloud Architecture', 'Cloud Security', 'DevOps', 'Kubernetes', 'Microsoft Azure' ],
  people: [ 'Alex Morgan', 'Jordan Lee', 'Taylor Kim', 'Sam Rivera', 'Casey Patel', 'Morgan Chen' ],
}

const counters: Record<string, number> = {}
const nextIndex = (key: string): number => counters[key] = (counters[key] || 0) + 1
const numbered = (items: string[], index: number): string => {
  const value = items[(index - 1) % items.length]
  const cycle = Math.floor((index - 1) / items.length)
  return cycle ? `${ value } ${ cycle + 1 }` : value
}

export const nextExamName = (): string => numbered(values.exams, nextIndex('exam'))
export const nextQuestionTitle = (): string => numbered(values.questions, nextIndex('question'))
export const nextTagName = (): string => numbered(values.tags, nextIndex('tag'))
export const nextPerson = (): string => numbered(values.people, nextIndex('person'))

export const roleName = (permissions: Permission[] = [ Permission.Regular ]): string => {
  if (permissions.includes(Permission.Root)) return 'root'
  if (permissions.includes(Permission.All)) return 'admin'
  return 'learner'
}

export const nextUserCredentials = (permissions: Permission[] = [ Permission.Regular ]) => {
  const role = roleName(permissions)
  const index = nextIndex(`user-${ role }`)
  return {
    email: `${ role }${ index }@examme.test`,
    password: `${ role.charAt(0).toUpperCase()}${ role.slice(1) }1234!${ index }`,
  }
}

export const slugify = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const defaultChoices = () => [
  { title: 'Use the managed service designed for this requirement', correct: true, explanation: 'Managed services reduce operational work and provide documented reliability guarantees.' },
  { title: 'Run the workload on a single manually managed server', correct: false, explanation: 'A single server introduces avoidable operational work and a single point of failure.' },
  { title: 'Store the data only on a developer workstation', correct: false, explanation: 'Developer workstations are not durable production storage.' },
]
