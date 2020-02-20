/* globals d3 */
import { View } from '../../node_modules/uki/dist/uki.esm.js';
import IntrospectableMixin from '../../utils/IntrospectableMixin.js';

class MenuView extends IntrospectableMixin(View) {
  constructor () {
    super(d3.select('#menu'), [
      { type: 'less', url: '/views/MenuView/style.less' },
      { type: 'text', url: '/views/MenuView/template.html' }
    ]);
  }
  setup () {
    super.setup();

    // Apply the template
    this.d3el.html(this.resources[1]);
  }
  draw () {
    super.draw();
  }
}
export default MenuView;
