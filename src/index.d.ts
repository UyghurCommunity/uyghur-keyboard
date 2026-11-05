export interface SelectionResult { value: string; start: number; end: number }
export interface KeyboardOptions {
  container?: HTMLElement | ShadowRoot;
  physical?: boolean;
  direction?: 'rtl' | 'auto' | 'preserve';
  label?: string;
}
export interface KeyboardController {
  readonly element: HTMLDivElement;
  insert(text: string): boolean;
  backspace(): boolean;
  setPhysicalMapping(enabled: boolean): void;
  setVisible(visible: boolean): void;
  destroy(): void;
}
export interface UyghurKeyboardElement extends HTMLElement {
  insert(text: string): boolean;
  backspace(): boolean;
}
export const KEY_LAYOUT: readonly (readonly string[])[];
export const PHONETIC_MAP: Readonly<Record<string, string>>;
export function replaceSelection(value: string, start: number | null, end: number | null, text: string): SelectionResult;
export function deleteSelectionBackward(value: string, start: number | null, end: number | null): SelectionResult;
export function createKeyboard(target: HTMLInputElement | HTMLTextAreaElement, options?: KeyboardOptions): KeyboardController;
export function defineUyghurKeyboard(name?: string, registry?: CustomElementRegistry): CustomElementConstructor | null;
declare global { interface HTMLElementTagNameMap { 'uyghur-keyboard': UyghurKeyboardElement } }
