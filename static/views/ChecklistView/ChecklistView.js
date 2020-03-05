/* globals d3 */
import GoldenLayoutView from '../common/GoldenLayoutView.js';

class ChecklistView extends GoldenLayoutView {
  constructor (argObj) {
    argObj.resources = [
      { type: 'less', url: '/views/ChecklistView/style.less' },
      { type: 'text', url: '/views/ChecklistView/template.html' }
    ];
    super(argObj);
  }
  get title () {
    return 'Checklist';
  }
  get isEmpty () {
    return super.isEmpty || window.controller.currentTaskId === null;
  }
  setup () {
    super.setup();

    // Apply the template
    this.content.html(this.resources[1]);

    this.emptyStateDiv.text('No task selected');

    this.d3el.select('.addItem.button')
      .on('click', async () => {
        const currentTaskDoc = await window.controller.getCurrentTaskDoc();
        if (currentTaskDoc) {
          currentTaskDoc.checklist.push('Action item');
          window.controller.tasks.put(currentTaskDoc);
        }
      });

    window.controller.on('currentTaskChanged', () => {
      this.render();
    });
  }
  draw () {
    super.draw();

    if (this.isHidden || this.isLoading) {
      return;
    } else if (this.isEmpty) {
      this.d3el.select('.title').text('');
      this.d3el.select('.items').html('');
    } else {
      this.updateContents();
    }
    this.drawControls();
  }
  drawControls () {
    this.d3el.select('.controls .addItem')
      .classed('disabled', !window.controller.currentTaskId);
    this.d3el.select('.controls .delete')
      .classed('disabled', !this._selectedItem);
  }
  async updateContents () {
    let currentTaskDoc = await window.controller.getCurrentTaskDoc();

    const title = this.d3el.select('.title')
      .text(currentTaskDoc.label)
      .attr('contenteditable', window.controller.userIsAdmin ? 'true' : null)
      .on('input', function () {
        this.contentChanged = true;
        if (d3.event.inputType === 'insertParagraph') {
          // Save the changes on a regular Enter keystroke, but
          // ignore it / allow a newline if Shift+Enter is pressed
          this.blur();
        }
      }).on('blur', async function () {
        currentTaskDoc = await window.controller.getCurrentTaskDoc();
        if (this.contentChanged) {
          currentTaskDoc.label = title.text();
          await window.controller.tasks.put(currentTaskDoc);
        }
      });

    let items = this.d3el.select('.items')
      .selectAll('.item').data(currentTaskDoc.checklist, (d, i) => i);
    items.exit().remove();
    const itemsEnter = items.enter().append('li')
      .classed('item', true);
    items = items.merge(itemsEnter);

    itemsEnter.append('input')
      .attr('id', (d, i) => `item${i}`)
      .attr('type', 'checkbox');
    itemsEnter.append('label')
      .attr('for', (d, i) => `item${i}`)
      .attr('contenteditable', window.controller.userIsAdmin ? 'true' : null);
    items.select('label')
      .html(d => d)
      .on('input', function () {
        this.contentChanged = true;
        if (d3.event.inputType === 'insertParagraph') {
          // Save the changes on a regular Enter keystroke, but
          // ignore it / allow a newline if Shift+Enter is pressed
          this.blur();
        }
      })
      .on('blur', async function (d, i) {
        currentTaskDoc = await window.controller.getCurrentTaskDoc();
        if (this.contentChanged) {
          currentTaskDoc.checklist[i] = this.innerHTML;
          await window.controller.tasks.put(currentTaskDoc);
        }
      });
  }
}
export default ChecklistView;
