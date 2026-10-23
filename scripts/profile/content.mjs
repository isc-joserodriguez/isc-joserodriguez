// All profile copy, links and lists. Numbers that are not measured from GitHub live here.

export const START_YEAR = 2018 // first professional year: "8+ years" is derived from it at build time

export const yearsOfExperience = (now = new Date()) => now.getUTCFullYear() - START_YEAR

export const profile = {
  name: 'José Rodriguez',
  handle: 'isc-joserodriguez',
  role: 'Tech Lead · Senior Full Stack AI Engineer',
  roles: ['Tech Lead', 'Senior Full Stack AI Engineer', 'AI-Native Workflows', 'Mentor'],
  company: 'Blackstone Studio',
  location: 'Tepic, Nayarit, MX',
  status: 'Open to new opportunities',
  headline: 'I design AI-native development workflows and ship scalable web and mobile products, end to end.',
  intro: (years) =>
    `Tech Lead and Senior Full Stack AI Engineer with ${years}+ years building web and mobile products end to end. ` +
    'I design AI-native development workflows (AI agents, MCP, RAG and spec-driven development) on top of solid backend architecture, cloud and team leadership.',
  // Typed in the hero terminal, one after another. Each is a real line of work, not a slogan.
  taglines: [
    'spec → plan → agents → review → production',
    'migrate 40+ PHP modules to NestJS + Prisma, zero downtime',
    'wire MCP servers and RAG into the dev workflow',
    'cut deploys from days to hours with CI/CD on AWS',
  ],
  claims: { products: '30+', mentored: '40+', teamSize: 8, caseStudies: '12+' },
  links: {
    email: 'mailto:isc.joserodriguez@gmail.com',
    linkedin: 'https://www.linkedin.com/in/isc-joserodriguez/',
    portfolio: 'https://www.jose-rodriguez.dev/',
    projects: 'https://www.jose-rodriguez.dev/#proyectos',
    credly: 'https://www.credly.com/users/isc-joserodriguez/badges',
    hackerrank: 'https://www.hackerrank.com/profile/isc_jrodriguez',
    github: 'https://github.com/isc-joserodriguez',
  },
}

// Section headers: eyebrow + two-tone headline (second half in the brand gradient).
export const sections = {
  about: { n: '01', eyebrow: 'About', lead: 'Tech lead.', accent: 'AI-native by design.' },
  ai: { n: '02', eyebrow: 'AI-native engineering', lead: 'Specs in,', accent: 'production out.' },
  highlights: { n: '03', eyebrow: 'Highlights', lead: 'Wins that made it', accent: 'to production.' },
  building: { n: '04', eyebrow: 'Now building', lead: 'Products in', accent: 'the works.' },
  activity: { n: '05', eyebrow: 'GitHub activity', lead: 'Consistency,', accent: 'measured daily.' },
  stack: { n: '06', eyebrow: 'Tech stack', lead: 'The toolbox,', accent: 'battle-tested.' },
  credentials: { n: '07', eyebrow: 'Credentials', lead: 'Always', accent: 'learning.' },
}

export const about = {
  facets: [
    { icon: 'briefcase', title: 'Tech Lead at Blackstone Studio', text: 'Owning delivery of web and mobile products, from spec to production.' },
    { icon: 'bot', title: 'AI-native workflows in production', text: 'Multi-agent systems, Skills, MCP, RAG and spec-driven development.' },
    { icon: 'rocket', title: '30+ products shipped', text: 'Web and mobile platforms delivered end to end for real clients.' },
    { icon: 'users', title: 'Teams of up to 8', text: 'Developers, design and QA, working with agile delivery.' },
    { icon: 'graduation-cap', title: '40+ students mentored', text: 'Mentor in Full Stack JavaScript bootcamps.' },
    { icon: 'layers', title: 'Clean Architecture, DDD, SOLID', text: 'Systems designed to keep changing for years.' },
  ],
}

