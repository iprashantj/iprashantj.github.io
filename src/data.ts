// Every word on the page lives here. Sourced from Prashant_Jadhav_Full_Stack_PHP_Developer.pdf.

export const person = {
  first: 'Prashant',
  last: 'Jadhav',
  full: 'Prashant Jadhav',
  role: ['Full-stack', 'developer.'] as const,
  location: 'Pune, India',
  // ~190 chars, broken into three lines on desktop
  tagline: [
    'Nearly four years shipping PHP, Laravel and React',
    'systems that move real volume — Apple trade-in logistics,',
    'Odoo sync, and 100,000 PDFs rendered in 33 minutes.',
  ],
};

// Manifesto: words wrapped in *asterisks* render red.
export const manifesto =
  'I build the *plumbing* businesses quietly depend on — *APIs* that sign every request, *queues* that never drop a job, and *databases* tuned until the slow query is gone. Clean MVC, honest tests, code the next developer can read.';

export type Stat = { value: number; suffix: string; label: string };
// The résumé lists no CGPA / problem counts / rank, so the three stats are its real headline numbers.
export const stats: Stat[] = [
  { value: 10, suffix: '×', label: 'Throughput boost on a document engine' },
  { value: 100, suffix: 'K', label: 'PDFs generated in 33 minutes' },
  { value: 8, suffix: '+', label: 'Client projects shipped at Fortune' },
];

export type Project = {
  name: string;
  category: string;
  line: string;
  chips: [string, string, string, string];
  visual: 'chain' | 'gauge' | 'route';
  url: string;
};

export const projects: Project[] = [
  {
    name: 'Apple Trade-In',
    category: 'Logistics integration · 301io',
    line: 'Ties Apple, Odoo ERP and DHL / EasyPost into one signed, idempotent pipeline.',
    chips: ['Laravel', 'Odoo ERP', 'HMAC-SHA256', 'SFTP'],
    visual: 'chain',
    url: 'https://github.com/itsjadhavpatil',
  },
  {
    name: 'Sky NZ Docs',
    category: 'Batch processing · 301io',
    line: 'Re-engineered a PDF engine with chunked batches — 10× faster, SLA met.',
    chips: ['PHP', 'Queues', 'MySQL', 'PDF'],
    visual: 'gauge',
    url: 'https://github.com/itsjadhavpatil',
  },
  {
    name: 'School ERP',
    category: 'Education platform · Fortune',
    line: 'Live GPS tracking for student transport, built into the school ERP.',
    chips: ['PHP', 'MySQL', 'Power Apps', 'GPS'],
    visual: 'route',
    url: 'https://github.com/itsjadhavpatil',
  },
];

export type JourneyItem = { year: string; title: string; org: string };
// newest first
export const journey: JourneyItem[] = [
  { year: '2025 — Now', title: 'Full Stack Developer', org: '301io · WTC Kharadi, Pune' },
  { year: '2023 — 2025', title: 'Backend PHP Developer', org: 'Fortune Services · Nashik (intern → dev)' },
  { year: '2018 — 2021', title: 'B.Sc. Graduate', org: 'Savitribai Phule Pune University' },
];
export const journeyYears = { from: 2018, to: 2025 };

export const skills = [
  'PHP', 'Laravel', 'CodeIgniter', 'Yii', 'JavaScript', 'React', 'MySQL', 'PostgreSQL',
  'REST APIs', 'OAuth2', 'Webhooks', 'Odoo ERP', 'Docker', 'Git', 'PHPUnit', 'Linux',
];

export type Counter = { value: number; suffix: '+' | '★'; label: string };
// The résumé lists no coding-platform profiles, so these count real things from it.
export const counters: Counter[] = [
  { value: 3, suffix: '+', label: 'Years in production' },
  { value: 8, suffix: '+', label: 'Client projects' },
  { value: 6, suffix: '+', label: 'Third-party integrations' },
  { value: 3, suffix: '★', label: 'PHP frameworks' },
];

export type Cert = { title: string; issuer: string };
export const certs: Cert[] = [
  { title: 'Full Stack Developer', issuer: 'Phoenix Computer Academy · 2022' },
  { title: 'Bachelor of Science', issuer: 'SPPU, Pune · 2021' },
  { title: '10× throughput', issuer: 'Sky NZ document engine' },
  { title: 'Platform lead', issuer: 'Apple Trade-In · 301io' },
  { title: 'Vendor cost removed', issuer: 'Custom shipping labels' },
  { title: 'Observability layer', issuer: 'Every external integration' },
  { title: 'GPS transport module', issuer: 'School ERP · Power Apps' },
  { title: 'PHPUnit from day one', issuer: 'Fortune Services · 2023' },
];

export const contact = {
  email: 'prashantjadhav2743@gmail.com',
  github: 'https://github.com/itsjadhavpatil',
  linkedin: 'https://linkedin.com/in/itsjadhavpatil',
  resume: './resume.pdf',
};

export const year = new Date().getFullYear();
