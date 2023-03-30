import { useNavigate } from "@solidjs/router";
import { BiRegularChevronRight, BiRegularUpArrowAlt } from "solid-icons/bi";
import { Accessor, Component, createSignal, For, Setter } from "solid-js";
import { bookmarks, Bookmarks } from "webextension-polyfill";

interface BreadcrumbProps {
  readonly node: Bookmarks.BookmarkTreeNode;
  readonly setNode: Setter<Bookmarks.BookmarkTreeNode>;
}

async function getNodeList(
  id: string | null | undefined
): Promise<ReadonlyArray<Bookmarks.BookmarkTreeNode>> {
  if (id == null) return [];
  const node = (await bookmarks.get(id))[0];
  return [...(await getNodeList(node.parentId)), node];
}

const Breadcrumb: Component<BreadcrumbProps> = (props) => {
  const [nodeList, setNodeList] = createSignal<
    ReadonlyArray<Bookmarks.BookmarkTreeNode>
  >([]);
  getNodeList(props.node.id).then((list) => setNodeList([...list, props.node]));

  return (
    <>
      <BiRegularUpArrowAlt />
      <For each={nodeList().slice(0, nodeList().length - 1)}>
        {(node) => (
          <>
            <div onClick={() => props.setNode(node)}>{node.title}</div>
            <BiRegularChevronRight />
          </>
        )}
      </For>
      <div></div>
    </>
  );
};

export default Breadcrumb;