export const ai = {
  stages: [
    { key: 'spec', icon: 'file-text', label: 'Spec', sub: 'SDD' },
    { key: 'plan', icon: 'list-checks', label: 'Plan', sub: 'tasks' },
  ],
  agents: [
    { icon: 'search', label: 'Analysis' },
    { icon: 'code-xml', label: 'Code' },
    { icon: 'flask-conical', label: 'Tests' },
    { icon: 'book-open', label: 'Docs' },
  ],
  finish: [
    { key: 'review', icon: 'git-pull-request', label: 'Review', sub: 'human' },
    { key: 'ship', icon: 'rocket', label: 'Ship', sub: 'prod' },
  ],
  context: ['MCP servers', 'RAG · embeddings', 'Agent Skills', 'Repo memory'],
  log: [
    ['sdd.spec', 'feature.md', 'parsed'],
    ['plan', 'task graph', 'ready'],
    ['agents', 'analysis · code · tests · docs', 'parallel'],
    ['tests', 'unit + e2e (Playwright)', 'green'],
    ['review', 'human in the loop', 'approved'],
    ['ship', 'CI/CD → AWS', 'live'],
  ],
  tools: ['claude', 'openai', 'langchain', 'n8n', 'ollama', 'copilot', 'mcp'],
  pillars: [
    { icon: 'file-text', title: 'Specify', text: 'Spec-driven development: the spec is the source of truth agents work from.' },
    { icon: 'network', title: 'Orchestrate', text: 'Multi-agent workflows that split analysis, code, tests and docs.' },
    { icon: 'database', title: 'Ground', text: 'MCP servers and RAG give agents real project context.' },
    { icon: 'shield-check', title: 'Verify', text: 'Tests, CI and human review before anything ships.' },
  ],
}

export const highlights = [
  {
    key: 'agents',
    icon: 'bot',
    eyebrow: 'AI platform',
    metric: 'End to end',
    title: 'AI agent platform, in production',
    text: 'Automates the development cycle: analysis, code, testing and documentation.',
    steps: ['Analysis', 'Code', 'Tests', 'Docs'],
  },
  {
    key: 'migration',
    icon: 'git-merge',
    eyebrow: 'Legacy migration',
    metric: '40+ modules',
    title: 'PHP core → NestJS + Prisma',
    text: 'A CodeIgniter monolith rebuilt in TypeScript with AI-assisted flows, zero downtime.',
    from: ['php', 'codeigniter'],
    to: ['nestjs', 'prisma', 'typescript'],
  },
  {
    key: 'cicd',
    icon: 'timer',
    eyebrow: 'CI/CD',
    metric: 'Days → hours',
    title: 'Deploy time, cut down',
    text: 'Release automation on AWS and CircleCI.',
    logos: ['aws', 'circleci'],
  },
  {
    key: 'cli',
    icon: 'terminal',
    eyebrow: 'Cloud tooling',
    metric: 'CLI → AWS',
    title: 'Whole environments, one tool',
    text: 'CLI tools that deploy complete environments on AWS.',
    logos: ['aws', 'node'],
  },
  {
    key: 'billing',
    icon: 'credit-card',
    eyebrow: 'Payments',
    metric: 'Automated',
    title: 'Billing and subscriptions',
    text: 'Stripe integration that runs billing and subscriptions on its own.',
    logos: ['stripe'],
  },
]

export const building = {
  dayJob: {
    title: 'AI-native workflows at Blackstone Studio',
    text: 'Agents, RAG, MCP and spec-driven development applied to real client products.',
  },
  products: [
    { icon: 'shopping-cart', name: 'Point of sale', text: 'Sales, inventory and day-to-day business operations.', status: 'In development' },
    { icon: 'hand-coins', name: 'Loan manager', text: 'From credit application to repayments, end to end.', status: 'In development' },
    { icon: 'car', name: 'Car rental', text: 'The full booking and payment flow.', status: 'In development' },
    { icon: 'gamepad-2', name: '2D web shooter', text: 'An arcade shooter that runs in the browser.', status: 'In development' },
    { icon: 'smartphone', name: 'Consumer mobile app', text: 'In stealth. More soon.', status: 'Stealth', stealth: true },
  ],
}

