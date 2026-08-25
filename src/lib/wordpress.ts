export interface WpRendered {
  rendered: string;
}

export interface WpPost {
  id: number;
  slug: string;
  date: string;
  link: string;
  title: WpRendered;
  excerpt: WpRendered;
  content: WpRendered;
}

export interface WpPage {
  id: number;
  slug: string;
  date: string;
  link: string;
  title: WpRendered;
  content: WpRendered;
}

const apiBase = () => {
  const value = process.env.WP_API_URL;

  if (!value) {
    throw new Error('WP_API_URL is not configured.');
  }

  return value.replace(/\/$/, '');
};

async function wpFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`);

  if (!response.ok) {
    throw new Error(`WordPress API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function getPosts(): Promise<WpPost[]> {
  return wpFetch<WpPost[]>('/posts?_fields=id,slug,date,link,title,excerpt,content&per_page=20');
}

export async function getPostBySlug(slug: string): Promise<WpPost | null> {
  const posts = await wpFetch<WpPost[]>(
    `/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,date,link,title,excerpt,content`,
  );

  return posts[0] ?? null;
}

export async function getPageBySlug(slug: string): Promise<WpPage | null> {
  const pages = await wpFetch<WpPage[]>(
    `/pages?slug=${encodeURIComponent(slug)}&_fields=id,slug,date,link,title,content`,
  );

  return pages[0] ?? null;
}
