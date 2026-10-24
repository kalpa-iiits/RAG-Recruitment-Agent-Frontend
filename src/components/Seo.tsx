import { useEffect } from 'react';
import { ORIGIN } from '../lib/seo';

type Props = {
  title: string;
  description?: string;
  /** Path the page should be indexed under, e.g. "/pricing". */
  path?: string;
  /** Logged-in and auth pages carry no search value. */
  noindex?: boolean;
};

/**
 * Updates the head tags index.html ships with, rather than appending new ones,
 * so crawlers never see two titles or two canonicals.
 */
export default function Seo({ title, description, path, noindex = false }: Props) {
  useEffect(() => {
    document.title = title;
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    if (path) {
      const url = ORIGIN + path;
      setMeta('property', 'og:url', url);
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = url;
    }
  }, [title, description, path, noindex]);

  return null;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}
