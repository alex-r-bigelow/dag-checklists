import GoldenLayoutView from '../common/GoldenLayoutView.js';
import SvgViewMixin from '../common/SvgViewMixin.js';

class DagView extends SvgViewMixin(GoldenLayoutView) {
  constructor (argObj) {
    argObj.resources = [
      { type: 'less', url: '/views/DagView/style.less' },
      { type: 'text', url: '/views/DagView/template.svg' },
      { type: 'text', url: '/views/DagView/controls.html' }
    ];
    super(argObj);
    this.nextTask = 0;
  }
  get title () {
    return 'DAG Editor';
  }
  setup () {
    super.setup();
    // Apply the template
    this.content.html(this.resources[1]);
    // Add some buttons outside the SVG element
    this.d3el.append('div').classed('controls', true)
      .html(this.resources[2]);

    // Attach event listeners to controls
    this.d3el.select('.addNode.button')
      .on('click', async () => {
        window.controller.tasks.put({
          _id: `task${this.nextTask}`,
          taskNumber: this.nextTask,
          checklist: []
        });
      });
    this.d3el.select('.delete.button')
      .on('click', () => {
        console.log('todo');
      });
  }
  draw () {
    super.draw();

    if (this.isHidden || this.isLoading) {
      return; // eslint-disable-line no-useless-return
    } else {
      // TODO
    }

    (async () => {
      const tasks = await window.controller.tasks
        .allDocs({ include_docs: true });
      this.nextTask = tasks.total_rows + 1;

      this.drawControls();
      this.drawGraph(tasks);
    })();
  }
  drawControls () {
    this.d3el.select('.controls')
      .style('display', window.controller.userIsAdmin ? null : 'none');
  }
  drawGraph (tasks) {
    console.log('todo: draw graph', tasks);
  }
}
export default DagView;
