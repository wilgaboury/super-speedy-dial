import { useParams } from "@solidjs/router";
import { Component, onMount } from "solid-js";
import Muuri from "muuri";
import { BiRegularLeftArrowAlt } from "solid-icons/bi";

const Folder: Component = () => {
  const params = useParams<{ id: string }>();

  onMount(() => {
    const muuri = new Muuri(".grid");
  });

  return (
    <div class="grid-container">
      <div class="back-button-container">
        <div class="back-button button borderless-button">
          <span style={{ "font-size": "15px", "margin-right": "10px" }}>
            <BiRegularLeftArrowAlt size="15px" />
          </span>
          <span>Back</span>
        </div>
      </div>
      <div class="grid"></div>
    </div>
  );
};

export default Folder;
