/* globals d3, less */
import { Model } from '/node_modules/uki/dist/uki.esm.js';

class ChecklistController extends Model {
  constructor () {
    super();
    window.onresize = () => { this.renderAllViews(); };
    (async () => {
      await less.pageLoadFinished;
      // Anything that needs to guarantee that LESS has finished should
      // go after this line
    })();
  }
  renderAllViews () {
    // TODO
  }
}

window.controller = new ChecklistController();
