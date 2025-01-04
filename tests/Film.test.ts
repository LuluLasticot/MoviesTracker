import { Film } from "../src/models/Film";


describe("Film Model", () => {
  it("should create a Film instance with correct properties", () => {
    const film = new Film(
      1,
      "Interstellar",
      2014,
      ["Science-fiction", "Drame"],
      169,
      "Christopher Nolan",
      ["Matthew McConaughey", "Anne Hathaway"],
      "Un groupe d'explorateurs...",
      8.5,
      "2024-10-01",
      "Netflix",
      "https://..."
    );

    expect(film.titre).toBe("Interstellar");
    expect(film.annee).toBe(2014);
    expect(film.genres).toContain("Drame");
  });
});
