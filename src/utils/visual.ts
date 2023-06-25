import { createEffect, createSignal, on } from "solid-js";
import { memoDefault } from "./assorted";
import { getDb, tileImageStore } from "./database";
import { retrieveBookmarkImage } from "./image";

export interface BookmarkVisualData {
  readonly customized: boolean;
}

interface BookmarkVisual {
  readonly fromStore?: boolean;
  readonly data: BookmarkVisualData;
}

export const bookmarkVisual = memoDefault((id: string) => {
  const signal = createSignal<BookmarkVisual>();
  const [visual] = signal;
  createEffect(
    on(visual, async (vis) => {
      const db = await getDb();
      if (vis != null && vis.fromStore != null && vis.fromStore) {
        db.set(tileImageStore, id, vis.data);
      }
    })
  );
  return signal;
});

const memoRetrieveVisualFromStore = memoDefault(async (id: string) => {
  const db = await getDb();
  const visual = await db.get(tileImageStore, id);
  // TODO: actually implement this correctly
  if (visual != null) return visual as BookmarkVisualData;
  else return undefined;
});

const memoRetrieveVisualFromNet = memoDefault(async (url: string) => {
  const visual = await retrieveBookmarkImage(url);
  return undefined;
});

export async function loadVisual(id: string, url: string) {
  const [visual, setVisual] = bookmarkVisual(id);
  const storageVisual = await memoRetrieveVisualFromStore(id);
  if (visual() == null && storageVisual != null)
    return setVisual({ fromStore: true, data: storageVisual });

  const netVisual = await memoRetrieveVisualFromNet(url);
  if (visual() == null && storageVisual != null)
    return setVisual({ data: storageVisual });
}
