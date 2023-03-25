import { useParams } from "@solidjs/router";
import { Component, createSignal } from "solid-js";

const Folder: Component = () => {
  const params = useParams<{ id: string }>();

  return <div>{`folder${params.id}`}</div>;
};

export default Folder;
