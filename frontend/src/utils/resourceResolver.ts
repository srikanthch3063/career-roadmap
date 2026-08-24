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

export function generateResourceLinks(tech: string): ResourceOption[] {
  const normalized = normalizeTechnology(tech);
  
  const createGoogleSearchUrl = (query: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  return [
    {
      title: 'Video Tutorials',
      description: 'site:youtube.com tutorials and guides',
      url: createGoogleSearchUrl(`site:youtube.com ${normalized} tutorial`)
    },
    {
      title: 'Code & Repositories',
      description: 'site:github.com source code and examples',
      url: createGoogleSearchUrl(`site:github.com ${normalized}`)
    },
    {
      title: 'Q&A / Troubleshooting',
      description: 'site:stackoverflow.com community answers',
      url: createGoogleSearchUrl(`site:stackoverflow.com ${normalized}`)
    },
    {
      title: 'Official Documentation',
      description: 'official docs and references',
      url: createGoogleSearchUrl(`${normalized} official documentation`)
    },
    {
      title: 'Explore on the Web',
      description: 'general tutorials and guides',
      url: createGoogleSearchUrl(`${normalized} tutorial guide`)
    }
  ];
}
