export interface Post {
  id: string
  title: string
  slug: string
  category: 'architecture' | 'fullstack' | 'routing' | 'agents'
  excerpt: string
  content: string
  author: string
  readTime: string
  createdAt: string
  tags: string[]
  likes: number
}

export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    title: 'Why TanStack Start Chooses Explicit Isomorphic Control Over Magic',
    slug: 'explicit-isomorphic-control',
    category: 'architecture',
    excerpt: 'Tanner Linsley explains why Start does not force everything into server components, keeping familiar SPA power intact.',
    content: 'Start gives developers the freedom to choose where code runs. Components remain components, routes remain routes, and server functions provide an explicit, type-safe RPC boundary.',
    author: 'Tanner Linsley',
    readTime: '4 min',
    createdAt: '2026-10-14',
    tags: ['Architecture', 'Philosophy', 'SSR'],
    likes: 342,
  },
  {
    id: '2',
    title: 'Full-Stack Middleware: Crossing the Client-Server Boundary with Types',
    slug: 'fullstack-middleware-deep-dive',
    category: 'fullstack',
    excerpt: 'How createMiddleware enables type-safe context passing from the browser across the wire to the server and back.',
    content: 'Full-stack middleware in TanStack Start allows developers to execute client-side logic (such as capturing client timestamps or auth tokens), pass that context via sendContext, execute server verification, and return enriched context seamlessly.',
    author: 'Manuel Schiller',
    readTime: '6 min',
    createdAt: '2026-10-15',
    tags: ['Middleware', 'TypeSafety', 'RPC'],
    likes: 219,
  },
  {
    id: '3',
    title: '5.5x Faster SSR Throughput: The Engineering Behind Start Performance',
    slug: 'faster-ssr-throughput-benchmarks',
    category: 'architecture',
    excerpt: 'Profiling server allocations, eliminating unnecessary work, and optimizing streaming hydration.',
    content: 'Manuel and Flo profiled what the SSR server was doing under high concurrency and removed redundant allocations, achieving 5.5x higher throughput in real-world benchmarks.',
    author: 'Florian Pellet',
    readTime: '5 min',
    createdAt: '2026-10-16',
    tags: ['Performance', 'SSR', 'Nitro'],
    likes: 488,
  },
  {
    id: '4',
    title: 'Type Safety Meets Autonomous Agents: Why Start is Built for the AI Era',
    slug: 'type-safety-autonomous-agents',
    category: 'agents',
    excerpt: 'When AI agents edit server functions and routes, strict TypeScript compiler feedback prevents silent regressions.',
    content: 'An agent can change route parameters or the input to a server function, and TypeScript immediately flags every callsite that no longer agrees with that change. Combined with TanStack Intent, agents have both types and runtime skill guidance.',
    author: 'Sarah Gerrard & Tanner Linsley',
    readTime: '7 min',
    createdAt: '2026-10-17',
    tags: ['AI Agents', 'Intent', 'TypeScript'],
    likes: 612,
  },
  {
    id: '5',
    title: 'Type-Safe Search Params: Why URL State Should Be Validated With Zod',
    slug: 'type-safe-search-params-zod',
    category: 'routing',
    excerpt: 'Turn search parameters into first-class, validated state with TanStack Router search validation.',
    content: 'URL search parameters are often loosely typed or prone to string parsing errors. In TanStack Start, search params are validated through schemas like Zod, offering automatic type-coercion, default values, and total type safety.',
    author: 'Christopher Horobin',
    readTime: '5 min',
    createdAt: '2026-10-18',
    tags: ['Routing', 'Zod', 'SearchParams'],
    likes: 195,
  },
]

// Server-side mutable in-memory store for demo mutations
export const postsStore: Post[] = [...INITIAL_POSTS]
