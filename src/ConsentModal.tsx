import { Component, useContext } from "solid-js";
import { Modal } from "./Modal";
import { SettingsContext } from "./settings";
import { management } from "webextension-polyfill";

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
        bookmarks. If you would like to disallow Super Speedy Dial from
        collecting this information we recommend you remove the extension.
      </div>
      <div class="modal-separator" />
      <div class="modal-buttons">
        <button class="save" onClick={() => setSettings({ consent: true })}>
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
