export interface BrowserState {
  showBrowserView: boolean;
}

export const UPDATE_BROWSER_VIEW = "UPDATE_BROWSER_VIEW";

export interface SetBrowserView {
  type: typeof UPDATE_BROWSER_VIEW;
  payload: boolean;
}

export const setBrowserView = (show: boolean): SetBrowserView => ({
  type: UPDATE_BROWSER_VIEW,
  payload: show,
});

export type BrowserUnionType = SetBrowserView;
