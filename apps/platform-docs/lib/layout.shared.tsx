import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: appName },
    links: [
      { text: '快速开始', url: '/docs/getting-started/first-request' },
      { text: 'API 参考', url: '/docs/api' },
    ],
  };
}
