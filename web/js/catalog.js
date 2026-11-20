export async function loadCatalog() {
  const response = await fetch(new URL('../data/catalog.json', import.meta.url));
  if (!response.ok) throw new Error('Der Fragenbestand konnte nicht geladen werden.');
  return response.json();
}
