import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-medium text-fd-primary">API · SDK · Clients</p>
        <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">Developer Documentation</h1>
        <p className="mt-5 text-lg leading-8 text-fd-muted-foreground">
          接入指南、客户端配置、API 参考、计费规则与故障排查。
        </p>
        <Link
          href="/docs"
          className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-colors hover:opacity-90"
        >
          查看文档
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
