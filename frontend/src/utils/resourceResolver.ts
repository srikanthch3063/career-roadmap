export interface ResourceOption {
  title: string;
  description: string;
  url: string;
}

export function normalizeTechnology(tech: string): string {
  if (!tech) return '';

  let normalized = tech;

  // Replace & and / with spaces
  normalized = normalized.replace(/[&/]/g, ' ');

  // Remove generic phrases inside or outside parentheses
  normalized = normalized.replace(/\(or newer\)/gi, '');
  normalized = normalized.replace(/\(or similar\)/gi, '');

  // Remove parentheses and commas, but keep the content inside them
  normalized = normalized.replace(/[(),]/g, ' ');

  // Collapse multiple spaces into a single space
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

const ROADMAP_SH = 'https://roadmap.sh';
const CURATED: Record<string, string> = {
  react: `${ROADMAP_SH}/react`, 'node.js': `${ROADMAP_SH}/nodejs`, nodejs: `${ROADMAP_SH}/nodejs`,
  docker: `${ROADMAP_SH}/docker`, kubernetes: `${ROADMAP_SH}/kubernetes`,
  python: `${ROADMAP_SH}/python`, typescript: `${ROADMAP_SH}/typescript`,
  supabase: 'https://supabase.com/docs', tailwind: 'https://tailwindcss.com/docs',
  ros: 'https://docs.ros.org/en/rolling/',
};

export function generateResourceLinks(tech: string): ResourceOption[] {
  const normalized = normalizeTechnology(tech);
  const key = normalized.toLowerCase().split(' ')[0];
  const createGoogleSearchUrl = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const curated = CURATED[key];

  const links: ResourceOption[] = [];
  if (curated) links.push({ title: 'Curated Roadmap', description: 'roadmap.sh / official docs', url: curated });
  links.push(
    { title: 'Video Tutorials', description: 'site:youtube.com tutorials', url: createGoogleSearchUrl(`site:youtube.com ${normalized} tutorial`) },
    { title: 'Code & Repositories', description: 'site:github.com examples', url: createGoogleSearchUrl(`site:github.com ${normalized}`) },
    { title: 'Q&A / Troubleshooting', description: 'site:stackoverflow.com answers', url: createGoogleSearchUrl(`site:stackoverflow.com ${normalized}`) },
    { title: 'Official Documentation', description: 'official docs', url: createGoogleSearchUrl(`${normalized} official documentation`) },
    { title: 'Explore on the Web', description: 'general guides', url: createGoogleSearchUrl(`${normalized} tutorial guide`) },
  );
  return links.slice(0, 5);
}
