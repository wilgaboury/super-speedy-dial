import { useNavigate } from "@solidjs/router";
import { BiRegularChevronRight, BiRegularUpArrowAlt } from "solid-icons/bi";
import {
  Accessor,
  Component,
  createEffect,
  createResource,
  createSignal,
  For,
  Setter,
  Show,
} from "solid-js";
import { bookmarks, Bookmarks } from "webextension-polyfill";

interface BreadcrumbProps {
  readonly node: Bookmarks.BookmarkTreeNode;
  readonly onNode: (node: Bookmarks.BookmarkTreeNode) => void;
}

async function getNodeList(
  id: string | null | undefined
): Promise<ReadonlyArray<Bookmarks.BookmarkTreeNode>> {
  if (id == null) return [];
  const node = (await bookmarks.get(id))[0];
  return [...(await getNodeList(node.parentId)), node];
}

function getTitle(node: Bookmarks.BookmarkTreeNode): string {
  if (node.id === "root________") return "Root";
  else return node.title;
}

const Breadcrumb: Component<BreadcrumbProps> = (props) => {
  const [nodeList] = createResource(
    () => props.node,
    (node) => getNodeList(node.id),
    { initialValue: [] }
  );

  return (
    <div
      class="header-item"
      style={{ opacity: nodeList().length > 1 ? 1 : 0, "margin-right": "20px" }}
    >
      <div class="breadcrumb-container">
        <div
          class="button borderless"
          onClick={() => {
            const list = nodeList();
            if (list.length > 0) {
              props.onNode(list[list.length - 2]);
            }
          }}
        >
          <BiRegularUpArrowAlt size="20" />
        </div>
        <div style={{ "border-left": "1px solid gray", margin: "5px" }} />
        <For each={nodeList().slice(0, nodeList().length - 1)}>
          {(node) => {
            return (
              <div style={"display: flex; align-items: center"}>
                <div
                  class="button borderless"
                  onClick={() => props.onNode(node)}
                >
                  {getTitle(node)}
                </div>
                <BiRegularChevronRight />
              </div>
            );
          }}
        </For>
        <Show when={nodeList().length > 0}>
          <div
            class="button-size-padding"
            style={"display: flex; align-items: center"}
          >
            {nodeList()[nodeList().length - 1].title}
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Breadcrumb;
