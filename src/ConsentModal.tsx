import { Component, useContext } from "solid-js";
import { Modal } from "./Modal";
import { SettingsContext } from "./settings";
import { management, permissions } from "webextension-polyfill";

const ConsentModal: Component = () => {
  const [settings, setSettings] = useContext(SettingsContext);
  return (
    <Modal show={!settings.consent}>
      <div class="modal-content" style={{ "font-size": "20px" }}>
        Privacy Consent
      </div>
      <div class="modal-separator" />
      <div class="modal-content" style={{ width: "500px" }}>
        Unfortunatley, without the ability to send your bookmark URLs to
        third-party APIs, which may collect that information, Super Speedy Dial
        will not be able to generate thumbnails or retrieve favicons for your
        bookmarks. This is a core piece of functionality, so if you would like
        for that data to be private, please remove the extension.
      </div>
      <div class="modal-separator" />
      <div class="modal-buttons">
        <button
          class="save"
          onClick={async () => {
            if (await permissions.request({ origins: ["<all_urls>"] }))
              setSettings({ consent: true });
          }}
        >
          Allow
        </button>
        <button class="delete" onClick={() => management.uninstallSelf()}>
          Remove
        </button>
      </div>
    </Modal>
  );
};

export default ConsentModal;
