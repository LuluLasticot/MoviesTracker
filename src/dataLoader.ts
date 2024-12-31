export async function loadData<T>(filePath: string): Promise<T[]> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement du fichier : ${filePath}`);
    }
    const data: T[] = await response.json(); // Type explicite
    return data; // Retourne directement le tableau sans ambiguïté
  } catch (error) {
    console.error(error);
    return [];
  }
}
