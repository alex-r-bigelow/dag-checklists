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

    if (window.controller.disconnected) {
      this.d3el.selectAll('.logIn.button, .signUp.button')
        .style('display', null)
        .classed('disabled', true);
      this.d3el.select('.logOut.button')
        .style('display', 'none');
      this.d3el.select('.loginStatus')
        .text('Disconnected; we\'ll attempt to sync any changes when you reconnect, but be aware that they may not make it.');
    } else if (window.controller.username === null) {
      this.d3el.selectAll('.logIn.button, .signUp.button')
        .style('display', null)
        .classed('disabled', false);
      this.d3el.select('.logOut.button')
        .style('display', 'none');
      this.d3el.select('.loginStatus')
        .text('Changes won\'t be shared until you log in.');
    } else {
      this.d3el.selectAll('.logIn.button, .signUp.button')
        .style('display', 'none');
      this.d3el.select('.logOut.button')
        .style('display', null);
      const adminStatus = window.controller.userIsAdmin ? 'admin user: ' : '';
      this.d3el.select('.loginStatus')
        .text(`Logged in as ${adminStatus}${window.controller.username}`);
    }
  }
}
export default MenuView;
