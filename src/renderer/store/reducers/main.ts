import {
  MainState,
  MainUnionType,
  UPDATE_NOTIFY_COUNT,
} from "renderer/store/actions/main.actions";

const initialState: MainState = {
  notifyCount: 0,
};

export default function main(
  state = initialState,
  action: MainUnionType
): MainState {
  switch (action.type) {
    case UPDATE_NOTIFY_COUNT:
      return {
        ...state,
        notifyCount: action.payload,
      };
    default:
      return state;
  }
}
