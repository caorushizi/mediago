import {
  BrowserState,
  BrowserUnionType,
  UPDATE_BROWSER_VIEW,
} from "../actions/browser.actions";

const initialState: BrowserState = {
  showBrowserView: false,
};

export default function main(
  state = initialState,
  action: BrowserUnionType
): BrowserState {
  switch (action.type) {
    case UPDATE_BROWSER_VIEW:
      return {
        ...state,
        showBrowserView: action.payload,
      };
    default:
      return state;
  }
}
