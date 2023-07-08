import { Accessor, createSignal } from "solid-js";
import { bookmarks } from "webextension-polyfill";
import { memoDefault } from "./assorted";
import { getDb, tileImageStore } from "./database";
import {
  BookmarkVisual,
  defaultBookmarkVisual,
  isBookmarkVisual,
  retrieveBookmarkImage,
} from "./image";

export interface BookmarkVisualMeta {
  readonly visual: BookmarkVisual;
  readonly customized: boolean;
}

function isBookmarkVisualMeta(obj: any): obj is BookmarkVisualMeta {
  return (
    obj != null &&
    isBookmarkVisual(obj.visual) &&
    obj.customized != null &&
    typeof obj.customized === "boolean"
  );
}

export const bookmarkVisual = memoDefault(
  (
    id: string
  ): [
    Accessor<BookmarkVisualMeta | undefined | "loading">,
    (data: BookmarkVisualMeta | undefined | "loading", save?: boolean) => void
  ] => {
    const [visual, setVisual] = createSignal<BookmarkVisualMeta | "loading">();
    // createEffect(() => console.log(visual()));
    setTimeout(() => loadVisual(id));
    return [
      visual,
      async (vis, save: boolean = true) => {
        const db = await getDb();
        const prev = visual();
        if (save && vis !== "loading" && vis !== prev && vis != null) {
          db.set(tileImageStore, id, vis);
        }
        setVisual(vis);
      },
    ];
  }
);

const memoRetrieveVisualFromStore = memoDefault(async (id: string) => {
  const db = await getDb();
  const visual = await db.get(tileImageStore, id);
  if (isBookmarkVisualMeta(visual)) return visual;
  else return undefined;
});

export const memoRetrieveAutoBookmarkImage = memoDefault(retrieveBookmarkImage);

export async function loadVisual(id: string) {
  const [visual, setVisual] = bookmarkVisual(id);

  if (visual() != null) return;

  const storageVisual = await memoRetrieveVisualFromStore(id);

  if (visual() == null && storageVisual != null)
    return setVisual(storageVisual, false);

  const bookmark = (await bookmarks.get(id))[0];
  if (bookmark.url == null) return;

  setVisual("loading");

  const netVisual = await memoRetrieveAutoBookmarkImage(bookmark.url);

  if ((visual() == null || visual() === "loading") && netVisual != null) {
    setVisual({
      visual: { kind: "image", image: netVisual },
      customized: false,
    });
  } else {
    setVisual({ visual: await defaultBookmarkVisual(id), customized: false });
  }
}
