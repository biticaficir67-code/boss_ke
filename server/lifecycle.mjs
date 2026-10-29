export function stopOnSignal(service) {
  let closing = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
    if (closing) return;
    closing = true;
    try { await service.close(); process.exit(0); }
    catch (error) { console.error(error.message); process.exit(1); }
  });
}
