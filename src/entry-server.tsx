import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import Landing from './pages/Landing';
import PricingPage from './pages/PricingPage';
import { PAGE_SEO, type PageSeo } from './lib/seo';

export { ORIGIN } from './lib/seo';

/**
 * Build-time only: scripts/prerender.mjs renders the public pages to static
 * HTML so crawlers get real content without running JavaScript. The pages are
 * rendered directly rather than through App, because useTheme reads
 * window.matchMedia, which does not exist here. They render in light theme
 * and signed out, and the client takes over on load.
 */
const noop = () => {};

export const routes: { seo: PageSeo; render: () => React.ReactNode }[] = [
  { seo: PAGE_SEO.home, render: () => <Landing theme="light" onThemeChange={noop} /> },
  { seo: PAGE_SEO.pricing, render: () => <PricingPage theme="light" onThemeChange={noop} /> },
];

export function render(index: number): string {
  const route = routes[index];
  return renderToString(
    <StrictMode>
      <StaticRouter location={route.seo.path}>
        <AuthProvider>{route.render()}</AuthProvider>
      </StaticRouter>
    </StrictMode>,
  );
}