// Stack: `core` marks the daily drivers. `icon` is a brand key, `glyph` a Lucide fallback.
export const stack = [
  {
    domain: 'AI engineering',
    items: [
      { name: 'Claude', icon: 'claude', core: true },
      { name: 'OpenAI', icon: 'openai', core: true },
      { name: 'LangChain', icon: 'langchain' },
      { name: 'n8n', icon: 'n8n' },
      { name: 'Ollama', icon: 'ollama' },
      { name: 'GitHub Copilot', icon: 'copilot' },
      { name: 'MCP', icon: 'mcp', core: true },
      { name: 'RAG', glyph: 'database', core: true },
      { name: 'AI agents', glyph: 'bot', core: true },
      { name: 'SDD', glyph: 'file-text', core: true },
    ],
  },
  {
    domain: 'Frontend & mobile',
    items: [
      { name: 'React', icon: 'react', core: true },
      { name: 'React Native', icon: 'react', core: true },
      { name: 'Next.js', icon: 'next', core: true },
      { name: 'Angular', icon: 'angular' },
      { name: 'Gatsby', icon: 'gatsby' },
      { name: 'Tailwind CSS', icon: 'tailwind' },
      { name: 'MUI', icon: 'mui' },
      { name: 'Ant Design', icon: 'antdesign' },
      { name: 'Redux', icon: 'redux' },
      { name: 'React Query', icon: 'reactquery' },
      { name: 'React Hook Form', icon: 'reacthookform' },
      { name: 'styled-components', icon: 'styledcomponents' },
      { name: 'Storybook', icon: 'storybook' },
      { name: 'Sass', icon: 'sass' },
    ],
  },
  {
    domain: 'Backend & APIs',
    items: [
      { name: 'TypeScript', icon: 'typescript', core: true },
      { name: 'Node.js', icon: 'node', core: true },
      { name: 'NestJS', icon: 'nestjs', core: true },
      { name: 'Express', icon: 'express' },
      { name: 'GraphQL', icon: 'graphql' },
      { name: 'Swagger', icon: 'swagger' },
      { name: 'Strapi', icon: 'strapi' },
      { name: 'Stripe', icon: 'stripe' },
      { name: 'PayPal', icon: 'paypal' },
    ],
  },
  {
    domain: 'Data',
    items: [
      { name: 'PostgreSQL', icon: 'postgresql', core: true },
      { name: 'MongoDB', icon: 'mongodb', core: true },
      { name: 'Prisma', icon: 'prisma', core: true },
      { name: 'MySQL', icon: 'mysql' },
      { name: 'SQL Server', glyph: 'database' },
      { name: 'TypeORM', icon: 'typeorm' },
      { name: 'Mongoose', icon: 'mongoose' },
      { name: 'Sequelize', icon: 'sequelize' },
    ],
  },
  {
    domain: 'Cloud & DevOps',
    items: [
      { name: 'AWS', icon: 'aws', core: true },
      { name: 'Docker', icon: 'docker', core: true },
      { name: 'Kubernetes', icon: 'kubernetes', core: true },
      { name: 'GitHub Actions', icon: 'githubactions', core: true },
      { name: 'CircleCI', icon: 'circleci' },
      { name: 'Firebase', icon: 'firebase' },
      { name: 'Vercel', icon: 'vercel' },
      { name: 'Netlify', icon: 'netlify' },
      { name: 'DigitalOcean', icon: 'digitalocean' },
      { name: 'Linux', icon: 'linux' },
      { name: 'Vite', icon: 'vite' },
      { name: 'Webpack', icon: 'webpack' },
    ],
  },
  {
    domain: 'Testing',
    items: [
      { name: 'Playwright', icon: 'playwright', core: true },
      { name: 'Jest', icon: 'jest' },
      { name: 'Cypress', icon: 'cypress' },
    ],
  },
]
