import GoldenLayoutView from '../common/GoldenLayoutView.js';

class ChecklistView extends GoldenLayoutView {
  constructor (argObj) {
    argObj.resources = [
      { type: 'less', url: '/views/ChecklistView/style.less' },
      { type: 'text', url: '/views/ChecklistView/template.html' }
    ];
    super(argObj);
  }
  setup () {
    super.setup();

    // Apply the template
    this.content.html(this.resources[1]);
  }
  draw () {
    super.draw();

    if (this.isHidden || this.isLoading) {
      return; // eslint-disable-line no-useless-return
    } else {
      // TODO
    }
  }
}
export default ChecklistView;
