export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-10">
      <p className="stamp-label mb-2">HUB · REFERENCE</p>
      <h1
        className="mb-2 text-2xl font-semibold uppercase tracking-wide text-steel-100"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {slug}
      </h1>
      <div className="panel-riveted mt-6 border-l-4 border-l-steel-400 p-5 text-sm text-steel-300">
        Artikel belum ditulis. Lihat skill{" "}
        <code className="font-mono text-steel-100">hdg-content-writer</code>{" "}
        untuk aturan sitasi dan hak cipta sebelum menambah konten di sini.
      </div>
    </main>
  );
}
