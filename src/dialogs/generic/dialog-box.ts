import "@material/mwc-button/mwc-button";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/ha-dialog";
import "../../components/ha-switch";
import "../../components/ha-textfield";
import { haStyleDialog } from "../../resources/styles";
import { HomeAssistant } from "../../types";
import { DialogBoxParams } from "./show-dialog-box";

@customElement("dialog-box")
class DialogBox extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _params?: DialogBoxParams;

  @state() private _value?: string;

  public async showDialog(params: DialogBoxParams): Promise<void> {
    this._params = params;
    if (params.prompt) {
      this._value = params.defaultValue;
    }
  }

  public closeDialog(): boolean {
    if (this._params?.confirmation || this._params?.prompt) {
      return false;
    }
    if (this._params) {
      this._dismiss();
      return true;
    }
    return true;
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }

    const confirmPrompt = this._params.confirmation || this._params.prompt;

    return html`
      <ha-dialog
        open
        ?scrimClickAction=${confirmPrompt}
        ?escapeKeyAction=${confirmPrompt}
        @closed=${this._dialogClosed}
        defaultAction="ignore"
        .heading=${this._params.title
          ? this._params.title
          : this._params.confirmation &&
            this.hass.localize("ui.dialogs.generic.default_confirmation_title")}
      >
        <div>
          ${this._params.text
            ? html`
                <p
                  class=${classMap({
                    "no-bottom-padding": Boolean(this._params.prompt),
                    warning: Boolean(this._params.warning),
                  })}
                >
                  ${this._params.text}
                </p>
              `
            : ""}
          ${this._params.prompt
            ? html`
                <ha-textfield
                  dialogInitialFocus
                  .value=${this._value}
                  @keyup=${this._handleKeyUp}
                  @change=${this._valueChanged}
                  .label=${this._params.inputLabel
                    ? this._params.inputLabel
                    : ""}
                  .type=${this._params.inputType
                    ? this._params.inputType
                    : "text"}
                ></ha-textfield>
              `
            : ""}
        </div>
        ${confirmPrompt &&
        html`
          <mwc-button @click=${this._dismiss} slot="secondaryAction">
            ${this._params.dismissText
              ? this._params.dismissText
              : this.hass.localize("ui.dialogs.generic.cancel")}
          </mwc-button>
        `}
        <mwc-button
          @click=${this._confirm}
          ?dialogInitialFocus=${!this._params.prompt}
          slot="primaryAction"
        >
          ${this._params.confirmText
            ? this._params.confirmText
            : this.hass.localize("ui.dialogs.generic.ok")}
        </mwc-button>
      </ha-dialog>
    `;
  }

  private _valueChanged(ev) {
    this._value = ev.target.value;
  }

  private _dismiss(): void {
    if (this._params?.cancel) {
      this._params.cancel();
    }
    this._close();
  }

  private _handleKeyUp(ev: KeyboardEvent) {
    if (ev.keyCode === 13) {
      this._confirm();
    }
  }

  private _confirm(): void {
    if (this._params!.confirm) {
      this._params!.confirm(this._value);
    }
    this._close();
  }

  private _dialogClosed(ev) {
    if (ev.detail.action === "ignore") {
      return;
    }
    this._dismiss();
  }

  private _close(): void {
    if (!this._params) {
      return;
    }
    this._params = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        :host([inert]) {
          pointer-events: initial !important;
          cursor: initial !important;
        }
        a {
          color: var(--primary-color);
        }
        p {
          margin: 0;
          padding-top: 6px;
          padding-bottom: 24px;
          color: var(--primary-text-color);
        }
        .no-bottom-padding {
          padding-bottom: 0;
        }
        .secondary {
          color: var(--secondary-text-color);
        }
        ha-dialog {
          /* Place above other dialogs */
          --dialog-z-index: 104;
        }
        .warning {
          color: var(--warning-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-box": DialogBox;
  }
}
