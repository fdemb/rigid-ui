export default function NotFound() {
  return (
    <div class="mx-auto max-w-5xl px-6 py-24 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">Not found</h1>
      <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        This route does not exist.{" "}
        <a href="/" class="text-blue-500 hover:underline">
          Back home
        </a>
        .
      </p>
    </div>
  );
}
