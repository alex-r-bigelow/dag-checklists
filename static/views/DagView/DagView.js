import GoldenLayoutView from '../common/GoldenLayoutView.js';
import SvgViewMixin from '../common/SvgViewMixin.js';

class DagView extends SvgViewMixin(GoldenLayoutView) {
  constructor (argObj) {
    argObj.resources = [
      { type: 'less', url: '/views/DagView/style.less' },
      { type: 'text', url: '/views/DagView/template.svg' }
    ];
    super(argObj);
  }
  get title () {
    return 'DAG Editor';
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
export default DagView;
