import { useEffect, useState } from "react";
import StarRating from "./components/StarRating";

export interface MovieData {
  Poster: string;
  Title: string;
  Runtime: string;
  imdbRating: string;
  Plot: string;
  Released: string;
  Director: string;
  Genre: string;
  Actors: string;
}

export interface MovieItem {
  imdbID: string;
  Title: string;
  Poster: string;
  userRating: number;
  imdbRating: number;
  Runtime: number;
  Year: string;
}
function average(arr: number[]) {
  return arr.reduce((acc, cur, _, arr) => acc + cur / arr.length, 0).toFixed(2);
}

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(
    () => JSON.parse(localStorage.getItem("watched") || "[]") as MovieItem[]
  );
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");

  function handleSelectMovie(id: string) {
    setSelectedId((selectedId) => (id === selectedId ? "" : id));
  }
  function handleCloseMovie() {
    setSelectedId("");
  }
  function handleAddMovie(movie: MovieItem) {
    setWatched((watched) => [...watched, movie]);
    // localStorage.setItem("watched", JSON.stringify([...watched, movie]));
  }
  function handleDeleteMovie(id: string) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(watched));
  }, [watched]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchMovies() {
      try {
        setError("");
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${
            import.meta.env.VITE_OMDB_API_KEY
          }&s=${query}`,
          { signal: controller.signal }
        );
        if (!res.ok)
          throw new Error("Something went wrong with fetching movies.");
        const data = await res.json();
        if (data.Response === "False") throw new Error("Movie not found.");
        setMovies(data.Search);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
    if (query.trim().length < 3) {
      setMovies([]);
      setError("");
      return;
    }
    handleCloseMovie();
    fetchMovies();
    return () => {
      controller.abort();
    };
  }, [query]);

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              key={Date.now()}
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddMovie={handleAddMovie}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeleteMovie={handleDeleteMovie}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="error">
      <span>⛔</span> {message}
    </p>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function NavBar({ children }: { children: React.ReactNode }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function NumResults({ movies }: { movies: MovieItem[] }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width={24}
          height={24}
        >
          <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
        </svg>
      </span>
      <h1>MovieHub</h1>
    </div>
  );
}
function Search({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (query: string) => void;
}) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return <main className="main">{children}</main>;
}

function MovieDetails({
  selectedId,
  onCloseMovie,
  onAddMovie,
  watched,
}: {
  selectedId: string;
  onCloseMovie: () => void;
  onAddMovie: (movie: MovieItem) => void;
  watched: MovieItem[];
}) {
  const [movie, setMovie] = useState({} as MovieData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userRating, setUserRating] = useState(0);

  const alreadyWatched = watched.find((movie) => movie.imdbID === selectedId);

  function handleAdd() {
    const newWatchedMovie: MovieItem = {
      imdbID: selectedId,
      Title: movie.Title,
      Poster: movie.Poster,
      Year: movie.Released,
      userRating,
      imdbRating: +movie.imdbRating,
      Runtime: +movie.Runtime.split(" ")[0],
    };
    onAddMovie(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseMovie();
      }
    };
    document.addEventListener("keydown", cb);
    return () => {
      document.removeEventListener("keydown", cb);
    };
  }, [onCloseMovie]);

  useEffect(() => {
    const controller = new AbortController();
    async function getMovieDetails() {
      try {
        setError("");
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${
            import.meta.env.VITE_OMDB_API_KEY
          }&i=${selectedId}`,
          { signal: controller.signal }
        );

        if (!res.ok)
          throw new Error("Something went wrong with fetching movies.");
        const data = await res.json();
        setMovie(data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
    getMovieDetails();
    return () => {
      controller.abort();
    };
  }, [selectedId]);
  useEffect(() => {
    if (!movie.Title) return;
    document.title = `Movie | ${movie.Title}`;
    return () => {
      document.title = "MovieHub";
      // console.log(`cleanup ${movie.Title}`);
    };
  }, [movie.Title]);
  return (
    <div className="details">
      {error && <ErrorMessage message={error} />}
      {!isLoading && !error && (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img
              src={movie.Poster !== "N/A" ? movie.Poster : "./no-image.png"}
              alt={`Poster of ${movie.Title} movie`}
            />
            <div className="details-overview">
              <h2>{movie.Title}</h2>
              <p>
                {movie.Released} &bull; {movie.Runtime}
              </p>
              <p>{movie.Genre}</p>
              <p>
                <span>⭐</span> {movie.imdbRating} IMDB rating
              </p>
            </div>
          </header>
          <section>
            {!alreadyWatched && (
              <div className="rating">
                <StarRating
                  maxRating={10}
                  size={24}
                  onSetRating={setUserRating}
                />
              </div>
            )}
            {alreadyWatched && (
              <div className="rating">
                <p>
                  <span>Your rating: </span>
                  <span>🌟</span>
                  <span>{alreadyWatched.userRating}</span>
                </p>
              </div>
            )}
            {userRating > 0 && (
              <button className="btn-add" onClick={handleAdd}>
                + Add to list
              </button>
            )}
            <p>
              <em>{movie.Plot}</em>
            </p>
            <p>Starrring {movie.Actors}</p>
            <p>Directed by {movie.Director}</p>
          </section>
        </>
      )}
      {isLoading && <Loader />}
    </div>
  );
}

function WatchedMoviesList({
  watched,
  onDeleteMovie,
}: {
  watched: MovieItem[];
  onDeleteMovie: (id: string) => void;
}) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteMovie={onDeleteMovie}
        />
      ))}
    </ul>
  );
}
function WatchedMovie({
  movie,
  onDeleteMovie,
}: {
  movie: MovieItem;
  onDeleteMovie: (id: string) => void;
}) {
  return (
    <li key={movie.imdbID}>
      <img
        src={movie.Poster !== "N/A" ? movie.Poster : "./no-image.png"}
        alt={`${movie.Title} poster`}
      />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating || "N/A"}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.Runtime || "N/A"} min</span>
        </p>

        <button
          className="btn-delete"
          onClick={() => onDeleteMovie(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
function WatchedSummary({ watched }: { watched: MovieItem[] }) {
  const avgImdbRating = average(
    watched.filter((movie) => movie.imdbRating).map((movie) => movie.imdbRating)
  );
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(
    watched.filter((movie) => movie.Runtime).map((movie) => movie.Runtime)
  );
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{parseFloat(avgRuntime).toFixed(0)} min</span>
        </p>
      </div>
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({
  movies,
  onSelectMovie,
}: {
  movies: MovieItem[];
  onSelectMovie: (id: string) => void;
}) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie key={movie.imdbID} movie={movie} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({
  movie,
  onSelectMovie,
}: {
  movie: MovieItem;
  onSelectMovie: (id: string) => void;
}) {
  return (
    <li key={movie.imdbID} onClick={() => onSelectMovie(movie.imdbID)}>
      <img
        src={movie.Poster !== "N/A" ? movie.Poster : "./no-image.png"}
        alt={`${movie.Title} poster`}
      />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}
