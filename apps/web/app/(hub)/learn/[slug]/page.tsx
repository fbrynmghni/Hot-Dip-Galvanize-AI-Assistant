export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="min-h-screen p-8 sm:p-20 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">{slug}</h1>
      <p className="text-sm text-gray-500">
        Artikel belum ditulis. Lihat skill <code>hdg-content-writer</code>
        untuk aturan sitasi dan hak cipta sebelum menambah konten di sini.
      </p>
    </main>
  );
}
