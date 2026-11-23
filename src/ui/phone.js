// Phone links: real tel: links everywhere; on desktops (fine pointer, usually nothing to handle tel:)
// a click copies the number and shows a toast instead. Usage: <a href={`tel:${SHOP.tel}`} onClick={phoneClick}>
import { SHOP, finePointer } from "../data.js";
import { uiActions } from "./store.js";
import { copyText } from "./useDialog.js";

export async function phoneClick(e) {
  if (!finePointer()) return; // phones and tablets dial
  e.preventDefault();
  uiActions.toast((await copyText(SHOP.phone)) ? `Phone number copied! ${SHOP.phone}` : `Call ${SHOP.phone}`);
}
